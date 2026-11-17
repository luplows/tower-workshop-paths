import { expect, test } from '@playwright/test'

// OQ-139: on a touch screen WebKit keeps :hover on a tapped button. CI runs
// Chromium, which cannot show that, so this checks the stylesheets instead: no
// :hover rule may apply on a device that cannot hover.
test.use({ hasTouch: true, isMobile: true })

// Lists every rule that declares something, has :hover in its selector or an
// enclosing one, and applies here. It descends into @media rules, applying
// only where their media matches, and into every other rule's nested rules,
// style rules included, so CSS nesting such as `.a { &:hover { ... } }` counts.
const applyingHoverRules = (page) =>
  page.evaluate(() => {
    const found = []
    const walk = (rules, applies, hovered, selectors) => {
      for (const rule of rules) {
        if (rule.media && rule.cssRules) {
          walk(
            rule.cssRules,
            applies && window.matchMedia(rule.media.mediaText).matches,
            hovered,
            selectors,
          )
          continue
        }
        const chain = rule.selectorText ? [...selectors, rule.selectorText] : selectors
        const hover = hovered || Boolean(rule.selectorText?.includes(':hover'))
        if (hover && applies && rule.style?.length) found.push(chain.join(' { '))
        if (rule.cssRules) walk(rule.cssRules, applies, hover, chain)
      }
    }
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      walk(rules, true, false, [])
    }
    return found
  })

test('no :hover rule applies on a device that cannot hover', async ({ page }) => {
  await page.goto('/')

  const noHover = await page.evaluate(() => window.matchMedia('(hover: none)').matches)
  expect(noHover, 'touch emulation should report (hover: none)').toBe(true)

  expect(await applyingHoverRules(page)).toEqual([])
})

test('the walk finds a nested :hover rule that applies, and skips a guarded one', async ({ page }) => {
  await page.goto('/')
  await page.addStyleTag({
    content: `
      .probe-outer:hover { & > span { color: red; } }
      .probe-inner { &:hover { background: red; } }
      @media (hover: hover) { .probe-guarded { &:hover { background: red; } } }
    `,
  })

  expect(await applyingHoverRules(page)).toEqual([
    '.probe-outer:hover { & > span',
    '.probe-inner { &:hover',
  ])
})

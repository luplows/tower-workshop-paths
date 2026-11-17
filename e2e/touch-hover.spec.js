import { expect, test } from '@playwright/test'

// OQ-139: on a touch screen WebKit keeps :hover on a tapped button. CI runs
// Chromium, which cannot show that, so this checks the stylesheets instead: no
// :hover rule may apply on a device that cannot hover.
test.use({ hasTouch: true, isMobile: true })

test('no :hover rule applies on a device that cannot hover', async ({ page }) => {
  await page.goto('/')

  const noHover = await page.evaluate(() => window.matchMedia('(hover: none)').matches)
  expect(noHover, 'touch emulation should report (hover: none)').toBe(true)

  const applying = await page.evaluate(() => {
    const found = []
    const walk = (rules, applies) => {
      for (const rule of rules) {
        if (rule.media) {
          walk(rule.cssRules, applies && window.matchMedia(rule.media.mediaText).matches)
        } else if (rule.selectorText && rule.selectorText.includes(':hover') && applies) {
          found.push(rule.selectorText)
        } else if (rule.cssRules && !rule.selectorText) {
          walk(rule.cssRules, applies)
        }
      }
    }
    for (const sheet of document.styleSheets) {
      let rules
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      walk(rules, true)
    }
    return found
  })

  expect(applying).toEqual([])
})

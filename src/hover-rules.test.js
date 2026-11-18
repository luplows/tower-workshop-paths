// @vitest-environment node

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// WebKit on a touch screen applies :hover on a tap and keeps it until the next
// tap elsewhere, so a button stays highlighted after the screen around it has
// changed (OQ-139). Every :hover rule must sit in @media (hover: hover), and
// each must have an :active twin outside any @media (hover: ...) block with the
// same declarations, so a press still shows the look while the button is held.

const srcDir = fileURLToPath(new URL('./', import.meta.url))

const cssFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Walks the stylesheet, tracking the stack of enclosing at-rule preludes, and
// returns every plain style rule as { selector, declarations, atRules }.
const rulesIn = (css) => {
  const rules = []
  const stack = []
  let start = 0
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      const prelude = normalize(css.slice(start, i))
      const closes = css.indexOf('}', i)
      const nextOpen = css.indexOf('{', i + 1)
      if (prelude.startsWith('@') && prelude !== '@font-face') {
        stack.push(prelude)
      } else if (nextOpen === -1 || closes < nextOpen) {
        rules.push({
          selector: prelude,
          declarations: normalize(css.slice(i + 1, closes)),
          atRules: [...stack],
        })
        i = closes
      } else {
        stack.push(prelude)
      }
      start = i + 1
    } else if (css[i] === '}') {
      stack.pop()
      start = i + 1
    } else if (css[i] === ';' && stack.length === 0) {
      start = i + 1
    }
  }
  return rules
}

const inHoverMedia = (rule) =>
  rule.atRules.some((a) => /^@media\s*\(\s*hover\s*:\s*hover\s*\)$/.test(a))
const inAnyHoverMedia = (rule) => rule.atRules.some((a) => /\(\s*hover\s*:/.test(a))

describe('every :hover rule under src/ (OQ-139)', () => {
  const rules = cssFiles(srcDir).flatMap((file) =>
    rulesIn(stripComments(readFileSync(file, 'utf8'))).map((rule) => ({
      ...rule,
      file: relative(srcDir, file).replace(/\\/g, '/'),
    })),
  )
  const hoverRules = rules.filter((r) => r.selector.includes(':hover'))

  it('finds the :hover rules, so the checks below are not vacuous', () => {
    expect(hoverRules.length).toBeGreaterThan(0)
  })

  it('sits inside an @media (hover: hover) block', () => {
    const outside = hoverRules
      .filter((r) => !inHoverMedia(r))
      .map((r) => `${r.file}: ${r.selector}`)
    expect(outside).toEqual([])
  })

  it('has an :active rule outside any @media (hover: ...) block with the same declarations', () => {
    const problems = []
    for (const hover of hoverRules) {
      const activeSelector = hover.selector.replace(/:hover/g, ':active')
      const twins = rules.filter(
        (r) => r.file === hover.file && r.selector === activeSelector && !inAnyHoverMedia(r),
      )
      if (twins.length === 0) {
        problems.push(`${hover.file}: ${hover.selector} has no matching ${activeSelector} rule`)
      } else if (!twins.some((t) => t.declarations === hover.declarations)) {
        problems.push(`${hover.file}: ${hover.selector} and ${activeSelector} declare different things`)
      }
    }
    expect(problems).toEqual([])
  })
})

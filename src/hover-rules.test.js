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

// An @media block whose only condition is the hover feature: (hover: hover)
// or (hover: none).
const isHoverMedia = (prelude) => /^@media\s*\(\s*hover\s*:\s*[\w-]+\s*\)$/.test(prelude)

// Walks the stylesheet, tracking the stack of enclosing blocks, style rules and
// at-rules (@media, @supports, @container, @layer, ...) mixed at any depth, and
// returns a record for every block that is a style rule or sits inside one and
// that declares something, or has no nested blocks, as
// { path, selectors, selector, declarations, atRules }.
// - path is the stack of blocks down to and including this one, outermost
//   first, as { prelude, isAt }.
// - selectors is the chain of enclosing style selectors, outermost first, so a
//   nested rule such as `.a:hover { & > span { ... } }` keeps its :hover, and
//   declarations directly inside an at-rule nested in a style rule, as in
//   `.a:hover { @media (...) { color: red; } }`, belong to `.a:hover`.
// - atRules is every enclosing at-rule's prelude, this block's included.
// - selector names the record: the path's preludes joined with ' { ', leaving
//   out @media (hover: ...) blocks, so a guarded rule and its unguarded :active
//   twin can be compared, while every other condition must match.
// Declarations in an at-rule with no enclosing style rule, such as @font-face,
// belong to no selector and are skipped.
const rulesIn = (css) => {
  const rules = []
  const stack = []
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const top = stack[stack.length - 1]
    if (css[i] === '{') {
      const prelude = normalize(css.slice(start, i))
      if (top) top.nested = true
      stack.push({ prelude, isAt: prelude.startsWith('@'), declarations: '', nested: false })
      start = i + 1
    } else if (css[i] === ';') {
      if (top) top.declarations += `${css.slice(start, i + 1)} `
      start = i + 1
    } else if (css[i] === '}') {
      if (top) top.declarations += css.slice(start, i)
      const path = stack.map(({ prelude, isAt }) => ({ prelude, isAt }))
      stack.pop()
      const selectors = path.filter((b) => !b.isAt).map((b) => b.prelude)
      if (top && selectors.length > 0 && (normalize(top.declarations) || !top.nested)) {
        rules.push({
          path,
          selectors,
          selector: nameOf(path),
          declarations: normalize(top.declarations),
          atRules: path.filter((b) => b.isAt).map((b) => b.prelude),
        })
      }
      start = i + 1
    }
  }
  return rules
}

const nameOf = (path) =>
  path
    .filter((b) => !(b.isAt && isHoverMedia(b.prelude)))
    .map((b) => b.prelude)
    .join(' { ')

const inHoverMedia = (rule) =>
  rule.atRules.some((a) => /^@media\s*\(\s*hover\s*:\s*hover\s*\)$/.test(a))
const inAnyHoverMedia = (rule) => rule.atRules.some((a) => /\(\s*hover\s*:/.test(a))

const isHoverRule = (rule) => rule.selectors.some((s) => s.includes(':hover'))

// Returns the guard's findings for rules from rulesIn, each tagged with a file:
// hover rules outside @media (hover: hover), and hover rules without an :active
// twin outside any @media (hover: ...) block, under the same other conditions,
// that declares the same things.
const hoverProblems = (rules) => {
  const hoverRules = rules.filter(isHoverRule)
  const outside = hoverRules
    .filter((r) => !inHoverMedia(r))
    .map((r) => `${r.file}: ${r.selector}`)
  const unpaired = []
  for (const hover of hoverRules) {
    const activeSelector = nameOf(
      hover.path.map((b) => (b.isAt ? b : { ...b, prelude: b.prelude.replace(/:hover/g, ':active') })),
    )
    const twins = rules.filter(
      (r) => r.file === hover.file && r.selector === activeSelector && !inAnyHoverMedia(r),
    )
    if (twins.length === 0) {
      unpaired.push(`${hover.file}: ${hover.selector} has no matching ${activeSelector} rule`)
    } else if (!twins.some((t) => t.declarations === hover.declarations)) {
      unpaired.push(`${hover.file}: ${hover.selector} and ${activeSelector} declare different things`)
    }
  }
  return { hoverRules, outside, unpaired }
}

const checkCss = (css) =>
  hoverProblems(rulesIn(stripComments(css)).map((rule) => ({ ...rule, file: 'probe.css' })))

describe('every :hover rule under src/ (OQ-139)', () => {
  const rules = cssFiles(srcDir).flatMap((file) =>
    rulesIn(stripComments(readFileSync(file, 'utf8'))).map((rule) => ({
      ...rule,
      file: relative(srcDir, file).replace(/\\/g, '/'),
    })),
  )
  const { hoverRules, outside, unpaired } = hoverProblems(rules)

  it('finds the :hover rules, so the checks below are not vacuous', () => {
    expect(hoverRules.length).toBeGreaterThan(0)
  })

  it('sits inside an @media (hover: hover) block', () => {
    expect(outside).toEqual([])
  })

  it('has an :active rule outside any @media (hover: ...) block with the same declarations', () => {
    expect(unpaired).toEqual([])
  })
})

describe('the :hover guard on nested CSS (OQ-139)', () => {
  it('catches a :hover in an enclosing selector, unguarded and unpaired', () => {
    const { outside, unpaired } = checkCss('.probe:hover { & > span { color: red; } }')
    expect(outside).toEqual(['probe.css: .probe:hover { & > span'])
    expect(unpaired).toEqual([
      'probe.css: .probe:hover { & > span has no matching .probe:active { & > span rule',
    ])
  })

  it('catches a nested &:hover rule, unguarded and unpaired', () => {
    const { outside, unpaired } = checkCss('.probe { &:hover { background: red; } }')
    expect(outside).toEqual(['probe.css: .probe { &:hover'])
    expect(unpaired).toEqual(['probe.css: .probe { &:hover has no matching .probe { &:active rule'])
  })

  it('catches a nested :active twin that declares something different', () => {
    const { unpaired } = checkCss(`
      @media (hover: hover) { .probe { &:hover { background: red; } } }
      .probe { &:active { background: blue; } }
    `)
    expect(unpaired).toEqual(['probe.css: .probe { &:hover and .probe { &:active declare different things'])
  })

  it('passes nested :hover rules that are guarded and paired', () => {
    const { hoverRules, outside, unpaired } = checkCss(`
      @media (hover: hover) {
        .probe:hover { & > span { color: red; } }
        .other { &:hover { background: red; } }
      }
      .probe:active { & > span { color: red; } }
      .other { &:active { background: red; } }
    `)
    expect(hoverRules).toHaveLength(2)
    expect(outside).toEqual([])
    expect(unpaired).toEqual([])
  })

  it('catches a :hover whose declarations sit only in a nested @media, unguarded and unpaired', () => {
    const { outside, unpaired } = checkCss('.probe:hover { @media (min-width: 0px) { color: red; } }')
    expect(outside).toEqual(['probe.css: .probe:hover { @media (min-width: 0px)'])
    expect(unpaired).toEqual([
      'probe.css: .probe:hover { @media (min-width: 0px) has no matching .probe:active { @media (min-width: 0px) rule',
    ])
  })

  it('catches the same inside @media (hover: hover) with no :active twin', () => {
    const { outside, unpaired } = checkCss(
      '@media (hover: hover) { .probe:hover { @media (min-width: 0px) { color: red; } } }',
    )
    expect(outside).toEqual([])
    expect(unpaired).toEqual([
      'probe.css: .probe:hover { @media (min-width: 0px) has no matching .probe:active { @media (min-width: 0px) rule',
    ])
  })

  it('passes the same when its :active twin is written the same way', () => {
    const { hoverRules, outside, unpaired } = checkCss(`
      @media (hover: hover) { .probe:hover { @media (min-width: 0px) { color: red; } } }
      .probe:active { @media (min-width: 0px) { color: red; } }
    `)
    expect(hoverRules).toHaveLength(1)
    expect(outside).toEqual([])
    expect(unpaired).toEqual([])
  })

  it('follows style rules and at-rules mixed two levels deep', () => {
    const nested = (state) =>
      `.probe { @media (min-width: 0px) { &${state} { @supports (display: grid) { color: red; } } } }`
    const name = (state) => `.probe { @media (min-width: 0px) { &${state} { @supports (display: grid)`

    const bare = checkCss(nested(':hover'))
    expect(bare.outside).toEqual([`probe.css: ${name(':hover')}`])
    expect(bare.unpaired).toEqual([`probe.css: ${name(':hover')} has no matching ${name(':active')} rule`])

    const paired = checkCss(`@media (hover: hover) { ${nested(':hover')} } ${nested(':active')}`)
    expect(paired.hoverRules).toHaveLength(1)
    expect(paired.outside).toEqual([])
    expect(paired.unpaired).toEqual([])

    const differing = checkCss(
      `@media (hover: hover) { ${nested(':hover')} } ${nested(':active').replace('red', 'blue')}`,
    )
    expect(differing.unpaired).toEqual([
      `probe.css: ${name(':hover')} and ${name(':active')} declare different things`,
    ])
  })
})

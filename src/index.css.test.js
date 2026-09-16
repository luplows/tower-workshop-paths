// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// index.css can't express the dark palette as one selector -- a selector
// list can't span in and out of a @media block -- so the OS-preference path
// (`@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) `)
// and the explicit-override path (`:root[data-theme='dark']`) each declare
// the palette separately, with only a comment asking that they stay in sync
// (OQ-44). This parses both blocks out of the real stylesheet and asserts
// they declare the same custom properties with the same values, so a drift
// between them fails here -- naming the exact property that disagrees --
// instead of showing up as an unexplained pixel diff in a screenshot.

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

// Pulls the custom-property declarations (`--foo: bar;`) out of a `{ ... }`
// block body into a plain object, ignoring declaration order and
// indentation -- both are free to differ between the two blocks.
const customPropsFrom = (blockBody) => {
  const props = {}
  for (const declaration of blockBody.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    if (!name.startsWith('--')) continue
    props[name] = declaration.slice(colon + 1).trim().replace(/\s+/g, ' ')
  }
  return props
}

const extractBlock = (pattern) => {
  const match = css.match(pattern)
  if (!match) throw new Error(`index.css: expected to find a block matching ${pattern}`)
  return customPropsFrom(match[1])
}

describe('index.css dark palette', () => {
  it('declares the same custom properties, with the same values, under prefers-color-scheme and under data-theme', () => {
    const mediaQueryBlock = extractBlock(
      /@media \(prefers-color-scheme: dark\)\s*{\s*:root:not\(\[data-theme='light'\]\)\s*{([^}]*)}/,
    )
    const dataThemeBlock = extractBlock(/:root\[data-theme='dark'\]\s*{([^]*?--shadow:[^}]*)}/)

    expect(Object.keys(mediaQueryBlock).length).toBeGreaterThan(0)
    expect(dataThemeBlock).toEqual(mediaQueryBlock)
  })
})

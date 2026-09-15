import { describe, expect, it } from 'vitest'
import { checklistLevels, classify, parseAbbreviated } from './verify-workshop-costs.mjs'

describe('checklistLevels', () => {
  it('picks Lv1, the midpoint, and the last covered index -- matching OQ-1-Checklist.md', () => {
    // Damage: quantity 6000 -> Lv1, Lv2999, Lv5999 (checklist's own values).
    expect(checklistLevels(6000)).toEqual([1, 2999, 5999])
    // Attack Speed: quantity 99 -> Lv1, Lv49, Lv98.
    expect(checklistLevels(99)).toEqual([1, 49, 98])
    // Multishot Targets: quantity 7 -> Lv1, Lv3, Lv6.
    expect(checklistLevels(7)).toEqual([1, 3, 6])
  })

  it('de-duplicates when a tiny ceiling collapses two of the three indices together', () => {
    // Orbs: quantity 4 -> maxIndex 3, midIndex 1 -- collides with Lv1 itself.
    expect(checklistLevels(4)).toEqual([1, 3])
  })
})

describe('parseAbbreviated', () => {
  it('parses a plain number with no suffix', () => {
    expect(parseAbbreviated('55')).toBe(55)
    expect(parseAbbreviated('1,255,458')).toBe(1255458)
  })

  it('parses every tier suffix, both our lowercase-only scheme and mytower.app capitalized K', () => {
    expect(parseAbbreviated('276.51M')).toBeCloseTo(276.51e6)
    expect(parseAbbreviated('23.61k')).toBeCloseTo(23.61e3)
    expect(parseAbbreviated('1.02K')).toBeCloseTo(1.02e3)
    expect(parseAbbreviated('19.83q')).toBeCloseTo(19.83e15)
    expect(parseAbbreviated('5.1T')).toBeCloseTo(5.1e12)
  })

  it('returns null for text it cannot parse', () => {
    expect(parseAbbreviated('not a number')).toBeNull()
    expect(parseAbbreviated('')).toBeNull()
  })
})

describe('classify', () => {
  it('is MATCH for identical strings', () => {
    expect(classify('55', '55')).toBe('MATCH')
    expect(classify('276.5M', '276.5M')).toBe('MATCH')
  })

  it('is NEAR (rounding) for a small truncate-vs-round difference', () => {
    // formatCoins truncates (276.505729...M -> 276.5M); mytower.app rounds
    // the same raw value to 276.51M -- a real, expected, non-data mismatch.
    expect(classify('276.5M', '276.51M')).toBe('NEAR (rounding)')
    // The 'k' vs 'K' site-style difference resolves the same way.
    expect(classify('1.02k', '1.02K')).toBe('NEAR (rounding)')
  })

  it('is MISMATCH for a real, meaningfully different value', () => {
    // The actual Wall Health discrepancy found by this script (OQ-38).
    expect(classify('127.62B', '33.73B')).toBe('MISMATCH')
    expect(classify('8.4M', '8.20M')).toBe('MISMATCH')
  })

  it('is MISMATCH when either side fails to parse, rather than silently passing', () => {
    expect(classify('276.5M', 'n/a')).toBe('MISMATCH')
  })
})

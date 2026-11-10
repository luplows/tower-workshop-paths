// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { TIERS, formatCoins } from './formatCoins'
import { COIN_SUFFIXES, parseCoins } from './parseCoins'

describe('parseCoins', () => {
  it('OQ-142/AC-1: reads a number with a suffix, and an optional trailing " coins"', () => {
    expect(parseCoins('1.18q')).toBe(1.18e15)
    expect(parseCoins('66.5T')).toBe(66.5e12)
    expect(parseCoins('1.18q coins')).toBe(1.18e15)
  })

  it('OQ-142/AC-1: gives the number the text writes, where multiplying by the tier would not', () => {
    expect(4.35 * 1e15).not.toBe(4.35e15)
    expect(parseCoins('4.35q')).toBe(4.35e15)
    expect(1.1 * 1e15).not.toBe(1.1e15)
    expect(parseCoins('1.1q')).toBe(1.1e15)
  })

  it('OQ-142/AC-1: suffixes are case-sensitive, q against Q and s against S', () => {
    expect(parseCoins('1q')).toBe(1e15)
    expect(parseCoins('1Q')).toBe(1e18)
    expect(parseCoins('1s')).toBe(1e21)
    expect(parseCoins('1S')).toBe(1e24)
  })

  it('OQ-142/AC-1: a decimal with each suffix', () => {
    for (const { suffix, value } of TIERS) {
      const exponent = Math.round(Math.log10(value))
      expect(parseCoins(`2.5${suffix}`), suffix).toBe(Number(`2.5e${exponent}`))
    }
  })

  it('OQ-142/AC-1: still accepts a plain number, with or without " coins"', () => {
    expect(parseCoins('1500000')).toBe(1_500_000)
    expect(parseCoins('1.5')).toBe(1.5)
    expect(parseCoins('30 coins')).toBe(30)
  })

  it('OQ-142/AC-1: ignores spaces around the amount and between the number and its suffix', () => {
    expect(parseCoins('  1.18q  ')).toBe(1.18e15)
    expect(parseCoins('1.18 q')).toBe(1.18e15)
    expect(parseCoins(' 1.18 q coins ')).toBe(1.18e15)
  })

  it('OQ-142/AC-1: returns a negative amount, for the caller to refuse', () => {
    expect(parseCoins('-5')).toBe(-5)
    expect(parseCoins('-1.5T')).toBe(-1.5e12)
  })

  it('OQ-142/AC-1: rejects another letter, an exponent, hexadecimal and a bare or trailing point', () => {
    for (const text of ['1K', '1.18x', '1e15', '0x10', '.5', '1.', '', 'coins', 'abc', 'Infinity', '1.18qq', '1.18qcoins', '1 2']) {
      expect(parseCoins(text), JSON.stringify(text)).toBeNull()
    }
  })

  it("OQ-142/AC-2: takes its suffixes from formatCoins's table, and reads back what formatCoins writes", () => {
    expect(COIN_SUFFIXES).toEqual(TIERS.map((t) => t.suffix).reverse())
    expect(parseCoins(formatCoins(30))).toBe(30)
    for (const { suffix, value } of TIERS) {
      const exponent = Math.round(Math.log10(value))
      const x = Number(`12.34e${exponent}`)
      expect(formatCoins(x), suffix).toBe(`12.34${suffix} coins`)
      expect(parseCoins(formatCoins(x)), suffix).toBe(x)
    }
  })
})

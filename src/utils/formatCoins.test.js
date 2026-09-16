// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { formatCoins } from './formatCoins'

describe('formatCoins', () => {
  it('shows a whole number under 1000 with no suffix or decimals', () => {
    expect(formatCoins(450)).toBe('450 coins')
    expect(formatCoins(30)).toBe('30 coins')
  })

  it('truncates (not rounds) a fractional value under 1000', () => {
    expect(formatCoins(573.4291)).toBe('573.42 coins')
    expect(formatCoins(573.429)).toBe('573.42 coins')
  })

  it('condenses thousands with a k suffix, truncated to 2 decimals', () => {
    expect(formatCoins(2984.6)).toBe('2.98k coins')
    expect(formatCoins(2645)).toBe('2.64k coins')
  })

  it('condenses millions with an M suffix', () => {
    expect(formatCoins(137450000)).toBe('137.45M coins')
  })

  it('drops a trailing zero/".00" instead of padding', () => {
    expect(formatCoins(2500000000)).toBe('2.5B coins')
    expect(formatCoins(5000000000)).toBe('5B coins')
  })

  it('uses T/q/Q/s/S/O for trillion and beyond, alternating case', () => {
    expect(formatCoins(1e12)).toBe('1T coins')
    expect(formatCoins(1e15)).toBe('1q coins')
    expect(formatCoins(1e18)).toBe('1Q coins')
    expect(formatCoins(1e21)).toBe('1s coins')
    expect(formatCoins(1e24)).toBe('1S coins')
    expect(formatCoins(1e27)).toBe('1O coins')
  })

  it('truncates rather than rounds right at a .xx5 boundary', () => {
    // 2.645k would round up to 2.65k, but truncation must keep it at 2.64k.
    expect(formatCoins(2645)).toBe('2.64k coins')
  })

  it('is not tripped up by floating-point error at an exact tier boundary', () => {
    // 5e9 / 1e9 can land a hair under 5 in floating point; the result
    // should still read as an exact "5B", not "4.99B".
    expect(formatCoins(5e9)).toBe('5B coins')
  })
})

// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { enhancementDiscountMultiplier, enhancementDiscountPercent } from './enhancementDiscount'

describe('enhancementDiscountPercent', () => {
  it('is 0 at level 0', () => {
    expect(enhancementDiscountPercent(0)).toBe(0)
  })

  it('is 0.3% per level', () => {
    expect(enhancementDiscountPercent(1)).toBeCloseTo(0.3)
    expect(enhancementDiscountPercent(10)).toBeCloseTo(3)
  })

  it('caps at 30% at the max level (100)', () => {
    expect(enhancementDiscountPercent(100)).toBeCloseTo(30)
  })
})

describe('enhancementDiscountMultiplier', () => {
  it('is 1 (no discount) at level 0', () => {
    expect(enhancementDiscountMultiplier(0)).toBe(1)
  })

  it('reduces cost by the discount fraction', () => {
    // Level 10 = 3% off -> 0.97x cost.
    expect(enhancementDiscountMultiplier(10)).toBeCloseTo(0.97)
  })

  it('is 0.7 at the max level (30% off)', () => {
    expect(enhancementDiscountMultiplier(100)).toBeCloseTo(0.7)
  })
})

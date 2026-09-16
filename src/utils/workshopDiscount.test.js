// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  formatDiscountPercent,
  workshopDiscountMultiplier,
  workshopDiscountPercent,
} from './workshopDiscount'

describe('workshopDiscountPercent', () => {
  it('is 0 at level 0 for every tree', () => {
    expect(workshopDiscountPercent('attack', 0)).toBe(0)
    expect(workshopDiscountPercent('defense', 0)).toBe(0)
    expect(workshopDiscountPercent('utility', 0)).toBe(0)
  })

  it('is 0.5% per level', () => {
    expect(workshopDiscountPercent('attack', 1)).toBe(0.5)
    expect(workshopDiscountPercent('attack', 10)).toBe(5)
  })

  it('caps at 49.5% at the max level (99)', () => {
    expect(workshopDiscountPercent('attack', 99)).toBe(49.5)
  })

  it('is independent per tree', () => {
    expect(workshopDiscountPercent('defense', 20)).toBe(10)
    expect(workshopDiscountPercent('attack', 0)).toBe(0)
  })

  it('is 0 for anything that is not a Workshop tree (Lab costs, unlock-group costs, Enhancements)', () => {
    expect(workshopDiscountPercent('lab', 50)).toBe(0)
    expect(workshopDiscountPercent('enhancement', 50)).toBe(0)
    expect(workshopDiscountPercent(undefined, 50)).toBe(0)
  })
})

describe('workshopDiscountMultiplier', () => {
  it('is 1 (no discount) at level 0', () => {
    expect(workshopDiscountMultiplier('attack', 0)).toBe(1)
  })

  it('reduces cost by the discount fraction', () => {
    // Level 10 = 5% off -> 0.95x cost.
    expect(workshopDiscountMultiplier('attack', 10)).toBeCloseTo(0.95)
  })

  it('is 0.505 at the max level (49.5% off)', () => {
    expect(workshopDiscountMultiplier('attack', 99)).toBeCloseTo(0.505)
  })
})

describe('formatDiscountPercent', () => {
  it('formats to 1 decimal place with an "off" suffix', () => {
    expect(formatDiscountPercent(0)).toBe('0.0% off')
    expect(formatDiscountPercent(4.5)).toBe('4.5% off')
    expect(formatDiscountPercent(49.5)).toBe('49.5% off')
  })
})

import { describe, expect, it } from 'vitest'
import { enhancementValue, formatEnhancementValue } from './enhancementValue'

describe('enhancementValue', () => {
  it('is 1x at level 0', () => {
    expect(enhancementValue(0)).toBe(1)
  })

  it('adds 1% per level', () => {
    expect(enhancementValue(40)).toBeCloseTo(1.4)
    expect(enhancementValue(100)).toBeCloseTo(2)
  })
})

describe('formatEnhancementValue', () => {
  it('formats as a two-decimal multiplier', () => {
    expect(formatEnhancementValue(0)).toBe('1.00×')
    expect(formatEnhancementValue(40)).toBe('1.40×')
  })
})

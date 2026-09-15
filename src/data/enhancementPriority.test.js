import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_PRIORITY_RATIOS, FALLBACK_RATIO, priorityRatio } from './enhancementPriority'

describe('priorityRatio', () => {
  it("returns the eHP set's own ratio for each of its 6 named categories", () => {
    expect(priorityRatio('Coin Bonus')).toBe(1)
    expect(priorityRatio('Enemy Level Skip')).toBe(1)
    expect(priorityRatio('Cells/Kill Bonus')).toBe(1 / 32)
    expect(priorityRatio('Health Regen')).toBe(1 / 8)
    expect(priorityRatio('Health')).toBe(1 / 16)
    expect(priorityRatio('Orb Size')).toBe(1 / 128)
  })

  it("falls back to FALLBACK_RATIO (Orb Size's own ratio) for any other name", () => {
    // Unranked Enhancement categories and Workshop upgrade names alike --
    // this function has no notion of which kind of item a name belongs to.
    expect(priorityRatio('Rend Armor')).toBe(FALLBACK_RATIO)
    expect(priorityRatio('Damage')).toBe(FALLBACK_RATIO)
    expect(priorityRatio('Workshop Enhancements Lab')).toBe(FALLBACK_RATIO)
    expect(FALLBACK_RATIO).toBe(ENHANCEMENT_PRIORITY_RATIOS['Orb Size'])
  })
})

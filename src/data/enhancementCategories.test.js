import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from './enhancementCategories'

describe('ENHANCEMENT_CATEGORIES', () => {
  it('has the three in-game trees, in order', () => {
    expect(ENHANCEMENT_CATEGORIES.map((c) => c.id)).toEqual([
      'attack',
      'defense',
      'utility',
    ])
    expect(ENHANCEMENT_CATEGORIES.map((c) => c.label)).toEqual([
      'Attack Enhancements',
      'Defense Enhancements',
      'Utility Enhancements',
    ])
  })

  it('gives every tree exactly 6 categories with one free starter', () => {
    for (const category of ENHANCEMENT_CATEGORIES) {
      expect(category.upgrades).toHaveLength(6)
      const freeStarters = category.upgrades.filter((u) => u.unlocksAt === null)
      expect(freeStarters).toHaveLength(1)
    }
  })

  it('gates the other 5 categories per tree behind the shared threshold progression', () => {
    for (const category of ENHANCEMENT_CATEGORIES) {
      const thresholds = category.upgrades
        .map((u) => u.unlocksAt)
        .filter((threshold) => threshold !== null)
      expect(thresholds).toEqual([50e9, 500e9, 5e12, 50e12, 500e12])
    }
  })

  it('puts Health as the Defense tree free starter, not Attack or Utility', () => {
    const namesByCategory = Object.fromEntries(
      ENHANCEMENT_CATEGORIES.map((c) => [c.id, c.upgrades.map((u) => u.name)]),
    )
    expect(namesByCategory.defense).toContain('Health')
    expect(namesByCategory.attack).not.toContain('Health')
    expect(namesByCategory.utility).not.toContain('Health')
  })
})

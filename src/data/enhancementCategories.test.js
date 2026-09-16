// @vitest-environment node

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
      'Attack',
      'Defense',
      'Utility',
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

  it('gives every category a positive integer max level', () => {
    for (const category of ENHANCEMENT_CATEGORIES) {
      for (const upgrade of category.upgrades) {
        expect(upgrade.quantity).toBeGreaterThan(0)
      }
    }
  })

  // Change-detection tripwire, not a correctness assertion: this data is
  // hand-transcribed from the community sheet (see the comment atop
  // enhancementCategories.js), so a snapshot update here should always be a
  // deliberate, reviewed choice -- confirm it reflects a real correction to
  // the source data, not an accidental edit.
  it('matches the known category/quantity structure (snapshot)', () => {
    const structure = ENHANCEMENT_CATEGORIES.map((category) => ({
      id: category.id,
      upgrades: category.upgrades.map((u) => ({
        name: u.name,
        quantity: u.quantity,
      })),
    }))
    expect(structure).toMatchSnapshot()
  })
})

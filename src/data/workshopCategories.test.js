import { describe, expect, it } from 'vitest'
import { WORKSHOP_CATEGORIES } from './workshopCategories'

describe('WORKSHOP_CATEGORIES', () => {
  it('has the three in-game tabs, in order', () => {
    expect(WORKSHOP_CATEGORIES.map((c) => c.id)).toEqual([
      'attack',
      'defense',
      'utility',
    ])
    expect(WORKSHOP_CATEGORIES.map((c) => c.label)).toEqual([
      'Attack',
      'Defense',
      'Utility',
    ])
  })

  it('gives every category a non-empty list of upgrades with a name and quantity', () => {
    for (const category of WORKSHOP_CATEGORIES) {
      expect(category.upgrades.length).toBeGreaterThan(0)
      for (const upgrade of category.upgrades) {
        expect(typeof upgrade.name).toBe('string')
        expect(upgrade.quantity).toBeGreaterThan(0)
      }
    }
  })

  it('puts Health under Defense, not Attack or Utility', () => {
    const namesByCategory = Object.fromEntries(
      WORKSHOP_CATEGORIES.map((c) => [c.id, c.upgrades.map((u) => u.name)]),
    )
    expect(namesByCategory.defense).toContain('Health')
    expect(namesByCategory.attack).not.toContain('Health')
    expect(namesByCategory.utility).not.toContain('Health')
  })

  // Change-detection tripwire, not a correctness assertion: fails if a
  // re-run of scripts/extract-workshop-data.mjs ever adds/removes/
  // reorders an upgrade or changes a quantity, so an upstream game patch
  // gets a reviewable diff instead of silently reshaping the Workshop. A
  // snapshot update here should always be a deliberate, reviewed choice
  // -- see Open-Questions.md's OQ-39.
  it('matches the known upgrade/quantity structure (snapshot)', () => {
    const structure = WORKSHOP_CATEGORIES.map((category) => ({
      id: category.id,
      upgrades: category.upgrades.map((u) => ({
        name: u.name,
        quantity: u.quantity,
      })),
    }))
    expect(structure).toMatchSnapshot()
  })
})

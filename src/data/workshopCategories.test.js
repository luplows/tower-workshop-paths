import { describe, expect, it } from 'vitest'
import { WORKSHOP_CATEGORIES } from './workshopCategories'
import { WORKSHOP_QUANTITY_OVERRIDES } from './workshopQuantityOverrides'

describe('WORKSHOP_CATEGORIES', () => {
  it('has the three in-game tabs, in order', () => {
    expect(WORKSHOP_CATEGORIES.map((c) => c.id)).toEqual([
      'attack',
      'defense',
      'utility',
    ])
    expect(WORKSHOP_CATEGORIES.map((c) => c.label)).toEqual([
      'Attack Upgrades',
      'Defense Upgrades',
      'Utility Upgrades',
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

  it('applies every confirmed quantity override', () => {
    const allUpgrades = WORKSHOP_CATEGORIES.flatMap((c) => c.upgrades)
    for (const [name, expectedQuantity] of Object.entries(
      WORKSHOP_QUANTITY_OVERRIDES,
    )) {
      const upgrade = allUpgrades.find((u) => u.name === name)
      expect(upgrade, `expected an upgrade named "${name}"`).toBeDefined()
      expect(upgrade.quantity).toBe(expectedQuantity)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { getCheapestNextUpgrades } from './cheapestNextUpgrades'

describe('getCheapestNextUpgrades', () => {
  it('ranks every upgrade cheapest-first at level 0, breaking ties by name', () => {
    const { ranked, unknownCost } = getCheapestNextUpgrades({})

    expect(unknownCost).toEqual([])
    // Six upgrades tie for cheapest (30 coins) at level 0 -- alphabetical
    // order should decide among them.
    expect(ranked[0]).toMatchObject({ name: 'Attack Speed', cost: 30 })
    expect(ranked.slice(0, 6).map((e) => e.name)).toEqual([
      'Attack Speed',
      'Cash / Wave',
      'Cash Bonus',
      'Damage',
      'Health',
      'Health Regen',
    ])
    // Ascending order holds all the way through.
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i].cost).toBeGreaterThanOrEqual(ranked[i - 1].cost)
    }
  })

  it('reports currentLevel/nextLevel/category alongside cost', () => {
    const { ranked } = getCheapestNextUpgrades({})
    const damage = ranked.find((e) => e.name === 'Damage')

    expect(damage).toMatchObject({
      name: 'Damage',
      categoryId: 'attack',
      categoryLabel: 'Attack',
      currentLevel: 0,
      nextLevel: 1,
      cost: 30,
    })
  })

  it('recomputes next cost from the entered level, not always level 0', () => {
    const { ranked } = getCheapestNextUpgrades({ Damage: 5 })
    const damage = ranked.find((e) => e.name === 'Damage')

    expect(damage.currentLevel).toBe(5)
    expect(damage.nextLevel).toBe(6)
    expect(damage.cost).toBeGreaterThan(30)
  })

  it('excludes a maxed-out upgrade from the list entirely', () => {
    const { ranked, unknownCost } = getCheapestNextUpgrades({ Thorns: 99 })

    expect(ranked.find((e) => e.name === 'Thorns')).toBeUndefined()
    expect(unknownCost.find((e) => e.name === 'Thorns')).toBeUndefined()
  })

  it('moves an upgrade to unknownCost once its level exceeds available cost data', () => {
    // Health's quantity was corrected to 6000 (WORKSHOP_QUANTITY_OVERRIDES),
    // but tower-idle-toolkit's own cost table only covers levels 0-5000.
    const { ranked, unknownCost } = getCheapestNextUpgrades({ Health: 5000 })

    expect(ranked.find((e) => e.name === 'Health')).toBeUndefined()
    expect(unknownCost).toContainEqual({
      name: 'Health',
      categoryId: 'defense',
      categoryLabel: 'Defense',
      currentLevel: 5000,
      nextLevel: 5001,
    })
  })

  it('still ranks Health normally below its cost-data ceiling', () => {
    const { ranked, unknownCost } = getCheapestNextUpgrades({ Health: 4999 })

    expect(unknownCost.find((e) => e.name === 'Health')).toBeUndefined()
    const health = ranked.find((e) => e.name === 'Health')
    expect(health).toMatchObject({ currentLevel: 4999, nextLevel: 5000 })
    expect(health.cost).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { DEFAULT_ROW_CAP, getCheapestNextUpgrades } from './cheapestNextUpgrades'

// Every upgrade maxed out, so the caller can un-max just the one(s) they
// want to isolate -- lets a test see a single upgrade repeat across many
// rows without 47 other upgrades' cheap early levels crowding it out.
const maxedLevels = () => {
  const levels = {}
  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      levels[upgrade.name] = upgrade.quantity
    }
  }
  return levels
}

describe('getCheapestNextUpgrades', () => {
  it('ranks upgrades cheapest-first at level 0, breaking ties by name', () => {
    const { ranked, unknownCost } = getCheapestNextUpgrades({}, { rowCap: 20 })

    expect(unknownCost).toEqual([])
    expect(ranked.map((e) => [e.name, e.currentLevel, e.cost])).toEqual([
      ['Attack Speed', 0, 30],
      ['Cash / Wave', 0, 30],
      ['Cash Bonus', 0, 30],
      ['Damage', 0, 30],
      ['Health', 0, 30],
      ['Health Regen', 0, 30],
      ['Coins / Kill Bonus', 0, 50],
      ['Coins / Wave', 0, 50],
      ['Critical Chance', 0, 50],
      ['Critical Factor', 0, 50],
      ['Damage / Meter', 0, 50],
      ['Defense Absolute', 0, 50],
      ['Defense Percent', 0, 50],
      ['Range', 0, 50],
      ['Damage', 1, 55],
      ['Health', 1, 55],
      ['Health Regen', 1, 55],
      ['Attack Speed', 1, 56],
      ['Cash / Wave', 1, 56],
      ['Cash Bonus', 1, 56],
    ])
  })

  it('reports currentLevel/nextLevel/category on the first entry', () => {
    const { ranked } = getCheapestNextUpgrades({})

    expect(ranked[0]).toMatchObject({
      name: 'Attack Speed',
      categoryId: 'attack',
      categoryLabel: 'Attack',
      currentLevel: 0,
      nextLevel: 1,
      cost: 30,
    })
  })

  it('lets a cheap upgrade repeat consecutively when nothing else competes (OQ-19)', () => {
    const levels = maxedLevels()
    delete levels.Damage
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 4 })

    expect(ranked.map((e) => [e.currentLevel, e.nextLevel, e.cost])).toEqual([
      [0, 1, 30],
      [1, 2, 55],
      [2, 3, 88],
      [3, 4, 128],
    ])
    expect(ranked.every((e) => e.name === 'Damage')).toBe(true)
  })

  it('recomputes from the entered level, not always level 0', () => {
    const levels = maxedLevels()
    levels.Damage = 5
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 1 })

    expect(ranked).toEqual([
      {
        name: 'Damage',
        categoryId: 'attack',
        categoryLabel: 'Attack',
        currentLevel: 5,
        nextLevel: 6,
        cost: 235,
      },
    ])
  })

  it('respects a custom rowCap', () => {
    const levels = maxedLevels()
    delete levels.Damage
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 2 })

    expect(ranked).toHaveLength(2)
  })

  it('defaults to a 50-row cap', () => {
    const { ranked } = getCheapestNextUpgrades({})

    expect(DEFAULT_ROW_CAP).toBe(50)
    expect(ranked).toHaveLength(DEFAULT_ROW_CAP)
  })

  it('excludes a maxed-out upgrade from the list entirely', () => {
    const { ranked, unknownCost } = getCheapestNextUpgrades({ Thorns: 99 })

    expect(ranked.find((e) => e.name === 'Thorns')).toBeUndefined()
    expect(unknownCost.find((e) => e.name === 'Thorns')).toBeUndefined()
  })

  it('treats an upgrade already past its cost-data ceiling as unknown, immediately', () => {
    // Health's quantity was corrected to 6000 (WORKSHOP_QUANTITY_OVERRIDES),
    // but tower-idle-toolkit's own cost table only covers levels 0-5000.
    const { ranked, unknownCost } = getCheapestNextUpgrades({ Health: 5000 })

    expect(ranked.some((e) => e.name === 'Health')).toBe(false)
    expect(unknownCost).toContainEqual({
      name: 'Health',
      categoryId: 'defense',
      categoryLabel: 'Defense',
      currentLevel: 5000,
      nextLevel: 5001,
    })
  })

  it('discovers an upgrade hitting its cost-data ceiling mid-simulation (OQ-19)', () => {
    const levels = maxedLevels()
    levels.Health = 4999
    const { ranked, unknownCost } = getCheapestNextUpgrades(levels, { rowCap: 5 })

    // One valid row (4999 -> 5000), then it gets stuck -- nothing else is
    // available in this fixture, so the simulation stops short of rowCap.
    expect(ranked).toEqual([
      {
        name: 'Health',
        categoryId: 'defense',
        categoryLabel: 'Defense',
        currentLevel: 4999,
        nextLevel: 5000,
        cost: 797447767.117206,
      },
    ])
    expect(unknownCost).toEqual([
      {
        name: 'Health',
        categoryId: 'defense',
        categoryLabel: 'Defense',
        currentLevel: 5000,
        nextLevel: 5001,
      },
    ])
  })
})

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

// name -> quantity (max level), for assertions that need to know how close
// an entered level is to max without hardcoding every upgrade's cap.
const quantityByName = Object.fromEntries(
  WORKSHOP_CATEGORIES.flatMap((category) => category.upgrades.map((u) => [u.name, u.quantity])),
)

// The upgrades whose entered `quantity` was corrected upward (OQ-13) beyond
// tower-idle-toolkit's own WORKSHOP_LEVELS cost-data ceiling (OQ-1) -- the
// only upgrades that can land in `unknownCost`, and the exact level each
// gets stuck at.
const COST_DATA_CEILINGS = {
  Health: 5000,
  'Health Regen': 5000,
  'Recovery Amount': 60,
  'Max Recovery': 50,
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

  // OQ-20: realistic, non-empty starting levels -- everything above this
  // point starts from either an all-zero or a single-upgrade-isolated
  // fixture, neither of which resembles an actual player's mixed Workshop
  // state.
  describe('realistic, non-empty starting levels (OQ-20)', () => {
    it('stays cost-ascending and sane for a mid-game mixed snapshot', () => {
      // A handful of upgrades noticeably ahead of the rest, everything else
      // untouched (still level 0) -- the shape of a real in-progress save.
      const levels = {
        Damage: 200,
        Health: 150,
        'Attack Speed': 20,
        'Coins / Wave': 10,
        'Wall Health': 300,
      }
      const { ranked, unknownCost } = getCheapestNextUpgrades(levels, { rowCap: 40 })

      expect(ranked).toHaveLength(40)
      expect(unknownCost).toEqual([])

      // Cost-ascending: a greedy cheapest-first walk can never produce a
      // step cheaper than the one before it.
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i].cost).toBeGreaterThanOrEqual(ranked[i - 1].cost)
      }

      // Sane: never recommends an already-maxed upgrade, and each
      // upgrade's own rows climb one level at a time in the order seen.
      const lastSeenLevel = {}
      for (const entry of ranked) {
        expect(entry.currentLevel).toBeLessThan(quantityByName[entry.name])
        expect(entry.nextLevel).toBe(entry.currentLevel + 1)
        const expectedStart = lastSeenLevel[entry.name] ?? (levels[entry.name] ?? 0)
        expect(entry.currentLevel).toBe(expectedStart)
        lastSeenLevel[entry.name] = entry.currentLevel + 1
      }
    })

    it("doesn't let multiple upgrades past their cost-data ceiling interfere with each other's reporting", () => {
      // All four ceiling upgrades stuck at once, everything else maxed out
      // so nothing else competes -- isolates unknownCost reporting itself.
      const levels = maxedLevels()
      for (const [name, ceiling] of Object.entries(COST_DATA_CEILINGS)) {
        levels[name] = ceiling
      }
      const { ranked, unknownCost } = getCheapestNextUpgrades(levels, { rowCap: 10 })

      expect(ranked).toEqual([])
      expect(unknownCost).toEqual([
        {
          name: 'Health',
          categoryId: 'defense',
          categoryLabel: 'Defense',
          currentLevel: 5000,
          nextLevel: 5001,
        },
        {
          name: 'Health Regen',
          categoryId: 'defense',
          categoryLabel: 'Defense',
          currentLevel: 5000,
          nextLevel: 5001,
        },
        {
          name: 'Max Recovery',
          categoryId: 'utility',
          categoryLabel: 'Utility',
          currentLevel: 50,
          nextLevel: 51,
        },
        {
          name: 'Recovery Amount',
          categoryId: 'utility',
          categoryLabel: 'Utility',
          currentLevel: 60,
          nextLevel: 61,
        },
      ])
    })

    it('stays cost-ascending with no off-by-one or infinite-loop once cheap early tiers are gone (late-game)', () => {
      // Every upgrade three levels from its own max -- including the four
      // ceiling upgrades, which land past their cost-data coverage this
      // close to (their corrected) max, the way a genuine late-game save
      // would.
      const levels = {}
      for (const category of WORKSHOP_CATEGORIES) {
        for (const upgrade of category.upgrades) {
          levels[upgrade.name] = upgrade.quantity - 3
        }
      }
      const { ranked, unknownCost } = getCheapestNextUpgrades(levels, { rowCap: 30 })

      expect(ranked.length).toBeGreaterThan(0)
      expect(ranked.length).toBeLessThanOrEqual(30)

      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i].cost).toBeGreaterThanOrEqual(ranked[i - 1].cost)
      }
      for (const entry of ranked) {
        expect(entry.currentLevel).toBeLessThan(quantityByName[entry.name])
      }

      // The four ceiling upgrades are already well past their cost-data
      // ceiling at "three levels from (corrected) max" here, so they get
      // stuck immediately, at the level this fixture entered for them.
      const unknownNames = unknownCost.map((e) => e.name).sort()
      expect(unknownNames).toEqual(Object.keys(COST_DATA_CEILINGS).sort())
      for (const entry of unknownCost) {
        expect(entry.currentLevel).toBe(quantityByName[entry.name] - 3)
      }
    })
  })
})

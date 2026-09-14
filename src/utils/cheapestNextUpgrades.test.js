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
  it('ranks upgrades cheapest-first at level 0 by batch cost, breaking ties by name (OQ-7)', () => {
    // Damage/Health/Health Regen have >1000 max levels (100-level batches);
    // most others here have 10-999 (10-level batches); Multishot Targets/
    // Bounce Shot Targets/Orbs have fewer than 10 max levels (1-level
    // "batches" -- see Project-Outline.md), so they lead the list here.
    const { ranked, unknownCost } = getCheapestNextUpgrades({}, { rowCap: 20 })

    expect(unknownCost).toEqual([])
    expect(ranked.map((e) => [e.name, e.currentLevel, e.levels, e.cost])).toEqual([
      ['Multishot Targets', 0, 1, 450],
      ['Bounce Shot Targets', 0, 1, 700],
      ['Multishot Targets', 1, 1, 2000],
      ['Critical Factor', 0, 10, 2645],
      ['Thorns', 0, 10, 2722],
      ['Cash / Wave', 0, 10, 2758],
      ['Cash Bonus', 0, 10, 2758],
      ['Defense Percent', 0, 10, 2782],
      ['Critical Chance', 0, 10, 2854],
      ['Lifesteal', 0, 10, 2932],
      ['Attack Speed', 0, 10, 2935],
      ['Damage / Meter', 0, 10, 2991],
      ['Range', 0, 10, 2991],
      ['Bounce Shot Targets', 1, 1, 3000],
      ['Orbs', 0, 1, 3000],
      ['Coins / Kill Bonus', 0, 10, 3522],
      ['Coins / Wave', 0, 10, 3522],
      ['Knockback Chance', 0, 10, 3540],
      ['Knockback Force', 0, 10, 3597],
      ['Multishot Chance', 0, 10, 4060],
    ])
  })

  it('reports currentLevel/nextLevel/levels/category on the first entry', () => {
    const { ranked } = getCheapestNextUpgrades({})

    expect(ranked[0]).toMatchObject({
      name: 'Multishot Targets',
      categoryId: 'attack',
      categoryLabel: 'Attack',
      currentLevel: 0,
      nextLevel: 1,
      levels: 1,
      cost: 450,
    })
  })

  it('uses a 1-level batch for an upgrade with fewer than 10 max levels (OQ-7)', () => {
    // Orbs has a max level of only 4 -- too few to fill even a 10-level
    // batch, so every "batch" is really just 1 level at a time.
    const levels = maxedLevels()
    levels.Orbs = 2
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 1 })

    expect(ranked).toEqual([
      {
        name: 'Orbs',
        categoryId: 'defense',
        categoryLabel: 'Defense',
        currentLevel: 2,
        nextLevel: 3,
        levels: 1,
        cost: 120000,
      },
    ])
  })

  it('lets a cheap upgrade repeat consecutively when nothing else competes (OQ-19)', () => {
    const levels = maxedLevels()
    delete levels.Damage
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 4 })

    // Damage has >1000 max levels, so each step is a 100-level batch.
    expect(ranked.map((e) => [e.currentLevel, e.nextLevel, e.levels, e.cost])).toEqual([
      [0, 100, 100, 2499617.5557601233],
      [100, 200, 100, 30363353.437774427],
      [200, 300, 100, 108337577.2629618],
      [300, 400, 100, 227682082.7876627],
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
        nextLevel: 105,
        levels: 100,
        cost: 2964837.2903208775,
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

  it('trims a batch to whatever remains when fewer than a full batch is left before max level (OQ-7)', () => {
    // Attack Speed's max is 99 (<=1000, so a 10-level batch), and 95 is
    // only 4 levels short of that -- the batch should shrink to 4, not
    // fail or overshoot past max.
    const levels = maxedLevels()
    levels['Attack Speed'] = 95
    const { ranked } = getCheapestNextUpgrades(levels, { rowCap: 1 })

    expect(ranked).toEqual([
      {
        name: 'Attack Speed',
        categoryId: 'attack',
        categoryLabel: 'Attack',
        currentLevel: 95,
        nextLevel: 99,
        levels: 4,
        cost: 459181.07339254196,
      },
    ])
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

  it('refuses a batch instead of pricing a partial one when cost data runs out mid-batch (OQ-7)', () => {
    // Health's 100-level batch starting at 4999 would span 4999-5098, but
    // cost data only covers a valid transition through level 4999 -> 5000;
    // level 5000 -> 5001 (index 5000) is a "nothing more to buy" sentinel
    // from before the OQ-13 correction. Rather than silently buying a
    // priced 1-level "batch", the whole batch is refused and Health lands
    // in unknownCost immediately, at its currently entered level.
    const levels = maxedLevels()
    levels.Health = 4999
    const { ranked, unknownCost } = getCheapestNextUpgrades(levels, { rowCap: 5 })

    expect(ranked).toEqual([])
    expect(unknownCost).toEqual([
      {
        name: 'Health',
        categoryId: 'defense',
        categoryLabel: 'Defense',
        currentLevel: 4999,
        nextLevel: 5000,
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
      // upgrade's own rows climb by one batch at a time, continuing from
      // wherever its previous row (or its entered level) left off.
      const lastSeenLevel = {}
      for (const entry of ranked) {
        expect(entry.currentLevel).toBeLessThan(quantityByName[entry.name])
        expect(entry.nextLevel).toBe(entry.currentLevel + entry.levels)
        const expectedStart = lastSeenLevel[entry.name] ?? (levels[entry.name] ?? 0)
        expect(entry.currentLevel).toBe(expectedStart)
        lastSeenLevel[entry.name] = entry.nextLevel
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
      // would. Three levels remaining is also less than every upgrade's
      // batch size (10 or 100), so this doubles as a realistic exercise of
      // partial-batch trimming across the whole roster at once.
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
        // 3 levels remain before max, less than any batch size -- except an
        // upgrade with under 10 max levels in the first place, which always
        // uses a 1-level batch regardless of how many levels remain.
        const expectedBatch = quantityByName[entry.name] < 10 ? 1 : 3
        expect(entry.levels).toBe(expectedBatch)
        expect(entry.nextLevel).toBe(entry.currentLevel + expectedBatch)
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

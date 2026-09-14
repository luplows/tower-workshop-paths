import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { DEFAULT_ROW_CAP, getCheapestNextUpgrades } from './cheapestNextUpgrades'

// Every Workshop upgrade maxed out, so the caller can un-max just the
// one(s) they want to isolate -- lets a test see a single upgrade repeat
// across many rows without 46 other upgrades' cheap early levels crowding
// it out.
const maxedWorkshopLevels = () => {
  const levels = {}
  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      levels[upgrade.name] = upgrade.quantity
    }
  }
  return levels
}

// Same idea, for Enhancements -- their cheapest level-0 cost (~5B, see
// enhancementLevels.js) is far above nearly every Workshop cost, but a
// large enough rowCap or high enough Workshop levels can still reach it, so
// Workshop-only tests that assert an exact ranked list max these out to
// stay isolated rather than relying on that cost gap.
const maxedEnhancementLevels = () => {
  const levels = {}
  for (const category of ENHANCEMENT_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      levels[upgrade.name] = upgrade.quantity
    }
  }
  return levels
}

// name -> quantity (max level), for assertions that need to know how close
// an entered level is to max without hardcoding every upgrade's cap.
// Workshop and Enhancement names overlap (e.g. "Damage"), so these are kept
// separate -- never used to look up an entry without also checking source.
const workshopQuantityByName = Object.fromEntries(
  WORKSHOP_CATEGORIES.flatMap((category) => category.upgrades.map((u) => [u.name, u.quantity])),
)

// The Workshop upgrades whose entered `quantity` was corrected upward
// (OQ-13) beyond tower-idle-toolkit's own WORKSHOP_LEVELS cost-data
// ceiling (OQ-1) -- the only upgrades that can land in `unknownCost`, and
// the exact level each gets stuck at. (ENHANCEMENT_LEVELS has no known
// gaps, so no Enhancement equivalent exists.)
const COST_DATA_CEILINGS = {
  Health: 5000,
  'Health Regen': 5000,
  'Recovery Amount': 60,
  'Max Recovery': 50,
}

describe('getCheapestNextUpgrades', () => {
  describe('Workshop upgrades (OQ-7/17/19/20)', () => {
    it('ranks upgrades cheapest-first at level 0 by batch cost, breaking ties by name (OQ-7)', () => {
      // Damage/Health/Health Regen have >1000 max levels (100-level batches);
      // most others here have 10-999 (10-level batches); Multishot Targets/
      // Bounce Shot Targets/Orbs have fewer than 10 max levels (1-level
      // "batches" -- see Project-Outline.md), so they lead the list here.
      // Enhancements maxed out -- their cheapest cost (~5B) never competes
      // this early anyway, but isolating keeps this test's intent explicit.
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        { workshopLevels: {}, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 20 },
      )

      expect(unknownCost).toEqual([])
      expect(ranked.map((e) => [e.source, e.name, e.currentLevel, e.levels, e.cost])).toEqual([
        ['workshop', 'Multishot Targets', 0, 1, 450],
        ['workshop', 'Bounce Shot Targets', 0, 1, 700],
        ['workshop', 'Multishot Targets', 1, 1, 2000],
        ['workshop', 'Critical Factor', 0, 10, 2645],
        ['workshop', 'Thorns', 0, 10, 2722],
        ['workshop', 'Cash / Wave', 0, 10, 2758],
        ['workshop', 'Cash Bonus', 0, 10, 2758],
        ['workshop', 'Defense Percent', 0, 10, 2782],
        ['workshop', 'Critical Chance', 0, 10, 2854],
        ['workshop', 'Lifesteal', 0, 10, 2932],
        ['workshop', 'Attack Speed', 0, 10, 2935],
        ['workshop', 'Damage / Meter', 0, 10, 2991],
        ['workshop', 'Range', 0, 10, 2991],
        ['workshop', 'Bounce Shot Targets', 1, 1, 3000],
        ['workshop', 'Orbs', 0, 1, 3000],
        ['workshop', 'Coins / Kill Bonus', 0, 10, 3522],
        ['workshop', 'Coins / Wave', 0, 10, 3522],
        ['workshop', 'Knockback Chance', 0, 10, 3540],
        ['workshop', 'Knockback Force', 0, 10, 3597],
        ['workshop', 'Multishot Chance', 0, 10, 4060],
      ])
    })

    it('reports currentLevel/nextLevel/levels/category/source on the first entry', () => {
      const { ranked } = getCheapestNextUpgrades({
        workshopLevels: {},
        enhancementLevels: maxedEnhancementLevels(),
      })

      expect(ranked[0]).toMatchObject({
        name: 'Multishot Targets',
        source: 'workshop',
        categoryId: 'attack',
        categoryLabel: 'Attack',
        currentLevel: 0,
        nextLevel: 1,
        levels: 1,
        cost: 450,
      })
    })

    it('uses a 1-level batch for a Workshop upgrade with fewer than 10 max levels (OQ-7)', () => {
      // Orbs has a max level of only 4 -- too few to fill even a 10-level
      // batch, so every "batch" is really just 1 level at a time.
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Orbs = 2
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Orbs',
          source: 'workshop',
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
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels.Damage
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 4 },
      )

      // Damage has >1000 max levels, so each step is a 100-level batch.
      expect(ranked.map((e) => [e.currentLevel, e.nextLevel, e.levels, e.cost])).toEqual([
        [0, 100, 100, 2499617.5557601233],
        [100, 200, 100, 30363353.437774427],
        [200, 300, 100, 108337577.2629618],
        [300, 400, 100, 227682082.7876627],
      ])
      expect(ranked.every((e) => e.name === 'Damage' && e.source === 'workshop')).toBe(true)
    })

    it('recomputes from the entered level, not always level 0', () => {
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Damage = 5
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Damage',
          source: 'workshop',
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
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels.Damage
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 2 },
      )

      expect(ranked).toHaveLength(2)
    })

    it('defaults to a 50-row cap', () => {
      const { ranked } = getCheapestNextUpgrades({})

      expect(DEFAULT_ROW_CAP).toBe(50)
      expect(ranked).toHaveLength(DEFAULT_ROW_CAP)
    })

    it('excludes a maxed-out upgrade from the list entirely', () => {
      const { ranked, unknownCost } = getCheapestNextUpgrades({
        workshopLevels: { Thorns: 99 },
      })

      expect(ranked.find((e) => e.name === 'Thorns')).toBeUndefined()
      expect(unknownCost.find((e) => e.name === 'Thorns')).toBeUndefined()
    })

    it('trims a batch to whatever remains when fewer than a full batch is left before max level (OQ-7)', () => {
      // Attack Speed's max is 99 (<=1000, so a 10-level batch), and 95 is
      // only 4 levels short of that -- the batch should shrink to 4, not
      // fail or overshoot past max.
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels['Attack Speed'] = 95
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Attack Speed',
          source: 'workshop',
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
      const { ranked, unknownCost } = getCheapestNextUpgrades({
        workshopLevels: { Health: 5000 },
      })

      expect(ranked.some((e) => e.name === 'Health')).toBe(false)
      expect(unknownCost).toContainEqual({
        name: 'Health',
        source: 'workshop',
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
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Health = 4999
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
        { rowCap: 5 },
      )

      expect(ranked).toEqual([])
      expect(unknownCost).toEqual([
        {
          name: 'Health',
          source: 'workshop',
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
        const workshopLevels = {
          Damage: 200,
          Health: 150,
          'Attack Speed': 20,
          'Coins / Wave': 10,
          'Wall Health': 300,
        }
        const { ranked, unknownCost } = getCheapestNextUpgrades(
          { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
          { rowCap: 40 },
        )

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
          expect(entry.source).toBe('workshop')
          expect(entry.currentLevel).toBeLessThan(workshopQuantityByName[entry.name])
          expect(entry.nextLevel).toBe(entry.currentLevel + entry.levels)
          const expectedStart = lastSeenLevel[entry.name] ?? (workshopLevels[entry.name] ?? 0)
          expect(entry.currentLevel).toBe(expectedStart)
          lastSeenLevel[entry.name] = entry.nextLevel
        }
      })

      it("doesn't let multiple upgrades past their cost-data ceiling interfere with each other's reporting", () => {
        // All four ceiling upgrades stuck at once, everything else maxed out
        // so nothing else competes -- isolates unknownCost reporting itself.
        const workshopLevels = maxedWorkshopLevels()
        for (const [name, ceiling] of Object.entries(COST_DATA_CEILINGS)) {
          workshopLevels[name] = ceiling
        }
        const { ranked, unknownCost } = getCheapestNextUpgrades(
          { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
          { rowCap: 10 },
        )

        expect(ranked).toEqual([])
        expect(unknownCost).toEqual([
          {
            name: 'Health',
            source: 'workshop',
            categoryId: 'defense',
            categoryLabel: 'Defense',
            currentLevel: 5000,
            nextLevel: 5001,
          },
          {
            name: 'Health Regen',
            source: 'workshop',
            categoryId: 'defense',
            categoryLabel: 'Defense',
            currentLevel: 5000,
            nextLevel: 5001,
          },
          {
            name: 'Max Recovery',
            source: 'workshop',
            categoryId: 'utility',
            categoryLabel: 'Utility',
            currentLevel: 50,
            nextLevel: 51,
          },
          {
            name: 'Recovery Amount',
            source: 'workshop',
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
        const workshopLevels = {}
        for (const category of WORKSHOP_CATEGORIES) {
          for (const upgrade of category.upgrades) {
            workshopLevels[upgrade.name] = upgrade.quantity - 3
          }
        }
        const { ranked, unknownCost } = getCheapestNextUpgrades(
          { workshopLevels, enhancementLevels: maxedEnhancementLevels() },
          { rowCap: 30 },
        )

        expect(ranked.length).toBeGreaterThan(0)
        expect(ranked.length).toBeLessThanOrEqual(30)

        for (let i = 1; i < ranked.length; i++) {
          expect(ranked[i].cost).toBeGreaterThanOrEqual(ranked[i - 1].cost)
        }
        for (const entry of ranked) {
          expect(entry.source).toBe('workshop')
          expect(entry.currentLevel).toBeLessThan(workshopQuantityByName[entry.name])
          // Only 3 levels remain before max, less than any batch size --
          // except an upgrade with under 10 max levels in the first place,
          // which always uses a 1-level batch regardless of how many
          // levels remain.
          const expectedBatch = workshopQuantityByName[entry.name] < 10 ? 1 : 3
          expect(entry.levels).toBe(expectedBatch)
          expect(entry.nextLevel).toBe(entry.currentLevel + expectedBatch)
        }

        // The four ceiling upgrades are already well past their cost-data
        // ceiling at "three levels from (corrected) max" here, so they get
        // stuck immediately, at the level this fixture entered for them.
        const unknownNames = unknownCost.map((e) => e.name).sort()
        expect(unknownNames).toEqual(Object.keys(COST_DATA_CEILINGS).sort())
        for (const entry of unknownCost) {
          expect(entry.currentLevel).toBe(workshopQuantityByName[entry.name] - 3)
        }
      })
    })
  })

  describe('Workshop Enhancements (OQ-29)', () => {
    it("ranks an Enhancement using ENHANCEMENT_LEVELS's own cost data, tagged source: enhancement", () => {
      // Every Workshop upgrade maxed out (including the same-named "Damage"
      // Workshop upgrade) so only Enhancements can appear -- also proves
      // the same-named Workshop Damage being maxed doesn't wrongly affect
      // this one, which it would if entries were ever keyed by name alone.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels.Damage
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels: maxedWorkshopLevels(), enhancementLevels },
        { rowCap: 3 },
      )

      expect(ranked).toEqual([
        {
          name: 'Damage',
          source: 'enhancement',
          categoryId: 'attack',
          categoryLabel: 'Attack',
          currentLevel: 0,
          nextLevel: 1,
          levels: 1,
          cost: 5000000000,
        },
        {
          name: 'Damage',
          source: 'enhancement',
          categoryId: 'attack',
          categoryLabel: 'Attack',
          currentLevel: 1,
          nextLevel: 2,
          levels: 1,
          cost: 5040000000,
        },
        {
          name: 'Damage',
          source: 'enhancement',
          categoryId: 'attack',
          categoryLabel: 'Attack',
          currentLevel: 2,
          nextLevel: 3,
          levels: 1,
          cost: 5110000000,
        },
      ])
    })

    it('always uses a 1-level batch for an Enhancement, even one with hundreds of max levels', () => {
      // Recovery Package's max level is 600 -- if Workshop's batching rule
      // applied, that would mean 100-level batches. It shouldn't: the
      // reminder is explicit, Enhancements are always bought 1 at a time.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels: maxedWorkshopLevels(), enhancementLevels },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Recovery Package',
          source: 'enhancement',
          categoryId: 'utility',
          categoryLabel: 'Utility',
          currentLevel: 0,
          nextLevel: 1,
          levels: 1,
          cost: 5000000000,
        },
      ])
    })

    it('interleaves Workshop and Enhancement rows in one combined ranking once Workshop runs out', () => {
      // Attack Speed (Workshop, isolated) is far cheaper than any
      // Enhancement at first, but it maxes out at level 99 after 10
      // batches (the last one trimmed to 9 levels) -- once it's gone, the
      // cheapest remaining option in this fixture is Recovery Package
      // (Enhancement, isolated), which then takes over.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Attack Speed']
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels },
        { rowCap: 12 },
      )

      expect(ranked.slice(0, 10).every((e) => e.source === 'workshop' && e.name === 'Attack Speed')).toBe(
        true,
      )
      expect(ranked[9]).toMatchObject({ currentLevel: 90, nextLevel: 99, levels: 9 })
      expect(
        ranked.slice(10).every((e) => e.source === 'enhancement' && e.name === 'Recovery Package'),
      ).toBe(true)
      expect(ranked[10]).toMatchObject({ currentLevel: 0, nextLevel: 1, levels: 1, cost: 5000000000 })
    })

    it('keeps a combined ranking cost-ascending across both sources at once', () => {
      const workshopLevels = { Damage: 200, 'Attack Speed': 20 }
      const enhancementLevels = { Damage: 5, 'Cash Bonus': 3 }
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, enhancementLevels },
        { rowCap: 45 },
      )

      expect(ranked).toHaveLength(45)
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i].cost).toBeGreaterThanOrEqual(ranked[i - 1].cost)
      }
      for (const entry of ranked) {
        expect(['workshop', 'enhancement']).toContain(entry.source)
      }
    })
  })
})

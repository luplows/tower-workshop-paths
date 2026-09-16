// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'
import { DEFAULT_ROW_CAP, getCheapestNextUpgrades } from './cheapestNextUpgrades'
import { unlockGroupKey } from './workshopUnlockGroups'

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

// Every paid Workshop upgrade-unlock group already purchased (OQ-5) -- most
// Workshop-focused tests below pair this with maxedWorkshopLevels() to
// isolate a single upgrade the same way that helper already does; without
// it, every unpurchased group's own one-time unlock cost (as low as 40
// coins) would crowd out whatever this test is actually isolating.
const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) {
      unlocked[unlockGroupKey(categoryId, group.name)] = true
    }
  }
  return unlocked
}

// name -> quantity (max level), for assertions that need to know how close
// an entered level is to max without hardcoding every upgrade's cap.
// Workshop and Enhancement names overlap (e.g. "Damage"), so these are kept
// separate -- never used to look up an entry without also checking source.
const workshopQuantityByName = Object.fromEntries(
  WORKSHOP_CATEGORIES.flatMap((category) => category.upgrades.map((u) => [u.name, u.quantity])),
)

describe('getCheapestNextUpgrades', () => {
  describe('Workshop upgrades (OQ-7/17/19/20)', () => {
    it('ranks upgrades cheapest-first at level 0 by batch cost, breaking ties by name (OQ-7)', () => {
      // Damage/Health/Health Regen have >1000 max levels (100-level batches);
      // most others here have 10-999 (10-level batches); Multishot Targets/
      // Bounce Shot Targets/Orbs have fewer than 10 max levels (1-level
      // "batches" -- see Project-Outline.md), so they lead the list here.
      // Enhancements maxed out -- their cheapest cost (~5B) never competes
      // this early anyway, but isolating keeps this test's intent explicit.
      // Every unlock group already purchased (OQ-5) -- otherwise several of
      // these upgrades wouldn't even have a cursor yet.
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        {
          workshopLevels: {},
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
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
        unlockedGroups: allUnlockedGroups(),
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
        {
          workshopLevels,
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
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
        {
          workshopLevels,
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 4 },
      )

      // Damage has >1000 max levels, so each step is a 100-level batch.
      expect(ranked.map((e) => [e.currentLevel, e.nextLevel, e.levels, e.cost])).toEqual([
        [0, 100, 100, 2499678],
        [100, 200, 100, 30363380],
        [200, 300, 100, 108388000],
        [300, 400, 100, 227660000],
      ])
      expect(ranked.every((e) => e.name === 'Damage' && e.source === 'workshop')).toBe(true)
    })

    it('recomputes from the entered level, not always level 0', () => {
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Damage = 5
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels,
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
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
          cost: 2964910,
        },
      ])
    })

    it('respects a custom rowCap', () => {
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels.Damage
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels,
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
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
        unlockedGroups: allUnlockedGroups(),
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
        {
          workshopLevels,
          enhancementLevels: maxedEnhancementLevels(),
          unlockedGroups: allUnlockedGroups(),
        },
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
          cost: 459190,
        },
      ])
    })

    // Health's cost-data ceiling used to fall short of its corrected
    // quantity (tower-idle-toolkit's WORKSHOP_LEVELS stopped at level
    // 5000, quantity was corrected to 6000 -- see OQ-13), so `ranked`/
    // `unknownCost`'s gap-handling had real, easy-to-exercise coverage
    // here (an upgrade landing in `unknownCost` the moment its next
    // batch couldn't be fully priced, including a batch refused whole
    // rather than partially priced when cost data ran out mid-batch,
    // OQ-7). The OQ-39 migration to mytower.app-sourced data resolved
    // that specific gap -- WORKSHOP_LEVELS now has no known gaps at all
    // (matching ENHANCEMENT_LEVELS, which never did) -- so this exact
    // scenario can no longer be reproduced with real data. The
    // `unknownCost`/partial-batch-refusal code itself is left in place
    // defensively (nextBatchCost, buildCandidateCursors); see the
    // module's own docstring.

    // OQ-20: realistic, non-empty starting levels -- everything above this
    // point starts from either an all-zero or a single-upgrade-isolated
    // fixture, neither of which resembles an actual player's mixed Workshop
    // state.
    describe('realistic, non-empty starting levels (OQ-20)', () => {
      it('stays cost-ascending and sane for a mid-game mixed snapshot', () => {
        // A handful of upgrades noticeably ahead of the rest, everything else
        // untouched (still level 0) -- the shape of a real in-progress save.
        // Every unlock group already purchased (OQ-5) -- this fixture is
        // about batch/cost simulation sanity, not gating, which has its own
        // describe block below.
        const workshopLevels = {
          Damage: 200,
          Health: 150,
          'Attack Speed': 20,
          'Coins / Wave': 10,
          'Wall Health': 300,
        }
        const { ranked, unknownCost } = getCheapestNextUpgrades(
          {
            workshopLevels,
            enhancementLevels: maxedEnhancementLevels(),
            unlockedGroups: allUnlockedGroups(),
          },
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

      it('stays cost-ascending with no off-by-one or infinite-loop once cheap early tiers are gone (late-game)', () => {
        // Every upgrade three levels from its own max -- including the four
        // ceiling upgrades, which land past their cost-data coverage this
        // close to (their corrected) max, the way a genuine late-game save
        // would. Three levels remaining is also less than every upgrade's
        // batch size (10 or 100), so this doubles as a realistic exercise of
        // partial-batch trimming across the whole roster at once. Every
        // unlock group already purchased (OQ-5) -- a genuine late-game save
        // would have them all bought by now anyway.
        const workshopLevels = {}
        for (const category of WORKSHOP_CATEGORIES) {
          for (const upgrade of category.upgrades) {
            workshopLevels[upgrade.name] = upgrade.quantity - 3
          }
        }
        const { ranked, unknownCost } = getCheapestNextUpgrades(
          {
            workshopLevels,
            enhancementLevels: maxedEnhancementLevels(),
            unlockedGroups: allUnlockedGroups(),
          },
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

        // Since the OQ-39 migration, every upgrade has real cost data all
        // the way to its own max (no gap -- see the removed tests just
        // above this describe block) -- nothing should land in
        // unknownCost here anymore.
        expect(unknownCost).toEqual([])
      })
    })
  })

  describe('Workshop Enhancements (OQ-29)', () => {
    it("ranks an Enhancement using ENHANCEMENT_LEVELS's own cost data, tagged source: enhancement", () => {
      // Every Workshop upgrade maxed out (including the same-named "Damage"
      // Workshop upgrade) and every unlock group already purchased (OQ-5,
      // otherwise a cheap unlock candidate would outrank a 5B Enhancement)
      // so only Enhancements can appear -- also proves the same-named
      // Workshop Damage being maxed doesn't wrongly affect this one, which
      // it would if entries were ever keyed by name alone.
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels.Damage
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLevels,
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
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
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLevels,
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
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
      // (Enhancement, isolated), which then takes over. Every unlock group
      // already purchased (OQ-5), same isolation reasoning as above.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Attack Speed']
      const enhancementLevels = maxedEnhancementLevels()
      delete enhancementLevels['Recovery Package']
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels,
          enhancementLevels,
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
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
        {
          workshopLevels,
          enhancementLevels,
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
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

  describe('Workshop Enhancements Lab gate (OQ-31)', () => {
    it('shows the Lab as the only Enhancement-related candidate while locked, regardless of entered Enhancement levels', () => {
      // Enhancement levels entered here should be completely ignored while
      // locked -- in-game, none of this is purchasable until the Lab is
      // bought, so the simulation must not offer it either. Every Workshop
      // unlock group already purchased (OQ-5) isolates this to just the
      // Lab-vs-Enhancement interaction.
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLevels: { Damage: 5, 'Cash Bonus': 3 },
          enhancementLabLevel: 0,
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 10 },
      )

      expect(ranked).toEqual([
        {
          name: 'Workshop Enhancements Lab',
          source: 'lab',
          categoryId: 'lab',
          categoryLabel: 'Lab',
          currentLevel: 0,
          nextLevel: 1,
          levels: 1,
          cost: 5_000_000_000,
        },
      ])
      expect(unknownCost).toEqual([])
    })

    it('defaults to locked when enhancementLabLevel is omitted', () => {
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels: maxedWorkshopLevels(), unlockedGroups: allUnlockedGroups() },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ name: 'Workshop Enhancements Lab', source: 'lab' }),
      ])
    })

    it('excludes the Lab and includes every Enhancement normally once bought', () => {
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 5 },
      )

      expect(ranked.some((e) => e.source === 'lab')).toBe(false)
      expect(ranked.every((e) => e.source === 'enhancement')).toBe(true)
    })

    it("doesn't let the Lab gate affect Workshop upgrades either way", () => {
      const fixture = (enhancementLabLevel) =>
        getCheapestNextUpgrades(
          {
            workshopLevels: {},
            enhancementLevels: maxedEnhancementLevels(),
            enhancementLabLevel,
            unlockedGroups: allUnlockedGroups(),
          },
          { rowCap: 5 },
        ).ranked

      // With every Enhancement maxed out and every unlock group already
      // purchased, only Workshop upgrades (and, while locked, the Lab) can
      // compete -- Workshop's own top rows should be identical regardless
      // of Lab status.
      const lockedWorkshopRows = fixture(0).filter((e) => e.source === 'workshop')
      const unlockedWorkshopRows = fixture(1)
      expect(lockedWorkshopRows).toEqual(unlockedWorkshopRows)
    })
  })

  describe('Enhancement per-tree cumulative-spend gate (OQ-6)', () => {
    it("only offers each tree's free starter category until that tree's cumulative spend crosses a threshold", () => {
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 20 },
      )

      const namesSeen = new Set(ranked.map((e) => e.name))
      expect(namesSeen).toEqual(new Set(['Damage', 'Health', 'Cash Bonus']))
      expect(ranked.every((e) => e.source === 'enhancement')).toBe(true)
      expect(unknownCost).toEqual([])
    })

    it("makes a later category in a tree a valid candidate once that tree's cumulative spend crosses its threshold", () => {
      // Damage (Attack's free starter) at level 10 has spent ~55.5B coins,
      // just past Rend Armor's 50B threshold -- everything else in Attack
      // maxed out so Rend Armor's own first level is unambiguously the
      // cheapest thing left in that tree once it becomes reachable.
      const enhancementLevels = maxedEnhancementLevels()
      enhancementLevels.Damage = 10
      delete enhancementLevels['Rend Armor']
      const { ranked } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLevels,
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Rend Armor',
          source: 'enhancement',
          categoryId: 'attack',
          categoryLabel: 'Attack',
          currentLevel: 0,
          nextLevel: 1,
          levels: 1,
          cost: 5_000_000_000,
        },
      ])
    })

    it('leaves a not-yet-unlocked category out of unknownCost too -- absent, not reported as unpriceable', () => {
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          enhancementLabLevel: 1,
          unlockedGroups: allUnlockedGroups(),
        },
        { rowCap: 3 },
      )

      expect(ranked.some((e) => e.name === 'Attack Speed')).toBe(false)
      expect(unknownCost.some((e) => e.name === 'Attack Speed')).toBe(false)
    })
  })

  describe('Workshop upgrade-unlock groups (OQ-5)', () => {
    it("excludes a locked group's upgrades entirely, offering the group's own unlock cost as a candidate instead", () => {
      // Multishot Targets/Multishot Chance belong to Attack's "Multishot
      // Upgrades" group (400 coins) -- everything else maxed out and every
      // other group pre-unlocked isolates this to just that one group.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']
      delete workshopLevels['Multishot Chance']
      const unlockedGroups = allUnlockedGroups()
      delete unlockedGroups[unlockGroupKey('attack', 'Multishot Upgrades')]
      const { ranked, unknownCost } = getCheapestNextUpgrades(
        { workshopLevels, unlockedGroups },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        {
          name: 'Multishot Upgrades',
          source: 'unlock',
          categoryId: 'attack',
          categoryLabel: 'Attack',
          currentLevel: 0,
          nextLevel: 1,
          levels: 1,
          cost: 400,
        },
      ])
      expect(unknownCost).toEqual([])
    })

    it('makes a group\'s upgrades ordinary candidates once purchased', () => {
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']
      const unlockedGroups = allUnlockedGroups() // "Multishot Upgrades" included
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, unlockedGroups },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ name: 'Multishot Targets', source: 'workshop' }),
      ])
    })

    it("never gates a tree's free \"Default\" group -- its upgrades need no unlock at all", () => {
      // Damage is in Attack's Default group (cost 0, no unlock needed), but
      // its own first batch (~2.5M, a 100-level batch) is far pricier than
      // the cheapest unlock groups -- reachable, just not the very
      // cheapest, with no unlock groups purchased at all.
      const { ranked } = getCheapestNextUpgrades({ workshopLevels: {} }, { rowCap: 50 })

      expect(ranked.some((e) => e.name === 'Damage' && e.source === 'workshop')).toBe(true)
      expect(ranked.some((e) => e.name === 'Damage' && e.source === 'unlock')).toBe(false)
    })

    it('leaves a locked group out of unknownCost too -- absent, not reported as unpriceable', () => {
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']
      delete workshopLevels['Multishot Chance']
      const unlockedGroups = allUnlockedGroups()
      delete unlockedGroups[unlockGroupKey('attack', 'Multishot Upgrades')]
      const { unknownCost } = getCheapestNextUpgrades(
        { workshopLevels, unlockedGroups },
        { rowCap: 5 },
      )

      expect(unknownCost.some((e) => e.name === 'Multishot Targets')).toBe(false)
      expect(unknownCost.some((e) => e.name === 'Multishot Chance')).toBe(false)
    })

    it("doesn't offer an already-purchased group's unlock cost again", () => {
      const unlockedGroups = allUnlockedGroups()
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels: maxedWorkshopLevels(), unlockedGroups },
        { rowCap: 50 },
      )

      expect(ranked.some((e) => e.source === 'unlock')).toBe(false)
    })

    it("unlocks in order -- a later group isn't offered (as an upgrade or as its own unlock cost) until the earlier one is bought", () => {
      // Defense's order: Default -> "Defense Upgrades" -> "Thorn Upgrades"
      // (Thorns) -> ... -- Thorns can't be reached or bought before Defense
      // Upgrades, even with every other tree's groups already purchased.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Defense Percent']
      delete workshopLevels['Defense Absolute']
      delete workshopLevels.Thorns
      const unlockedGroups = allUnlockedGroups()
      delete unlockedGroups[unlockGroupKey('defense', 'Defense Upgrades')]
      delete unlockedGroups[unlockGroupKey('defense', 'Thorn Upgrades')]
      const { ranked } = getCheapestNextUpgrades(
        { workshopLevels, unlockedGroups },
        { rowCap: 1 },
      )

      // "Defense Upgrades" (75 coins) is the only Defense candidate at all
      // -- not Thorns, not "Thorn Upgrades" (500 coins).
      expect(ranked).toEqual([
        expect.objectContaining({ name: 'Defense Upgrades', source: 'unlock', cost: 75 }),
      ])
    })

    it('offers exactly one unlock candidate per tree, never more', () => {
      // Nothing purchased anywhere -- each of the 3 trees has its own
      // single earliest paid group, never every locked group at once.
      const { ranked } = getCheapestNextUpgrades({ workshopLevels: {} }, { rowCap: 50 })

      const unlockRows = ranked.filter((e) => e.source === 'unlock')
      const namesByCategory = new Set(unlockRows.map((e) => e.categoryId))
      expect(namesByCategory.size).toBe(unlockRows.length) // no tree repeated
      expect(unlockRows.map((e) => e.name).sort()).toEqual(
        ['Cash Bonuses', 'Defense Upgrades', 'Range Upgrades'].sort(),
      )
    })
  })
})

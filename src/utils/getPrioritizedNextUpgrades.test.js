import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'
import { getPrioritizedNextUpgrades } from './cheapestNextUpgrades'
import { unlockGroupKey } from './workshopUnlockGroups'

// Same fixture helpers as cheapestNextUpgrades.test.js -- see that file's
// own comments for why each exists. Duplicated rather than shared/exported,
// matching this repo's existing per-test-file convention.
const maxedWorkshopLevels = () => {
  const levels = {}
  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      levels[upgrade.name] = upgrade.quantity
    }
  }
  return levels
}

const maxedEnhancementLevels = () => {
  const levels = {}
  for (const category of ENHANCEMENT_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      levels[upgrade.name] = upgrade.quantity
    }
  }
  return levels
}

const allUnlockedGroups = () => {
  const unlocked = {}
  for (const [categoryId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
    for (const group of groups) {
      unlocked[unlockGroupKey(categoryId, group.name)] = true
    }
  }
  return unlocked
}

describe('getPrioritizedNextUpgrades (OQ-2)', () => {
  it('ranks purely by cost before the Enhancement Lab is bought, since nothing ranked is reachable yet', () => {
    // No valid score base exists pre-Lab (resolveBaseCost returns null) --
    // every remaining candidate is a Workshop upgrade, sharing FALLBACK_RATIO,
    // so falling back to plain cheapest-cost ranking is exactly equivalent
    // to real scoring here. Matches getCheapestNextUpgrades' own top rows
    // for this same fixture (see that file's "ranks upgrades cheapest-first"
    // test) -- confirms the fallback path, not a coincidence.
    const { ranked } = getPrioritizedNextUpgrades(
      { workshopLevels: {}, unlockedGroups: allUnlockedGroups(), enhancementLabLevel: 0 },
      { rowCap: 5 },
    )

    expect(ranked.map((e) => [e.source, e.name, e.cost])).toEqual([
      ['workshop', 'Multishot Targets', 450],
      ['workshop', 'Bounce Shot Targets', 700],
      ['workshop', 'Multishot Targets', 2000],
      ['workshop', 'Critical Factor', 2645],
      ['workshop', 'Thorns', 2722],
    ])
  })

  it('ranks a ranked eHP category ahead of a cheaper fallback-ratio one (normal base: Coin Bonus itself)', () => {
    // Coin Bonus (ratio 1, unlocked, not maxed) is its own base here, so its
    // own score is always 1 -- practically unbeatable by a 1/128-ratio
    // item, even one that's individually cheaper at every level. Rend Armor
    // (Attack's own 50B-gated category, unranked by the eHP set) is cheaper
    // than Coin Bonus at every one of these levels, yet never wins a row.
    const enh = maxedEnhancementLevels()
    enh['Coin Bonus'] = 0
    enh['Rend Armor'] = 0

    const { ranked } = getPrioritizedNextUpgrades(
      {
        workshopLevels: maxedWorkshopLevels(),
        unlockedGroups: allUnlockedGroups(),
        enhancementLabLevel: 1,
        enhancementLevels: enh,
      },
      { rowCap: 5 },
    )

    expect(ranked.every((e) => e.source === 'enhancement' && e.name === 'Coin Bonus')).toBe(true)
    expect(ranked.map((e) => e.cost)).toEqual([
      5_000_000_000, 6_250_000_000, 12_460_000_000, 27_420_000_000, 54_500_000_000,
    ])
  })

  describe('while Coin Bonus is locked (Utility tree under its 50B threshold)', () => {
    it('uses the coins still needed to cross the threshold as the score base, via Cash Bonus', () => {
      // Cash Bonus at level 9 has spent 49.01B of the 50B Utility needs to
      // unlock Coin Bonus -- 0.99B (990,000,000) still needed. Health maxed
      // out so it can't itself compete (it's also a ranked category, Defense's
      // free starter) -- isolates Health Regen (Defense's own 50B-gated
      // category, ratio 1/8) as the only other ranked item in play, so a win
      // here is attributable to the locked-base mechanism, not coincidence.
      const enh = maxedEnhancementLevels()
      enh['Cash Bonus'] = 9
      enh['Health'] = 600
      enh['Health Regen'] = 0

      const { ranked, unknownCost } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
        },
        { rowCap: 5 },
      )

      expect(unknownCost).toEqual([])
      expect(ranked.every((e) => e.source === 'enhancement' && e.name === 'Health Regen')).toBe(true)
      expect(ranked.map((e) => e.cost)).toEqual([
        5_000_000_000, 5_040_000_000, 5_110_000_000, 5_200_000_000, 5_330_000_000,
      ])
    })
  })

  describe('once Coin Bonus is maxed (level 300)', () => {
    it('re-anchors to the next ranked category currently purchasable (Enemy Level Skip)', () => {
      const enh = maxedEnhancementLevels()
      enh['Coin Bonus'] = 300
      enh['Enemy Level Skip'] = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
        },
        { rowCap: 3 },
      )

      expect(ranked.every((e) => e.source === 'enhancement' && e.name === 'Enemy Level Skip')).toBe(true)
      expect(ranked.map((e) => e.cost)).toEqual([5_000_000_000, 15_500_000_000, 202_980_000_000])
    })

    it('keeps scanning past a re-anchor target that is also maxed (Enemy Level Skip -> Cells/Kill Bonus)', () => {
      const enh = maxedEnhancementLevels()
      enh['Coin Bonus'] = 300
      enh['Enemy Level Skip'] = 60 // Enemy Level Skip's own max quantity
      enh['Cells/Kill Bonus'] = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
        },
        { rowCap: 3 },
      )

      expect(ranked.every((e) => e.source === 'enhancement' && e.name === 'Cells/Kill Bonus')).toBe(true)
      expect(ranked.map((e) => e.cost)).toEqual([5_000_000_000, 6_250_000_000, 12_460_000_000])
    })
  })
})

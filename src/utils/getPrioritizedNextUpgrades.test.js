// @vitest-environment node

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
  describe('before the Enhancement Lab is bought', () => {
    it('still prefers a cheap Workshop upgrade over the Lab, since the Lab is only worth as much as the Coin Bonus chain behind it', () => {
      // The Lab is on the critical path toward Coin Bonus (see below), so it
      // scores exactly 1 here -- but a Workshop upgrade this cheap still
      // easily beats that (its own FALLBACK_RATIO-weighted score is far
      // above 1 at these costs). Matches getCheapestNextUpgrades' own top
      // rows for this same fixture (see that file's "ranks upgrades
      // cheapest-first" test) -- not a coincidence, just confirms cheap
      // Workshop upgrades keep winning regardless of the Lab's presence.
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

    it('overtakes once nothing cheaper than the effective cost of reaching Coin Bonus remains', () => {
      // From a fresh state, the effective cost of reaching Coin Bonus's own
      // first level is the Lab (5B) + all 10 Cash Bonus levels needed to
      // cross the 50B Utility threshold (~55.54B) + Coin Bonus's own real
      // level-1 cost (5B) = ~65.54B -- FALLBACK_RATIO of that is ~512M, so
      // the Lab (scored as 1) should overtake a Workshop row right around
      // there. Verified empirically rather than reproducing the batching
      // math for all 46 upgrades by hand.
      const { ranked } = getPrioritizedNextUpgrades({}, { rowCap: 50 })

      const labIndex = ranked.findIndex((entry) => entry.source === 'lab')
      expect(labIndex).toBeGreaterThan(0)
      expect(ranked[labIndex]).toMatchObject({ name: 'Workshop Enhancements Lab', cost: 5_000_000_000 })
      // The Lab's reported cost/position is real (5B), not the inflated
      // effective cost used only for scoring -- it wins the moment nothing
      // remaining costs less than ~512M, and loses to anything that does.
      expect(ranked[labIndex - 1].cost).toBeLessThan(512_000_000)
      expect(ranked[labIndex + 1].cost).toBeGreaterThan(512_000_000)
    })

    it('is the only row once every Workshop upgrade is maxed, reporting its own real cost', () => {
      const { ranked } = getPrioritizedNextUpgrades(
        { workshopLevels: maxedWorkshopLevels(), unlockedGroups: allUnlockedGroups() },
        { rowCap: 5 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ source: 'lab', name: 'Workshop Enhancements Lab', cost: 5_000_000_000 }),
      ])
    })
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

  it('never applies a ranked Enhancement ratio to a same-named Workshop upgrade', () => {
    // Workshop "Health" and "Health Regen" share the exact same per-batch
    // cost curve, but also each collide in name with a differently-ranked
    // Enhancement category (ratio 1/16 and 1/8 respectively). If the ratio
    // lookup weren't gated on source, Health Regen's higher (wrongly
    // inherited) ratio would beat Health's, reversing this order outright
    // rather than just a tie. Gated correctly, both share FALLBACK_RATIO,
    // so equal cost + equal ratio ties, and the tie-break (alphabetical)
    // puts Health first, as it would for any other same-cost pair.
    const enh = maxedEnhancementLevels()
    enh['Coin Bonus'] = 0
    const wl = maxedWorkshopLevels()
    delete wl.Health
    delete wl['Health Regen']

    const { ranked } = getPrioritizedNextUpgrades(
      {
        workshopLevels: wl,
        unlockedGroups: allUnlockedGroups(),
        enhancementLabLevel: 1,
        enhancementLevels: enh,
      },
      { rowCap: 2 },
    )

    expect(ranked.map((e) => [e.source, e.name])).toEqual([
      ['workshop', 'Health'],
      ['workshop', 'Health Regen'],
    ])
  })

  describe('while Coin Bonus is locked (Lab bought, Utility tree under its 50B threshold)', () => {
    it("treats Cash Bonus as the critical path toward Coin Bonus, outranking a ranked category it wouldn't otherwise beat", () => {
      // Every OTHER Utility category reset to 0 (not maxedEnhancementLevels'
      // default) so the tree's spend genuinely comes from Cash Bonus alone --
      // otherwise those categories' own huge spend would cross the 50B
      // threshold regardless, landing in the maxed/re-anchor branch instead
      // (see the "once Coin Bonus is maxed" tests below, and the "while
      // Coin Bonus is locked" comment that used to mislabel this same
      // mistake). Cash Bonus at level 9 has spent 49.01B of the 50B needed --
      // effective cost of reaching Coin Bonus is 0 (Lab already bought) +
      // 6.53B (the one more Cash Bonus level needed) + 5B (Coin Bonus's own
      // level-1 cost) = 11.53B. Health Regen (Defense, ratio 1/8, 5B at
      // level 0) would score (1/8 x 11.53B) / 5B = 0.288 -- Cash Bonus's
      // forced score of 1 beats it outright, not just a coincidence of cost.
      const enh = maxedEnhancementLevels()
      enh['Cash Bonus'] = 9
      enh['Coin Bonus'] = 0
      enh['Cells/Kill Bonus'] = 0
      enh['Free Upgrades'] = 0
      enh['Recovery Package'] = 0
      enh['Enemy Level Skip'] = 0
      enh['Health'] = 600
      enh['Health Regen'] = 0

      const { ranked, unknownCost } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
        },
        { rowCap: 1 },
      )

      expect(unknownCost).toEqual([])
      expect(ranked).toEqual([
        expect.objectContaining({ source: 'enhancement', name: 'Cash Bonus', cost: 6_530_000_000 }),
      ])
    })

    it('lets a cheap-enough Workshop upgrade still win over completing the Cash Bonus chain', () => {
      // Same locked setup as above (effective cost ~11.53B, so the crossover
      // is ~90M), but Range (a real, cheap Workshop upgrade) is left
      // unmaxed instead of maxing every Workshop upgrade out.
      const enh = maxedEnhancementLevels()
      enh['Cash Bonus'] = 9
      enh['Coin Bonus'] = 0
      enh['Cells/Kill Bonus'] = 0
      enh['Free Upgrades'] = 0
      enh['Recovery Package'] = 0
      enh['Enemy Level Skip'] = 0
      enh['Health'] = 600
      enh['Health Regen'] = 0
      const wl = maxedWorkshopLevels()
      delete wl.Range

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: wl,
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ source: 'workshop', name: 'Range' })])
    })

    it('stops treating Cash Bonus as the critical path the moment simulated purchases cross the threshold, rather than for the rest of the run', () => {
      // Fresh state (fully maxed Workshop, so nothing else can win the
      // critical-path override on cost alone): Cash Bonus needs exactly 10
      // simulated levels to cross the 50B threshold. Before the fix, the
      // "is Coin Bonus still locked" check only ever looked at the caller's
      // real entered levels (never updated by this run's own simulated
      // purchases), so Cash Bonus's score-1 override never turned off --
      // the reported bug was 50 straight rows of "Cash Bonus +". It should
      // be exactly 10, then something else (here, Health -- Defense's own
      // free starter, the next ranked category with a live cursor) takes
      // over, the same re-anchor mechanism the "once maxed" tests below use.
      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
        },
        { rowCap: 11 },
      )

      expect(ranked.slice(0, 10).every((e) => e.source === 'enhancement' && e.name === 'Cash Bonus')).toBe(true)
      expect(ranked[10]).toMatchObject({ source: 'enhancement', name: 'Health' })
    })
  })

  describe('once Coin Bonus is maxed (level 300)', () => {
    it('re-anchors to the next ranked category currently purchasable, skipping every other maxed ranked category first (Health Regen)', () => {
      // Every ranked category except Health Regen left at its
      // maxedEnhancementLevels() default (maxed) -- so Coin Bonus is
      // unlocked (the tree's overall spend is enormous) but has no cursor
      // (maxed), and the re-anchor scan must skip Enemy Level Skip and
      // Cells/Kill Bonus (also maxed) before landing on Health Regen.
      const enh = maxedEnhancementLevels()
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

  describe('Workshop discount Labs (OQ-4)', () => {
    it("applies a tree's discount to that tree's own Workshop upgrade costs", () => {
      // Multishot Targets (Attack) costs 450 at level 0 undiscounted --
      // level 10 in the Attack discount Lab is 5% off (450 x 0.95).
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels,
          unlockedGroups: allUnlockedGroups(),
          discountLabLevels: { attack: 10 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ name: 'Multishot Targets', cost: 427.5 })])
    })

    it("doesn't apply one tree's discount to a different tree's Workshop upgrades", () => {
      // Same fixture, but Defense's own free "Orbs" upgrade (cost 3000 at
      // level 0) is the one left unmaxed -- an Attack-only discount should
      // leave it at full price.
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Orbs = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels,
          unlockedGroups: allUnlockedGroups(),
          discountLabLevels: { attack: 99 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ name: 'Orbs', cost: 3000 })])
    })

    it("doesn't discount a tree's own one-time unlock-group cost, only its per-level upgrade costs", () => {
      // Attack's "Multishot Upgrades" group costs 400 coins flat -- even at
      // the max Attack discount, it should stay exactly 400, not 202.
      const workshopLevels = maxedWorkshopLevels()
      delete workshopLevels['Multishot Targets']
      delete workshopLevels['Multishot Chance']
      const unlockedGroups = allUnlockedGroups()
      delete unlockedGroups[unlockGroupKey('attack', 'Multishot Upgrades')]

      const { ranked } = getPrioritizedNextUpgrades(
        { workshopLevels, unlockedGroups, discountLabLevels: { attack: 99 } },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ source: 'unlock', name: 'Multishot Upgrades', cost: 400 }),
      ])
    })

    it("doesn't apply a Workshop discount to Enhancement costs, even for the matching tree id", () => {
      const enh = maxedEnhancementLevels()
      enh['Coin Bonus'] = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
          discountLabLevels: { utility: 99 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ name: 'Coin Bonus', cost: 5_000_000_000 })])
    })

    it("doesn't apply a Workshop discount to the Enhancement Lab's flat cost", () => {
      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          discountLabLevels: { attack: 99, defense: 99, utility: 99 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ source: 'lab', name: 'Workshop Enhancements Lab', cost: 5_000_000_000 }),
      ])
    })
  })

  describe('Enhancement discount Labs (OQ-37)', () => {
    it("applies a tree's discount to that tree's own Enhancement category costs", () => {
      // Rend Armor (Attack) costs 5,000,000,000 at level 0 undiscounted --
      // level 10 in the Attack Enhancement discount Lab is 3% off.
      const enh = maxedEnhancementLevels()
      enh['Rend Armor'] = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
          enhancementDiscountLabLevels: { attack: 10 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ name: 'Rend Armor', cost: 5_000_000_000 * 0.97 }),
      ])
    })

    it("doesn't apply one tree's Enhancement discount to a different tree's Enhancement costs", () => {
      const enh = maxedEnhancementLevels()
      enh['Rend Armor'] = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementLabLevel: 1,
          enhancementLevels: enh,
          enhancementDiscountLabLevels: { defense: 100, utility: 100 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ name: 'Rend Armor', cost: 5_000_000_000 })])
    })

    it("doesn't apply an Enhancement discount to Workshop costs, even for the matching tree id", () => {
      const workshopLevels = maxedWorkshopLevels()
      workshopLevels.Orbs = 0

      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels,
          unlockedGroups: allUnlockedGroups(),
          enhancementDiscountLabLevels: { defense: 100 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([expect.objectContaining({ name: 'Orbs', cost: 3000 })])
    })

    it("doesn't apply an Enhancement discount to the Enhancement Lab's flat cost", () => {
      const { ranked } = getPrioritizedNextUpgrades(
        {
          workshopLevels: maxedWorkshopLevels(),
          unlockedGroups: allUnlockedGroups(),
          enhancementDiscountLabLevels: { attack: 100, defense: 100, utility: 100 },
        },
        { rowCap: 1 },
      )

      expect(ranked).toEqual([
        expect.objectContaining({ source: 'lab', name: 'Workshop Enhancements Lab', cost: 5_000_000_000 }),
      ])
    })

    it("discounts Cash Bonus/Coin Bonus's cost in the locked-base critical-path calculation, lowering the point the Lab overtakes a cheap Workshop upgrade", () => {
      // Same fixture/reasoning as "overtakes once nothing cheaper..." above,
      // but with a maxed Utility Enhancement discount Lab (30% off): the
      // effective cost of reaching Coin Bonus drops from ~65.54B to exactly
      // 47.378B -- the Lab's own 5B (never discounted, not an Enhancement
      // cost) + the 10 needed Cash Bonus levels' real 55.54B discounted 30%
      // (38.878B) + Coin Bonus's own real level-1 cost (5B) discounted 30%
      // (3.5B) -- so FALLBACK_RATIO of that (÷128) is exactly 370,140,625,
      // not ~512M. The 10-level count itself is unchanged (OQ-6's threshold
      // check stays undiscounted), only what those levels actually cost.
      const { ranked } = getPrioritizedNextUpgrades(
        { enhancementDiscountLabLevels: { utility: 100 } },
        { rowCap: 50 },
      )

      const labIndex = ranked.findIndex((entry) => entry.source === 'lab')
      expect(labIndex).toBeGreaterThan(0)
      expect(ranked[labIndex]).toMatchObject({ name: 'Workshop Enhancements Lab', cost: 5_000_000_000 })
      expect(ranked[labIndex - 1].cost).toBeLessThan(370_140_625)
      expect(ranked[labIndex + 1].cost).toBeGreaterThan(370_140_625)
    })
  })
})

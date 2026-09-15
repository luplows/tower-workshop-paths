import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { enhancementTreeSpend, isEnhancementCategoryUnlocked } from './enhancementTreeSpend'

const utilityCategory = ENHANCEMENT_CATEGORIES.find((c) => c.id === 'utility')
const coinBonusUpgrade = utilityCategory.upgrades.find((u) => u.name === 'Coin Bonus')

describe('enhancementTreeSpend', () => {
  it('is 0 for a tree with no entered levels at all', () => {
    expect(enhancementTreeSpend(utilityCategory, {})).toBe(0)
  })

  it("sums a single category's cost for every level already bought (0 through currentLevel-1), not including the next one", () => {
    // Cash Bonus (Utility's free starter): 9 levels bought sums to
    // 49,010,000,000 -- 1 short of Coin Bonus's 50B unlock threshold.
    expect(enhancementTreeSpend(utilityCategory, { 'Cash Bonus': 9 })).toBe(49_010_000_000)
  })

  it('sums across every category in the tree at once, not just one', () => {
    const cashBonusOnly = enhancementTreeSpend(utilityCategory, { 'Cash Bonus': 9 })
    const coinBonusOnly = enhancementTreeSpend(utilityCategory, { 'Coin Bonus': 2 })
    const both = enhancementTreeSpend(utilityCategory, { 'Cash Bonus': 9, 'Coin Bonus': 2 })

    expect(both).toBe(cashBonusOnly + coinBonusOnly)
  })

  it('contributes 0 for a category with no cost data (e.g. a plain Workshop upgrade sharing this same category shape)', () => {
    const workshopLikeCategory = { upgrades: [{ name: 'Not A Real Enhancement' }] }
    expect(enhancementTreeSpend(workshopLikeCategory, { 'Not A Real Enhancement': 50 })).toBe(0)
  })

  it('defaults a missing level to 0 for a category that does have cost data', () => {
    expect(enhancementTreeSpend(utilityCategory, { 'Cells/Kill Bonus': 3 })).toBe(
      enhancementTreeSpend(utilityCategory, { 'Cash Bonus': 0, 'Cells/Kill Bonus': 3 }),
    )
  })
})

describe('isEnhancementCategoryUnlocked', () => {
  it('is always true for a category with no unlocksAt threshold (the free starter, or any plain Workshop upgrade)', () => {
    const freeStarter = utilityCategory.upgrades.find((u) => u.unlocksAt == null)
    expect(isEnhancementCategoryUnlocked(freeStarter, utilityCategory, {})).toBe(true)
  })

  it('is false while the tree has spent less than the threshold', () => {
    // 9 Cash Bonus levels = 49.01B, 1B short of Coin Bonus's 50B threshold.
    expect(
      isEnhancementCategoryUnlocked(coinBonusUpgrade, utilityCategory, { 'Cash Bonus': 9 }),
    ).toBe(false)
  })

  it('is true the moment cumulative spend reaches the threshold exactly, not just past it', () => {
    // 10 Cash Bonus levels = 55.54B, crossing 50B -- confirms the boundary
    // is >=, not >, by picking the exact level where this first flips.
    expect(
      isEnhancementCategoryUnlocked(coinBonusUpgrade, utilityCategory, { 'Cash Bonus': 10 }),
    ).toBe(true)
  })

  it("only sums the passed-in category's own upgrades, not every key in enhancementLevels", () => {
    const defenseCategory = ENHANCEMENT_CATEGORIES.find((c) => c.id === 'defense')
    const healthRegenUpgrade = defenseCategory.upgrades.find((u) => u.name === 'Health Regen')

    // "Cash Bonus" belongs to Utility, not Defense -- passing it alongside
    // a Defense category/upgrade shouldn't contribute to Defense's own
    // tree spend at all, the same way App/UpgradePath pass one shared
    // `enhancementLevels` object (every category's levels at once) through
    // this function per-tree.
    expect(
      isEnhancementCategoryUnlocked(healthRegenUpgrade, defenseCategory, { 'Cash Bonus': 9 }),
    ).toBe(false)
  })
})

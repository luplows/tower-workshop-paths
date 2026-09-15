import { ENHANCEMENT_LEVELS } from '../data/enhancementLevels'

// Coins already spent on a single Enhancement category, i.e. the cost of
// every level bought so far (levels 0 through currentLevel-1) -- used to
// gate later categories in the same tree behind cumulative tree spend (see
// Completed-Questions.md's OQ-6). A category
// with no cost data (e.g. a plain Workshop upgrade, which shares this same
// category shape but isn't in ENHANCEMENT_LEVELS at all) contributes 0,
// which is harmless -- it just means this function is a no-op for callers
// that pass Workshop categories through it.
const categorySpend = (name, currentLevel) => {
  const costs = ENHANCEMENT_LEVELS[name] ?? []
  let spent = 0
  for (let level = 0; level < currentLevel; level++) {
    spent += costs[level] ?? 0
  }
  return spent
}

/**
 * Total coins spent across every category in one Enhancement tree, from the
 * given `enhancementLevels` (`{ [name]: level }`). A locked category's level
 * can never be entered in the first place, so it's safe to just sum every
 * category in the tree unconditionally rather than needing to know which
 * ones are unlocked first.
 */
export function enhancementTreeSpend(category, enhancementLevels) {
  let total = 0
  for (const upgrade of category.upgrades) {
    total += categorySpend(upgrade.name, enhancementLevels[upgrade.name] ?? 0)
  }
  return total
}

/**
 * Whether a single Enhancement category is unlocked, given its tree's
 * cumulative spend so far. A category with no `unlocksAt` (the one free
 * starter per tree, or any plain Workshop upgrade sharing this same shape)
 * is always unlocked.
 */
export function isEnhancementCategoryUnlocked(upgrade, category, enhancementLevels) {
  if (upgrade.unlocksAt == null) return true
  return enhancementTreeSpend(category, enhancementLevels) >= upgrade.unlocksAt
}

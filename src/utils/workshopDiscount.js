// The Workshop discount Labs, one per tree (Open-Questions.md OQ-4) --
// separate from the Enhancement discount Labs (a different shape entirely,
// sourced from mytower.app rather than tower-idle-toolkit -- see
// enhancementDiscount.js, Completed-Questions.md OQ-37) and separate from
// the Workshop Enhancements unlock Lab (cheapestNextUpgrades.js), which
// costs coins and is bought through the Path list rather than hand-entered
// here.
const REAL_TREES = new Set(['attack', 'defense', 'utility'])

export const WORKSHOP_DISCOUNT_LAB_MAX_LEVEL = 99
export const DISCOUNT_LAB_LABEL = 'Discount Lab'
const PERCENT_PER_LEVEL = 0.5

/**
 * The percentage off a tree's Workshop costs at a given discount Lab level
 * (0-99), e.g. 4.5 for level 9 -- 0.5% per level, capped at 49.5% at level
 * 99, identical across all 3 trees. Originally sourced from
 * tower-idle-toolkit's `LabValues['Workshop {Tree} Discount']`;
 * re-verified against mytower.app's own `/labs/Workshop {Tree} Discount`
 * pages during the OQ-39 migration and found to already match exactly --
 * now a plain formula (mirroring enhancementDiscount.js) rather than a
 * lookup into third-party data. Returns 0 for a category with no discount
 * Lab at all (Lab costs, unlock-group costs -- anything not `categoryId`
 * "attack"/"defense"/"utility").
 */
export function workshopDiscountPercent(categoryId, level) {
  return REAL_TREES.has(categoryId) ? PERCENT_PER_LEVEL * level : 0
}

/**
 * The multiplier to apply to a tree's Workshop upgrade costs at a given
 * discount Lab level -- 1 (no discount) at level 0, down to 0.505 at the
 * max level 99 (49.5% off).
 */
export function workshopDiscountMultiplier(categoryId, level) {
  return 1 - workshopDiscountPercent(categoryId, level) / 100
}

export const formatDiscountPercent = (percent) => `${percent.toFixed(1)}% off`

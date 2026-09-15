// The Enhancement discount Labs, one per tree (Open-Questions.md's former
// OQ-37, now Completed-Questions.md) -- unlike the Workshop discount Labs
// (OQ-4, workshopDiscount.js), no source in `tower-idle-toolkit` has this
// data at all. Confirmed to actually exist in-game and sourced from
// mytower.app instead (README.md credits it) -- linear and identical
// across all 3 trees, 0.3% off per level, levels 0-100, capping at 30% at
// max. A flatly different shape from the Workshop Labs' 0.5%/level, 0-99
// max, 49.5% cap, so this doesn't reuse workshopDiscountMultiplier's
// per-tree Lab-name lookup at all -- one formula, no tree-specific name
// needed.
export const ENHANCEMENT_DISCOUNT_LAB_MAX_LEVEL = 100
const PERCENT_PER_LEVEL = 0.3

/**
 * The percentage off Enhancement costs at a given discount Lab level
 * (0-100), e.g. 3 for level 10 -- the same 0.3%/level formula for every
 * tree, per mytower.app.
 */
export function enhancementDiscountPercent(level) {
  return PERCENT_PER_LEVEL * level
}

/**
 * The multiplier to apply to a tree's Enhancement costs at a given
 * discount Lab level -- 1 (no discount) at level 0, down to 0.7 at the max
 * level 100 (30% off).
 */
export function enhancementDiscountMultiplier(level) {
  return 1 - enhancementDiscountPercent(level) / 100
}

import { LabValues } from 'tower-idle-toolkit'

// The Workshop discount Labs, one per tree (Open-Questions.md OQ-4) --
// separate from anything Enhancement-related (no such lab exists in any
// data source this project has -- see OQ-37) and separate from the
// Workshop Enhancements unlock Lab (cheapestNextUpgrades.js), which costs
// coins and is bought through the Path list rather than hand-entered here.
const DISCOUNT_LAB_NAMES = {
  attack: 'Workshop Attack Discount',
  defense: 'Workshop Defense Discount',
  utility: 'Workshop Utility Discount',
}

export const WORKSHOP_DISCOUNT_LAB_MAX_LEVEL = 99
export const DISCOUNT_LAB_LABEL = 'Discount Lab'

/**
 * The percentage off a tree's Workshop costs at a given discount Lab level
 * (0-99), e.g. 4.5 for level 9 -- confirmed via tower-idle-toolkit's
 * `LabValues['Workshop {Tree} Discount']`, 0.5% per level, capped at 49.5%
 * at level 99. Returns 0 for a category with no discount Lab at all (Lab
 * costs, unlock-group costs -- anything not `categoryId` "attack"/
 * "defense"/"utility").
 */
export function workshopDiscountPercent(categoryId, level) {
  const labName = DISCOUNT_LAB_NAMES[categoryId]
  return labName ? LabValues[labName](level) : 0
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

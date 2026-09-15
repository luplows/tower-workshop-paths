/**
 * The default buy-order priority list (Open-Questions.md OQ-3) -- community
 * member QuietFanta's "Farming"/eHP ratio set, from the community Google
 * Sheet's "Desired Ratios" tab, anchored to Coin Bonus (ratio 1). Every
 * category this set doesn't name, plus every Workshop upgrade and the
 * one-time Lab/unlock-group prerequisite costs, shares FALLBACK_RATIO
 * instead of an individually-researched ratio -- see Open-Questions.md OQ-2
 * for why a single shared fallback was chosen over researching ~48 Workshop
 * upgrades and 12 unranked Enhancement categories individually.
 */
export const ENHANCEMENT_PRIORITY_RATIOS = {
  'Coin Bonus': 1,
  'Enemy Level Skip': 1 / 1,
  'Cells/Kill Bonus': 1 / 32,
  'Health Regen': 1 / 8,
  Health: 1 / 16,
  'Orb Size': 1 / 128,
}

// The ranked set's own priority order, used to break score ties -- a higher-
// priority item wins over a lower one, matching Project-Outline.md's "Core
// Feature: Recommended Buy Order". Also the scan order for re-anchoring the
// score base once Coin Bonus itself is maxed out (see resolveBaseCost in
// cheapestNextUpgrades.js).
export const RANKED_PRIORITY_ORDER = Object.keys(ENHANCEMENT_PRIORITY_RATIOS)

// Matches the eHP set's own lowest ranked ratio (Orb Size) -- deliberately
// not some other arbitrary small number, so an unranked/fallback item is
// worth exactly as little as the least-prioritized item the community set
// actually named, rather than an invented figure with no anchor at all.
export const FALLBACK_RATIO = 1 / 128

export const PRIORITY_BASE_NAME = 'Coin Bonus'

export function priorityRatio(name) {
  return ENHANCEMENT_PRIORITY_RATIOS[name] ?? FALLBACK_RATIO
}

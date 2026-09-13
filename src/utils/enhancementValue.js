/**
 * Workshop Enhancements share one value formula across all 18 categories,
 * confirmed from the community sheet's "Value" column (Column Q):
 * value = (level x 0.01) + 1 -- e.g. level 40 gives a 1.40x multiplier.
 * Unlike Workshop upgrades, no other in-game modifier stacks with this
 * (as of the current patch), so it's safe to compute and display directly.
 */
export const enhancementValue = (level) => level * 0.01 + 1

export const formatEnhancementValue = (level) => `${enhancementValue(level).toFixed(2)}×`

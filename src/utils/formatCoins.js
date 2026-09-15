const TIERS = [
  { value: 1e27, suffix: 'O' },
  { value: 1e24, suffix: 'S' },
  { value: 1e21, suffix: 's' },
  { value: 1e18, suffix: 'Q' },
  { value: 1e15, suffix: 'q' },
  { value: 1e12, suffix: 'T' },
  { value: 1e9, suffix: 'B' },
  { value: 1e6, suffix: 'M' },
  { value: 1e3, suffix: 'k' },
]

/**
 * Formats a coin cost the way the game itself displays large numbers:
 * condensed with a suffix once it reaches the thousands (k, M, B, T, then
 * alternating-case q/Q and s/S to disambiguate quadrillion/quintillion and
 * sextillion/septillion, up to O for octillion -- the highest tier
 * Workshop costs are currently known to need).
 *
 * Truncates to 2 decimal places rather than rounding, and drops a
 * trailing ".00" or trailing zero, matching the game's own "2.98k",
 * "137.45M", "2.5B", "30" (no suffix or decimals needed under 1000).
 * Dividing an arbitrary coin total by a tier's value (1e6, 1e9, ...)
 * routinely produces more than 2 decimal digits even when the raw total
 * itself is a whole number, so every tier needs this same truncation, not
 * just the condensed ones. Raw totals can still be genuinely fractional
 * too -- a discount multiplier (workshopDiscount.js, enhancementDiscount.js)
 * applied to a whole-number cost, or several of those summed into a batch,
 * rarely lands back on an exact integer.
 *
 * If a displayed batch total is ever reported off by ~0.01 at this tier
 * from what the game shows (e.g. "959.71B" here vs. "959.72B" in-game),
 * it's very unlikely to be this function -- see OQ-39-Data-Source-
 * Migration.md's "Precision" decision for a real, investigated case: the
 * OQ-39 migration's accepted ~3-significant-figure source precision can
 * drift a large batch's summed total by enough to land on the wrong side
 * of a display-rounding boundary, even though this truncation itself
 * (and every individual level's cost) is correct.
 */
export function formatCoins(coins) {
  const tier = TIERS.find((t) => coins >= t.value)
  const scaled = tier ? coins / tier.value : coins
  // A tiny nudge before truncating guards against floating-point division
  // landing just under an exact value (e.g. 5 represented internally as
  // 4.999999999999999), which would otherwise truncate one step too low.
  const truncated = Math.trunc((scaled + 1e-9) * 100) / 100
  const numberPart = truncated.toFixed(2).replace(/\.?0+$/, '')
  return `${numberPart}${tier ? tier.suffix : ''} coins`
}

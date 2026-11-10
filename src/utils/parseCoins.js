import { TIERS } from './formatCoins'

const SUFFIXES = TIERS.map((t) => t.suffix)
const EXPONENT_BY_SUFFIX = Object.fromEntries(TIERS.map((t) => [t.suffix, Math.round(Math.log10(t.value))]))

// A number (digits, optionally a point and more digits, optionally a leading
// minus), then optionally one of formatCoins's suffixes, then optionally the
// word "coins". Spaces are allowed around each part.
const AMOUNT_RE = new RegExp(`^\\s*(-?\\d+(?:\\.\\d+)?)\\s*([${SUFFIXES.join('')}])?(?:\\s+coins)?\\s*$`)

/** The suffixes `parseCoins` accepts, in the order `formatCoins` lists them, smallest first. */
export const COIN_SUFFIXES = [...SUFFIXES].reverse()

/**
 * Reads a coin amount as the game shows it: `1.18q`, `66.5T`, `1.18q coins`,
 * or a plain number. Suffixes are case-sensitive, as the game uses them (`q`
 * is quadrillion and `Q` quintillion). Returns the amount as a number, or
 * `null` for text that is not one. Exponents (`1e15`) and hexadecimal (`0x10`)
 * are not amounts. A negative amount is returned, for the caller to refuse.
 */
export function parseCoins(text) {
  const match = AMOUNT_RE.exec(String(text ?? ''))
  if (!match) return null
  const [, number, suffix] = match
  // Applied as a decimal exponent, so that the amount is the number the text
  // writes: 4.35q is 4.35e15, where 4.35 * 1e15 gives 4349999999999999.5.
  const value = Number(suffix ? `${number}e${EXPONENT_BY_SUFFIX[suffix]}` : number)
  return Number.isFinite(value) ? value : null
}

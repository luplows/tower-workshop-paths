export const clampLevel = (rawValue, maxLevel) => {
  const parsed = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  if (parsed > maxLevel) return maxLevel
  return parsed
}

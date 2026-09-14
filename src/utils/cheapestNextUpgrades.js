import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'

/**
 * Ranks every not-yet-maxed Workshop upgrade by the coin cost of its next
 * single level, cheapest first -- a placeholder buy order until priorities
 * (see Open-Questions.md's OQ-2) are implemented, per the user's explicit
 * "for now, just focus on lowest cost" scope (OQ-17).
 *
 * `levels` is the same `{ [upgradeName]: level }` shape stored under the
 * `workshopLevels` localStorage key by WorkshopInputs.
 *
 * Some upgrades' `quantity` (max level) was corrected upward via
 * WORKSHOP_QUANTITY_OVERRIDES (OQ-13), but tower-idle-toolkit's
 * WORKSHOP_LEVELS cost table wasn't extended to match, so it has no real
 * cost for levels beyond its own (lower) idea of max -- currently Health,
 * Health Regen, Recovery Amount, and Max Recovery (see OQ-1). The entry at
 * that old ceiling itself has `coins: 0` (its own "nothing more to buy"
 * sentinel, from before the correction) rather than being absent, so a
 * present-but-non-positive cost is treated the same as a missing one.
 * These show up in `unknownCost` instead of `ranked` rather than being
 * silently dropped or sorted using a wrong/missing cost.
 */
export function getCheapestNextUpgrades(levels) {
  const ranked = []
  const unknownCost = []

  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      const currentLevel = levels[upgrade.name] ?? 0
      if (currentLevel >= upgrade.quantity) continue

      const entry = {
        name: upgrade.name,
        categoryId: category.id,
        categoryLabel: category.label,
        currentLevel,
        nextLevel: currentLevel + 1,
      }

      const nextLevelData = WORKSHOP_LEVELS[upgrade.name]?.[String(currentLevel)]
      if (nextLevelData && nextLevelData.coins > 0) {
        ranked.push({ ...entry, cost: nextLevelData.coins })
      } else {
        unknownCost.push(entry)
      }
    }
  }

  ranked.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name))
  unknownCost.sort((a, b) => a.name.localeCompare(b.name))

  return { ranked, unknownCost }
}

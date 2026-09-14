import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'

export const DEFAULT_ROW_CAP = 50

/**
 * Simulates a cheapest-first Workshop buy order, cost only -- a placeholder
 * until priorities (see Open-Questions.md's OQ-2) are implemented, per the
 * user's explicit "for now, just focus on lowest cost" scope (OQ-17).
 *
 * At each step, buys whichever not-yet-maxed upgrade has the cheapest next
 * single level, then re-evaluates -- so the same upgrade can appear many
 * times in a row if its next several levels stay cheaper than everything
 * else (OQ-19), the same way a player would actually spend a stream of
 * coins. This is a simulation for ranking purposes only: it never touches
 * the caller's actual entered levels. Capped at `rowCap` rows (default
 * `DEFAULT_ROW_CAP`, 50) since simulating every remaining level of every
 * upgrade would be both enormous and not useful this far ahead -- a firmer
 * answer to "how many to buy at once" belongs to OQ-7 (batch buying), which
 * this list doesn't attempt.
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
 * present-but-non-positive cost is treated the same as a missing one. An
 * upgrade drops out of the simulation (and into `unknownCost` instead of
 * `ranked`) the moment its cursor reaches such a level, whether that's
 * immediately (its currently entered level) or only after some simulated
 * purchases -- either way it's reported once, at the level it got stuck.
 */
export function getCheapestNextUpgrades(levels, { rowCap = DEFAULT_ROW_CAP } = {}) {
  const cursors = new Map()
  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      const currentLevel = levels[upgrade.name] ?? 0
      if (currentLevel < upgrade.quantity) {
        cursors.set(upgrade.name, {
          level: currentLevel,
          quantity: upgrade.quantity,
          categoryId: category.id,
          categoryLabel: category.label,
        })
      }
    }
  }

  const ranked = []
  const unknownCost = []
  const stuck = new Set()

  while (ranked.length < rowCap) {
    let best = null

    for (const [name, cursor] of cursors) {
      if (stuck.has(name)) continue

      const nextLevelData = WORKSHOP_LEVELS[name]?.[String(cursor.level)]
      if (!nextLevelData || nextLevelData.coins <= 0) {
        stuck.add(name)
        unknownCost.push({
          name,
          categoryId: cursor.categoryId,
          categoryLabel: cursor.categoryLabel,
          currentLevel: cursor.level,
          nextLevel: cursor.level + 1,
        })
        continue
      }

      const cost = nextLevelData.coins
      if (!best || cost < best.cost || (cost === best.cost && name.localeCompare(best.name) < 0)) {
        best = { name, cursor, cost }
      }
    }

    if (!best) break

    ranked.push({
      name: best.name,
      categoryId: best.cursor.categoryId,
      categoryLabel: best.cursor.categoryLabel,
      currentLevel: best.cursor.level,
      nextLevel: best.cursor.level + 1,
      cost: best.cost,
    })

    best.cursor.level += 1
    if (best.cursor.level >= best.cursor.quantity) {
      cursors.delete(best.name)
    }
  }

  unknownCost.sort((a, b) => a.name.localeCompare(b.name))

  return { ranked, unknownCost }
}

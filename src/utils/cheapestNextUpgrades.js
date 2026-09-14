import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'

export const DEFAULT_ROW_CAP = 50

// The game only lets you buy a Workshop upgrade in batches, not one level
// at a time: 100 levels at once for anything with more than 1000 max
// levels, 10 otherwise (see Project-Outline.md, OQ-7). Enhancements aren't
// batched -- out of scope here, since this ranks Workshop upgrades only.
const LARGE_MAX_LEVEL_THRESHOLD = 1000
const LARGE_BATCH_SIZE = 100
const SMALL_BATCH_SIZE = 10

const batchSizeForQuantity = (quantity) =>
  quantity > LARGE_MAX_LEVEL_THRESHOLD ? LARGE_BATCH_SIZE : SMALL_BATCH_SIZE

/**
 * Simulates a cheapest-first Workshop buy order, cost only -- a placeholder
 * until priorities (see Open-Questions.md's OQ-2) are implemented, per the
 * user's explicit "for now, just focus on lowest cost" scope (OQ-17).
 *
 * At each step, buys whichever not-yet-maxed upgrade has the cheapest next
 * *batch* (see above), then re-evaluates -- so the same upgrade can appear
 * many times in a row if its next several batches stay cheaper than
 * everything else (OQ-19), the same way a player would actually spend a
 * stream of coins. This is a simulation for ranking purposes only: it never
 * touches the caller's actual entered levels. Capped at `rowCap` rows
 * (default `DEFAULT_ROW_CAP`, 50) since simulating every remaining level of
 * every upgrade would be both enormous and not useful this far ahead.
 *
 * A batch is trimmed to whatever's left when fewer than a full batch
 * remains before max level (the "partial batch" question OQ-7 left open) --
 * e.g. an upgrade 6 levels from max with a 10-level batch size buys those
 * final 6. That's the only case a batch is ever shrunk: if any level within
 * the (already max-trimmed) batch has no valid cost data, the whole batch
 * is refused rather than silently pricing a partial one -- our data being
 * incomplete isn't the same situation as a real near-max partial batch, and
 * pricing a subset would misrepresent what the batch actually costs.
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
 * `ranked`) the moment its next batch can't be fully priced, whether that's
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
          batchSize: batchSizeForQuantity(upgrade.quantity),
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

      const batchLevels = Math.min(cursor.batchSize, cursor.quantity - cursor.level)
      const table = WORKSHOP_LEVELS[name]
      let cost = 0
      let priceable = true
      for (let offset = 0; offset < batchLevels; offset++) {
        const levelData = table?.[String(cursor.level + offset)]
        if (!levelData || levelData.coins <= 0) {
          priceable = false
          break
        }
        cost += levelData.coins
      }

      if (!priceable) {
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

      if (!best || cost < best.cost || (cost === best.cost && name.localeCompare(best.name) < 0)) {
        best = { name, cursor, cost, batchLevels }
      }
    }

    if (!best) break

    ranked.push({
      name: best.name,
      categoryId: best.cursor.categoryId,
      categoryLabel: best.cursor.categoryLabel,
      currentLevel: best.cursor.level,
      nextLevel: best.cursor.level + best.batchLevels,
      levels: best.batchLevels,
      cost: best.cost,
    })

    best.cursor.level += best.batchLevels
    if (best.cursor.level >= best.cursor.quantity) {
      cursors.delete(best.name)
    }
  }

  unknownCost.sort((a, b) => a.name.localeCompare(b.name))

  return { ranked, unknownCost }
}

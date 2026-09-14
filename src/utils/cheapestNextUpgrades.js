import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { ENHANCEMENT_LEVELS } from '../data/enhancementLevels'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'
import { isEnhancementCategoryUnlocked } from './enhancementTreeSpend'
import {
  isUnlockGroupPurchased,
  isWorkshopUpgradeUnlocked,
  unlockGroupKey,
} from './workshopUnlockGroups'

export const DEFAULT_ROW_CAP = 50

// The game actually lets you buy a Workshop upgrade one level at a time --
// this isn't a hard restriction it imposes. But for this tool's purposes,
// the Path list always recommends buying in these fixed batch sizes rather
// than one level at a time, for practicality: 100 levels at once for an
// upgrade with more than 1000 max levels, 10 for one with at least 10, or 1
// for one with fewer than 10 max levels in the first place (Multishot
// Targets, Bounce Shot Targets, Orbs) -- see Project-Outline.md, OQ-7.
// Enhancements are always bought 1 level at a time, no batching -- that one
// really is a game rule, not this tool's choice.
const TINY_MAX_LEVEL_THRESHOLD = 10
const LARGE_MAX_LEVEL_THRESHOLD = 1000
const LARGE_BATCH_SIZE = 100
const SMALL_BATCH_SIZE = 10
const SINGLE_BATCH_SIZE = 1

const workshopBatchSize = (quantity) => {
  if (quantity < TINY_MAX_LEVEL_THRESHOLD) return SINGLE_BATCH_SIZE
  return quantity > LARGE_MAX_LEVEL_THRESHOLD ? LARGE_BATCH_SIZE : SMALL_BATCH_SIZE
}

// Some Workshop upgrades' `quantity` (max level) was corrected upward via
// WORKSHOP_QUANTITY_OVERRIDES (OQ-13), but tower-idle-toolkit's
// WORKSHOP_LEVELS cost table wasn't extended to match, so it has no real
// cost for levels beyond its own (lower) idea of max -- currently Health,
// Health Regen, Recovery Amount, and Max Recovery (see OQ-1). The entry at
// that old ceiling itself has `coins: 0` (its own "nothing more to buy"
// sentinel, from before the correction) rather than being absent, so a
// present-but-non-positive cost is treated the same as a missing one.
const workshopCostAt = (name, level) => {
  const coins = WORKSHOP_LEVELS[name]?.[String(level)]?.coins
  return coins > 0 ? coins : undefined
}

// ENHANCEMENT_LEVELS has no such gaps (it's a plain array per category,
// nothing sentinel-shaped) -- this mirrors workshopCostAt's shape mainly so
// the simulation loop below doesn't need to know which source it's pricing.
const enhancementCostAt = (name, level) => {
  const coins = ENHANCEMENT_LEVELS[name]?.[level]
  return coins > 0 ? coins : undefined
}

// The one-time "Workshop Enhancements" Lab that gates the entire Enhancement
// system -- until it's bought, no Enhancement category is purchasable at
// all (see Project-Outline.md). Modeled as its own single-level, 1-batch
// item rather than a special-cased boolean, so it's ranked and bought the
// same way as everything else in the list. Exported so other UI (the
// Enhance input screen's own lock/unlock prompt -- see EnhancementInputs)
// can show the same name/cost without duplicating them.
export const ENHANCEMENT_LAB_NAME = 'Workshop Enhancements Lab'
export const ENHANCEMENT_LAB_COST = 5_000_000_000
const enhancementLabCostAt = (name, level) => (level === 0 ? ENHANCEMENT_LAB_COST : undefined)

/**
 * Simulates a cheapest-first Workshop + Enhancement buy order, cost only --
 * a placeholder until priorities (see Open-Questions.md's OQ-2) are
 * implemented, per the user's explicit "for now, just focus on lowest
 * cost" scope (OQ-17, extended to Enhancements in OQ-29). One combined
 * ranked list across both systems, not two separate ones -- matching OQ-2's
 * eventual design.
 *
 * At each step, buys whichever not-yet-maxed item (Workshop upgrade or
 * Enhancement category) has the cheapest next *batch* (see above), then
 * re-evaluates -- so the same item can appear many times in a row if its
 * next several batches stay cheaper than everything else (OQ-19), the same
 * way a player would actually spend a stream of coins. This is a
 * simulation for ranking purposes only: it never touches the caller's
 * actual entered levels. Capped at `rowCap` rows (default `DEFAULT_ROW_CAP`,
 * 50) since simulating every remaining level of everything would be both
 * enormous and not useful this far ahead.
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
 * `workshopLevels`/`enhancementLevels` are the same `{ [name]: level }`
 * shapes stored under the `workshopLevels`/`enhancementLevels` localStorage
 * keys by WorkshopInputs/EnhancementInputs. Several names overlap between
 * the two (e.g. "Damage", "Health") -- and a Workshop upgrade-unlock
 * group's own name can collide with a plain upgrade name too (e.g. "Death
 * Defy" is both), since some groups gate only a single upgrade -- so every
 * returned entry (in both `ranked` and `unknownCost`) carries a `source`
 * ('workshop', 'enhancement', 'lab', or 'unlock' -- see below) alongside
 * `name` -- callers must key off both together, never `name` alone, to
 * tell which stored levels (or which unlock group) a row actually belongs
 * to.
 *
 * `unlockedGroups` (the `workshopUnlockedGroups` localStorage shape, a flat
 * `{ [categoryId:groupName]: true }` map -- see `workshopUnlockGroups.js`)
 * tracks which paid Workshop upgrade-unlock groups the player has already
 * bought (OQ-5); every tree's free "Default" group needs no entry, it's
 * always unlocked. A not-yet-purchased group's upgrades are excluded from
 * the simulation entirely, the same treatment as a locked Enhancement
 * category (see below) -- but unlike that gate, the group's own one-time
 * unlock cost competes as its own candidate instead, `source: 'unlock'`,
 * named after the group (e.g. "Multishot Upgrades"), a single-level
 * (0 -> 1), always-1-level batch, the same shape as the Lab row. Buying it
 * (the caller persisting the implied purchase) makes that group's upgrades
 * ordinary candidates from the next call on -- same once-per-call
 * simplification as everything else here.
 *
 * `enhancementLabLevel` (0 or 1) tracks the one-time "Workshop Enhancements"
 * Lab that gates the entire Enhancement system in-game. While it's 0, no
 * Enhancement category is included in the simulation at all -- the *only*
 * candidate representing Enhancements is the Lab itself, a single `source:
 * 'lab'` row costing a flat 5B coins. Once bought (`enhancementLabLevel`
 * reaches 1, by the caller persisting whatever this function's own Lab row
 * implies), the Lab row disappears and every Enhancement category becomes a
 * normal candidate, same as before OQ-31. This models the real gate, not
 * just a UI hint: an Enhancement is never ranked or otherwise reachable
 * through this function until the Lab is actually bought.
 *
 * Once the Lab is bought, each Enhancement category still needs its own
 * tree's cumulative spend threshold crossed before it's reachable (the free
 * starter category in each tree has no threshold) -- see
 * `enhancementTreeSpend.js` and Project-Outline.md's "Workshop Enhancements"
 * section for the 50B/500B/5T/50T/500T progression (OQ-6). This is
 * evaluated once per call, from the caller's actual `enhancementLevels`,
 * the same simplification already used for the Lab gate above: a category
 * that crosses its threshold only through *this simulation's own* buying
 * (rather than the caller's real entered levels) won't unlock until the
 * next call, not mid-run.
 *
 * An item drops out of the simulation (and into `unknownCost` instead of
 * `ranked`) the moment its next batch can't be fully priced, whether that's
 * immediately (its currently entered level) or only after some simulated
 * purchases -- either way it's reported once, at the level it got stuck.
 * In practice this currently only ever happens for the four gapped
 * Workshop upgrades above; ENHANCEMENT_LEVELS and the Lab have no known gaps.
 */
export function getCheapestNextUpgrades(
  {
    workshopLevels = {},
    enhancementLevels = {},
    enhancementLabLevel = 0,
    unlockedGroups = {},
  } = {},
  { rowCap = DEFAULT_ROW_CAP } = {},
) {
  const cursors = new Map()

  for (const category of WORKSHOP_CATEGORIES) {
    for (const upgrade of category.upgrades) {
      if (!isWorkshopUpgradeUnlocked(category.id, upgrade.name, unlockedGroups)) continue
      const currentLevel = workshopLevels[upgrade.name] ?? 0
      if (currentLevel < upgrade.quantity) {
        cursors.set(`workshop:${upgrade.name}`, {
          source: 'workshop',
          name: upgrade.name,
          level: currentLevel,
          quantity: upgrade.quantity,
          batchSize: workshopBatchSize(upgrade.quantity),
          categoryId: category.id,
          categoryLabel: category.label,
          costAt: workshopCostAt,
        })
      }
    }

    for (const group of WORKSHOP_UNLOCK_GROUPS[category.id] ?? []) {
      if (group.cost > 0 && !isUnlockGroupPurchased(category.id, group.name, unlockedGroups)) {
        cursors.set(`unlock:${unlockGroupKey(category.id, group.name)}`, {
          source: 'unlock',
          name: group.name,
          level: 0,
          quantity: 1,
          batchSize: SINGLE_BATCH_SIZE,
          categoryId: category.id,
          categoryLabel: category.label,
          costAt: (name, level) => (level === 0 ? group.cost : undefined),
        })
      }
    }
  }

  if (enhancementLabLevel < 1) {
    cursors.set('lab:Workshop Enhancements Lab', {
      source: 'lab',
      name: ENHANCEMENT_LAB_NAME,
      level: 0,
      quantity: 1,
      batchSize: SINGLE_BATCH_SIZE,
      categoryId: 'lab',
      categoryLabel: 'Lab',
      costAt: enhancementLabCostAt,
    })
  } else {
    for (const category of ENHANCEMENT_CATEGORIES) {
      for (const upgrade of category.upgrades) {
        if (!isEnhancementCategoryUnlocked(upgrade, category, enhancementLevels)) continue
        const currentLevel = enhancementLevels[upgrade.name] ?? 0
        if (currentLevel < upgrade.quantity) {
          cursors.set(`enhancement:${upgrade.name}`, {
            source: 'enhancement',
            name: upgrade.name,
            level: currentLevel,
            quantity: upgrade.quantity,
            batchSize: SINGLE_BATCH_SIZE,
            categoryId: category.id,
            categoryLabel: category.label,
            costAt: enhancementCostAt,
          })
        }
      }
    }
  }

  const ranked = []
  const unknownCost = []
  const stuck = new Set()

  while (ranked.length < rowCap) {
    let best = null

    for (const [key, cursor] of cursors) {
      if (stuck.has(key)) continue

      const batchLevels = Math.min(cursor.batchSize, cursor.quantity - cursor.level)
      let cost = 0
      let priceable = true
      for (let offset = 0; offset < batchLevels; offset++) {
        const levelCost = cursor.costAt(cursor.name, cursor.level + offset)
        if (levelCost === undefined) {
          priceable = false
          break
        }
        cost += levelCost
      }

      if (!priceable) {
        stuck.add(key)
        unknownCost.push({
          name: cursor.name,
          source: cursor.source,
          categoryId: cursor.categoryId,
          categoryLabel: cursor.categoryLabel,
          currentLevel: cursor.level,
          nextLevel: cursor.level + 1,
        })
        continue
      }

      if (
        !best ||
        cost < best.cost ||
        (cost === best.cost && cursor.name.localeCompare(best.cursor.name) < 0)
      ) {
        best = { key, cursor, cost, batchLevels }
      }
    }

    if (!best) break

    ranked.push({
      name: best.cursor.name,
      source: best.cursor.source,
      categoryId: best.cursor.categoryId,
      categoryLabel: best.cursor.categoryLabel,
      currentLevel: best.cursor.level,
      nextLevel: best.cursor.level + best.batchLevels,
      levels: best.batchLevels,
      cost: best.cost,
    })

    best.cursor.level += best.batchLevels
    if (best.cursor.level >= best.cursor.quantity) {
      cursors.delete(best.key)
    }
  }

  unknownCost.sort((a, b) => a.name.localeCompare(b.name))

  return { ranked, unknownCost }
}

import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { ENHANCEMENT_LEVELS } from '../data/enhancementLevels'
import {
  FALLBACK_RATIO,
  PRIORITY_BASE_NAME,
  priorityRatio,
  RANKED_PRIORITY_ORDER,
} from '../data/enhancementPriority'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { enhancementTreeSpend, isEnhancementCategoryUnlocked } from './enhancementTreeSpend'
import {
  isWorkshopUpgradeUnlocked,
  nextPurchasableGroup,
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
 * Builds one cursor per not-yet-maxed, currently-unlocked candidate --
 * Workshop upgrades, the one Workshop unlock-group offer per tree, the
 * Enhancement Lab (while unbought), and Enhancement categories (once it's
 * bought) -- keyed the same way `ranked`/`unknownCost` rows are (see the
 * module docstring below). Shared by both `getCheapestNextUpgrades` and
 * `getPrioritizedNextUpgrades` so the two selection strategies simulate
 * from the exact same starting candidate set.
 */
function buildCandidateCursors({ workshopLevels, enhancementLevels, enhancementLabLevel, unlockedGroups }) {
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

    // A tree's paid groups unlock in order -- only the earliest not-yet-
    // purchased one is ever offered here; every later group stays fully
    // excluded (no candidate at all) until its turn.
    const nextGroup = nextPurchasableGroup(category.id, unlockedGroups)
    if (nextGroup) {
      cursors.set(`unlock:${unlockGroupKey(category.id, nextGroup.name)}`, {
        source: 'unlock',
        name: nextGroup.name,
        level: 0,
        quantity: 1,
        batchSize: SINGLE_BATCH_SIZE,
        categoryId: category.id,
        categoryLabel: category.label,
        costAt: (name, level) => (level === 0 ? nextGroup.cost : undefined),
      })
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

  return cursors
}

// A cursor's next batch, priced level by level -- `priceable: false` the
// moment any level within it has no cost data (see the module docstring's
// "partial batch" note for why the whole batch is refused rather than
// priced partially).
function nextBatchCost(cursor) {
  const batchLevels = Math.min(cursor.batchSize, cursor.quantity - cursor.level)
  let cost = 0
  for (let offset = 0; offset < batchLevels; offset++) {
    const levelCost = cursor.costAt(cursor.name, cursor.level + offset)
    if (levelCost === undefined) return { priceable: false }
    cost += levelCost
  }
  return { priceable: true, cost, batchLevels }
}

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
 * always unlocked. A tree's paid groups unlock in order -- e.g. "Thorn
 * Upgrades" can't be bought before "Defense Upgrades" -- so only the
 * earliest not-yet-purchased group in each tree is ever offered as a
 * candidate at all (`nextPurchasableGroup`); every later group's upgrades
 * stay fully excluded, the same treatment as a locked Enhancement category
 * (see below), until their own turn comes. The offered group's one-time
 * unlock cost competes as its own candidate, `source: 'unlock'`, named
 * after the group (e.g. "Multishot Upgrades"), a single-level (0 -> 1),
 * always-1-level batch, the same shape as the Lab row. Buying it (the
 * caller persisting the implied purchase) makes that group's upgrades
 * ordinary candidates and advances the tree to its next group from the
 * next call on -- same once-per-call simplification as everything else
 * here.
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
  const cursors = buildCandidateCursors({ workshopLevels, enhancementLevels, enhancementLabLevel, unlockedGroups })

  const ranked = []
  const unknownCost = []
  const stuck = new Set()

  while (ranked.length < rowCap) {
    let best = null

    for (const [key, cursor] of cursors) {
      if (stuck.has(key)) continue

      const priced = nextBatchCost(cursor)
      if (!priced.priceable) {
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
        priced.cost < best.cost ||
        (priced.cost === best.cost && cursor.name.localeCompare(best.cursor.name) < 0)
      ) {
        best = { key, cursor, cost: priced.cost, batchLevels: priced.batchLevels }
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

const UTILITY_CATEGORY_ID = 'utility'
const LAB_CURSOR_KEY = 'lab:Workshop Enhancements Lab'

/**
 * The live "ratio-1-equivalent" cost every candidate's score is measured
 * against this pass, plus (while Coin Bonus is locked) which cursor key is
 * currently "the next step toward Coin Bonus" and should score exactly 1
 * regardless of its own ratio/cost -- see `getPrioritizedNextUpgrades`'s
 * docstring for the cases this resolves between. `baseCost` is `null` when
 * no valid anchor exists at all (the vanishingly unlikely case every ranked
 * item, and every prerequisite toward Coin Bonus, is simultaneously
 * unreachable) -- safe to treat as "compare by cost alone" in that case,
 * since every candidate still in play at that point shares FALLBACK_RATIO
 * anyway, so the actual anchor value can't affect their relative order.
 */
function resolveBaseCost(cursors, enhancementLevels, enhancementLabLevel) {
  const coinBonusCursor = cursors.get(`enhancement:${PRIORITY_BASE_NAME}`)
  if (coinBonusCursor) {
    const priced = nextBatchCost(coinBonusCursor)
    return { baseCost: priced.priceable ? priced.cost : null, criticalPathKey: null }
  }

  const utilityCategory = ENHANCEMENT_CATEGORIES.find((category) => category.id === UTILITY_CATEGORY_ID)
  const coinBonusUpgrade = utilityCategory.upgrades.find((upgrade) => upgrade.name === PRIORITY_BASE_NAME)
  const cashBonusUpgrade = utilityCategory.upgrades.find((upgrade) => upgrade.unlocksAt == null)

  // Unlike every other gate in this file, whether Coin Bonus is still locked
  // has to be read live rather than fixed from the caller's real
  // `enhancementLevels` -- it's the one gate a single simulation run can
  // realistically cross entirely on its own (10 simulated Cash Bonus
  // purchases, well inside `rowCap`), and Cash Bonus's `criticalPathKey`
  // override below scores it 1 regardless of its real cost, so nothing else
  // would ever naturally end the streak once the threshold is actually
  // crossed. Cash Bonus's cursor -- if it currently has one -- already
  // tracks this run's own simulated purchases via its mutated `.level`, so
  // reading tree spend through that instead of the static entered level is
  // enough; no other Utility category can gain a cursor while Coin Bonus
  // itself has none.
  const cashBonusCursor = cursors.get(`enhancement:${cashBonusUpgrade.name}`)
  const liveCashBonusLevel = cashBonusCursor ? cashBonusCursor.level : (enhancementLevels[cashBonusUpgrade.name] ?? 0)
  const utilitySpend = enhancementTreeSpend(utilityCategory, {
    ...enhancementLevels,
    [cashBonusUpgrade.name]: liveCashBonusLevel,
  })

  // Locked (covers "before the Lab is bought" too, not just "Lab bought but
  // Utility tree under its 50B threshold" -- both are just different points
  // along the same prerequisite chain). Rather than a stand-in item priced
  // at the coins still missing, the base becomes the *effective cost of
  // reaching Coin Bonus's own first level*: whatever's left of the Lab (5B,
  // 0 once bought) + every Cash Bonus level still needed to cross the
  // threshold (Utility's free starter -- the only thing that can currently
  // advance that tree's spend) + Coin Bonus's own real level-1 cost.
  //
  // Whichever prerequisite is next in that chain -- the Lab while unbought,
  // else Cash Bonus -- is returned as `criticalPathKey`: the caller scores
  // that one cursor as exactly 1 (the same self-referential score Coin
  // Bonus always gets against itself once normal), rather than via its own
  // ratio/cost, since it's not really competing on its own merits -- it's a
  // required step toward the ratio-1 item. Every other candidate (Workshop
  // upgrades, unranked Enhancements) still scores normally against this
  // `baseCost`, so a cheap-enough Workshop upgrade keeps winning until its
  // own cost exceeds baseCost / (1/FALLBACK_RATIO) -- past that point the
  // chain toward Coin Bonus starts winning instead.
  if (utilitySpend < coinBonusUpgrade.unlocksAt) {
    const cashBonusLevels = ENHANCEMENT_LEVELS[cashBonusUpgrade.name] ?? []
    let cashBonusLevel = liveCashBonusLevel
    let cashBonusRemaining = 0
    let treeSpend = utilitySpend
    while (treeSpend < coinBonusUpgrade.unlocksAt) {
      const levelCost = cashBonusLevels[cashBonusLevel]
      // Cash Bonus itself ran out (maxed) before crossing the threshold --
      // no way to reach Coin Bonus at all right now.
      if (levelCost === undefined) return { baseCost: null, criticalPathKey: null }
      cashBonusRemaining += levelCost
      treeSpend += levelCost
      cashBonusLevel += 1
    }

    const coinBonusLevel1Cost = ENHANCEMENT_LEVELS[PRIORITY_BASE_NAME]?.[enhancementLevels[PRIORITY_BASE_NAME] ?? 0]
    if (coinBonusLevel1Cost === undefined) return { baseCost: null, criticalPathKey: null }

    const labRemaining = enhancementLabLevel < 1 ? ENHANCEMENT_LAB_COST : 0
    const criticalPathKey =
      enhancementLabLevel < 1 ? LAB_CURSOR_KEY : `enhancement:${cashBonusUpgrade.name}`

    return { baseCost: labRemaining + cashBonusRemaining + coinBonusLevel1Cost, criticalPathKey }
  }

  // Maxed: Coin Bonus is unlocked (utilitySpend already passed its
  // threshold, or it wouldn't have had a cursor to begin with) but has no
  // cursor, so it's at max level. Re-anchor to whichever ranked item is
  // currently purchasable, live each pass since a re-anchored item can
  // itself become unavailable (bought out, or maxed) as the simulation
  // proceeds -- normalized back to a ratio-1-equivalent cost so the score
  // formula doesn't need a separate branch for this case (already scores
  // itself as 1 through the normal formula, so no `criticalPathKey` needed).
  for (const name of RANKED_PRIORITY_ORDER) {
    if (name === PRIORITY_BASE_NAME) continue
    const cursor = cursors.get(`enhancement:${name}`)
    if (!cursor) continue
    const priced = nextBatchCost(cursor)
    if (priced.priceable) return { baseCost: priced.cost / priorityRatio(name), criticalPathKey: null }
  }

  return { baseCost: null, criticalPathKey: null }
}

// The eHP set only ever ratios Enhancement categories -- a Workshop upgrade
// always gets FALLBACK_RATIO, even one that happens to share a name with a
// ranked Enhancement category (e.g. "Health", "Health Regen" are both a
// Workshop upgrade and an Enhancement category -- see workshopCategories.js/
// enhancementCategories.js). `priorityRatio`/`RANKED_PRIORITY_ORDER` know
// nothing about which kind of item a name belongs to, so every caller here
// must gate on `cursor.source === 'enhancement'` first rather than passing
// `cursor.name` straight through.
const cursorPriorityRatio = (cursor) =>
  cursor.source === 'enhancement' ? priorityRatio(cursor.name) : FALLBACK_RATIO

const cursorRankIndex = (cursor) => {
  if (cursor.source !== 'enhancement') return RANKED_PRIORITY_ORDER.length
  const index = RANKED_PRIORITY_ORDER.indexOf(cursor.name)
  return index === -1 ? RANKED_PRIORITY_ORDER.length : index
}

/**
 * The priority-weighted buy order (Open-Questions.md OQ-2) -- the tool's
 * actual core feature, superseding `getCheapestNextUpgrades`'s cost-only
 * placeholder ranking (OQ-17/OQ-29) now that a default priority list exists
 * (OQ-3). Same simulation shape, same candidate set (`buildCandidateCursors`),
 * same batching/gating/row-cap/`unknownCost` rules -- only how the "best"
 * candidate is chosen each pass differs:
 *
 * ```
 * score = ratio × (base's next cost ÷ this item's next cost)
 * ```
 *
 * (`Project-Outline.md`, "Core Feature: Recommended Buy Order".) `ratio`
 * comes from `cursorPriorityRatio` -- the eHP set's own ratio for one of its
 * 6 named Enhancement categories, or FALLBACK_RATIO (1/128) for everything
 * else (every Workshop upgrade, the Lab, an unlock-group offer, and the 12
 * Enhancement categories the eHP set doesn't name). Gated on `cursor.source
 * === 'enhancement'` before ever looking at `cursor.name` -- a Workshop
 * upgrade always gets FALLBACK_RATIO even when it happens to share a name
 * with a ranked Enhancement category (e.g. "Health", "Health Regen" name
 * both a Workshop upgrade and an Enhancement category), since the eHP set
 * only ever ranks Enhancements. Ties are broken first by the eHP set's own
 * priority order (a named Enhancement category beats everything else, and
 * among named categories the higher one wins), then alphabetically by name
 * -- the same final tie-break `getCheapestNextUpgrades` already uses, for
 * the same reason: nothing else distinguishes two fallback-ratio items.
 *
 * The formula's `base` is Coin Bonus (`PRIORITY_BASE_NAME`), the eHP set's
 * own anchor (ratio 1) -- but Coin Bonus is itself a gated, capped
 * Enhancement category (Utility's 2nd, 50B-threshold-locked, capped at
 * level 300), not always available to price directly. `resolveBaseCost`
 * (above) resolves what stands in for it each scoring pass:
 * - **Unlocked, not maxed (normal):** Coin Bonus's own live next-batch cost.
 * - **Locked** (the Enhancement Lab isn't bought yet, or it is but the
 *   Utility tree hasn't reached 50B): the *effective cost of reaching Coin
 *   Bonus's own first level* -- the Lab's remaining cost + every Cash Bonus
 *   level still needed to cross the threshold + Coin Bonus's own real
 *   level-1 cost. Whichever prerequisite is next (the Lab, or else Cash
 *   Bonus) scores exactly 1 in the loop below regardless of its own
 *   ratio/cost, via `criticalPathKey` -- it's not competing on its own
 *   merits, it's a required step toward the ratio-1 item. A cheap-enough
 *   Workshop upgrade still wins until its own cost gets close to this
 *   effective cost (scaled by FALLBACK_RATIO); past that, the chain toward
 *   Coin Bonus starts winning instead. Whether Coin Bonus is *still* locked
 *   is read live off Cash Bonus's own cursor (unlike every other gate here,
 *   which only ever reflects the caller's real entered levels) -- otherwise
 *   Cash Bonus's score-1 override would keep winning for the rest of the
 *   run even after enough simulated purchases actually cross the threshold,
 *   since nothing else would ever revisit the check.
 * - **Maxed** (level 300 reached): re-anchor to whichever ranked eHP item is
 *   currently purchasable, live each pass.
 * - **The (extremely unlikely) case nothing ranked, and no prerequisite
 *   toward it, is reachable at all:** no valid anchor exists; every
 *   remaining candidate necessarily shares FALLBACK_RATIO in that case, so
 *   falls back to ranking by cost alone, which is equivalent for same-ratio
 *   items regardless of what a hypothetical anchor value would have been.
 */
export function getPrioritizedNextUpgrades(
  {
    workshopLevels = {},
    enhancementLevels = {},
    enhancementLabLevel = 0,
    unlockedGroups = {},
  } = {},
  { rowCap = DEFAULT_ROW_CAP } = {},
) {
  const cursors = buildCandidateCursors({ workshopLevels, enhancementLevels, enhancementLabLevel, unlockedGroups })

  const ranked = []
  const unknownCost = []
  const stuck = new Set()

  while (ranked.length < rowCap) {
    const { baseCost, criticalPathKey } = resolveBaseCost(cursors, enhancementLevels, enhancementLabLevel)
    let best = null

    for (const [key, cursor] of cursors) {
      if (stuck.has(key)) continue

      const priced = nextBatchCost(cursor)
      if (!priced.priceable) {
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

      // A prerequisite on the critical path toward Coin Bonus (the Lab, or
      // Cash Bonus -- see resolveBaseCost) scores exactly 1, the same
      // self-referential score the base always gets against itself, rather
      // than through its own ratio/cost -- it isn't competing on its own
      // merits.
      let score
      if (key === criticalPathKey) {
        score = 1
      } else if (baseCost == null) {
        score = 1 / priced.cost
      } else {
        score = (cursorPriorityRatio(cursor) * baseCost) / priced.cost
      }
      const rank = cursorRankIndex(cursor)

      if (
        !best ||
        score > best.score ||
        (score === best.score && rank < best.rank) ||
        (score === best.score && rank === best.rank && cursor.name.localeCompare(best.cursor.name) < 0)
      ) {
        best = { key, cursor, cost: priced.cost, batchLevels: priced.batchLevels, score, rank }
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

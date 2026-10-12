import { getPrioritizedNextUpgrades } from './cheapestNextUpgrades'
import { unlockGroupKey } from './workshopUnlockGroups'

const isBlank = (value) => typeof value !== 'string' || value.trim() === ''

const toNumber = (value) => {
  const trimmed = typeof value === 'string' ? value.trim() : value
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * OQ-8/AC-1 + AC-6. `lifetimeCoins`/`coinsSpentOnLabs` are the raw strings
 * the two Buyout inputs hold -- validated and turned into the coin budget
 * available to the Workshop (lifetime coins minus whatever's already gone
 * into Labs) rather than a second place that re-derives it.
 *
 * Both fields blank (nothing entered yet) is reported with no `error` --
 * there's nothing wrong to tell the player about yet, just no plan to show.
 * Every other way the inputs can fail to produce a plan -- one field still
 * blank, a non-numeric entry, a negative entry, or Labs spend exceeding
 * lifetime coins -- gets a stated `error`.
 */
export function validateBuyoutInputs({ lifetimeCoins, coinsSpentOnLabs }) {
  const lifetimeBlank = isBlank(lifetimeCoins)
  const spentBlank = isBlank(coinsSpentOnLabs)

  if (lifetimeBlank && spentBlank) {
    return { valid: false, error: null }
  }
  if (lifetimeBlank || spentBlank) {
    return { valid: false, error: 'Enter both lifetime coins and coins spent on Labs.' }
  }

  const lifetime = toNumber(lifetimeCoins)
  const spent = toNumber(coinsSpentOnLabs)
  if (lifetime === null || spent === null) {
    return { valid: false, error: 'Lifetime coins and coins spent on Labs must be numbers.' }
  }
  if (lifetime < 0 || spent < 0) {
    return { valid: false, error: 'Lifetime coins and coins spent on Labs must not be negative.' }
  }
  if (spent > lifetime) {
    return { valid: false, error: 'Coins spent on Labs cannot exceed lifetime coins.' }
  }

  return { valid: true, budget: lifetime - spent }
}

// `getPrioritizedNextUpgrades` re-derives which Workshop unlock group (and,
// before the Enhancement Lab is bought, which Enhancement category) is
// reachable only once per call, from whatever `unlockedGroups`/
// `enhancementLabLevel` it's given -- buying the one offered unlock group
// inside a single call never brings that tree's *next* group into the same
// call's own ranking (see that function's module docstring, "A tree's paid
// groups unlock in order"). A single call with an ever-larger `rowCap` can
// therefore never progress a tree past its first paid group, no matter how
// high the cap goes -- rows just pile up among whatever's already
// reachable. So this calls it repeatedly in small batches instead, feeding
// each batch's purchases back as `workshopLevels`/`enhancementLevels`/
// `enhancementLabLevel`/`unlockedGroups` for the next one -- the same state
// shape a real player's entered levels would carry, just advanced by this
// simulation instead of by hand. That makes each call re-derive gating from
// up-to-date state, so a newly-unlocked group's upgrades become reachable
// from the very next batch on.
const BATCH_ROW_CAP = 50
// A safety ceiling on total batches, not on how far the plan can reach --
// every candidate (Workshop upgrades, Enhancement categories, the Lab,
// unlock groups) has a finite max level, so the loop below always ends on
// its own, by `ranked.length` dropping under `BATCH_ROW_CAP`, once
// everything reachable is either bought out or budget-exhausted, well under
// this many batches.
const MAX_BATCHES = 10_000

const applyEntry = (entry, { workshopLevels, enhancementLevels, unlockedGroups }) => {
  if (entry.source === 'workshop') {
    workshopLevels[entry.name] = entry.nextLevel
  } else if (entry.source === 'enhancement') {
    enhancementLevels[entry.name] = entry.nextLevel
  } else if (entry.source === 'unlock') {
    unlockedGroups[unlockGroupKey(entry.categoryId, entry.name)] = true
  }
  // 'lab' is handled by the caller, which tracks `enhancementLabLevel` as a
  // plain number rather than inside one of these maps.
}

/**
 * OQ-8/AC-2 + AC-5. The purchase sequence a full Workshop buy-out affords,
 * simulated from level zero against `budget` -- using
 * `getPrioritizedNextUpgrades` exactly as the Path list already does
 * (zero/default state is "simulated from level zero"), never a second
 * ranking algorithm. Drives it in `BATCH_ROW_CAP`-sized batches (see that
 * constant's own comment for why one large call can't be used instead),
 * spending down `budget` through each batch's rows in order and stopping
 * before the first entry it can't fully afford. A batch is never split to
 * use up leftover budget, the same "whole batch or not at all" rule
 * `nextBatchCost` already applies to cost data -- so `spent` can land under
 * `budget` with coins left over.
 *
 * `stoppedBy` tells the caller *why* the sequence ends, since the two
 * reasons look identical from `spent`/`budget` alone: `'budget'` when an
 * affordable-or-not entry was still waiting and budget ran out first,
 * `'exhausted'` when every reachable candidate got bought out (or stuck on
 * missing cost data) before the budget did -- a real "nothing left to
 * spend on" rather than a plan silently stopping short.
 */
export function simulateWorkshopBuyout(budget) {
  const workshopLevels = {}
  const enhancementLevels = {}
  const unlockedGroups = {}
  let enhancementLabLevel = 0

  const granular = []
  let spent = 0
  let stoppedBy = 'exhausted'

  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { ranked } = getPrioritizedNextUpgrades(
      { workshopLevels, enhancementLevels, enhancementLabLevel, unlockedGroups },
      { rowCap: BATCH_ROW_CAP },
    )
    if (ranked.length === 0) break

    let budgetRanOut = false
    for (const entry of ranked) {
      if (spent + entry.cost > budget) {
        budgetRanOut = true
        break
      }
      spent += entry.cost
      granular.push(entry)
      if (entry.source === 'lab') {
        enhancementLabLevel = 1
      } else {
        applyEntry(entry, { workshopLevels, enhancementLevels, unlockedGroups })
      }
    }

    if (budgetRanOut) {
      stoppedBy = 'budget'
      break
    }
    if (ranked.length < BATCH_ROW_CAP) break
  }

  return { budget, spent, stoppedBy, granular, rollup: rollupPurchases(granular) }
}

/**
 * OQ-8/AC-3 + AC-4. Groups consecutive entries of the same upgrade
 * (matched on `name` AND `source`, the same pairing `cheapestNextUpgrades.js`
 * requires everywhere else since the two overlap in name) into one rollup
 * row. Each group keeps its own constituent `entries` rather than just a
 * total, so the rollup is never a second calculation: expanding it back
 * (`rollup.flatMap((group) => group.entries)`) reproduces the granular
 * sequence it was built from exactly, by construction, which is what AC-4
 * requires a test assert.
 */
export function rollupPurchases(granular) {
  const groups = []

  for (const entry of granular) {
    const last = groups[groups.length - 1]
    if (last && last.name === entry.name && last.source === entry.source) {
      last.entries.push(entry)
    } else {
      groups.push({
        name: entry.name,
        source: entry.source,
        categoryId: entry.categoryId,
        categoryLabel: entry.categoryLabel,
        entries: [entry],
      })
    }
  }

  return groups.map((group) => ({
    name: group.name,
    source: group.source,
    categoryId: group.categoryId,
    categoryLabel: group.categoryLabel,
    startLevel: group.entries[0].currentLevel,
    endLevel: group.entries[group.entries.length - 1].nextLevel,
    levels: group.entries.reduce((sum, entry) => sum + entry.levels, 0),
    cost: group.entries.reduce((sum, entry) => sum + entry.cost, 0),
    entries: group.entries,
  }))
}

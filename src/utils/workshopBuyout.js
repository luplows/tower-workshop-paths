import { getPrioritizedNextUpgrades } from './cheapestNextUpgrades'

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

const INITIAL_ROW_CAP = 200
const ROW_CAP_GROWTH = 4
// A safety ceiling only -- every candidate (Workshop upgrades, Enhancement
// categories, the Lab, unlock groups) has a finite max level, so growing
// `rowCap` always terminates on its own once everything is bought out, well
// under this.
const MAX_ROW_CAP = 50_000

const totalCost = (entries) => entries.reduce((sum, entry) => sum + entry.cost, 0)

/**
 * OQ-8/AC-2 + AC-5. The purchase sequence a full Workshop buy-out affords,
 * simulated from level zero against `budget` -- using
 * `getPrioritizedNextUpgrades` exactly as the Path list already does
 * (zero/default state is "simulated from level zero"), never a second
 * ranking algorithm. That function caps its own simulation at a fixed
 * `rowCap`, which exists to bound a ranking shown on screen, not a
 * budget-exhaustion run -- so this grows `rowCap` until either the ranked
 * sequence's own cost has caught up with `budget` or nothing is left to
 * rank at all, then spends down `budget` through that sequence, stopping
 * before the first entry it can't fully afford. A batch is never split to
 * use up leftover budget, the same "whole batch or not at all" rule
 * `nextBatchCost` already applies to cost data -- so `spent` can land under
 * `budget` with coins left over.
 */
export function simulateWorkshopBuyout(budget) {
  let rowCap = INITIAL_ROW_CAP
  let ranked = []

  while (true) {
    ranked = getPrioritizedNextUpgrades({}, { rowCap }).ranked
    if (totalCost(ranked) >= budget) break
    if (ranked.length < rowCap) break
    if (rowCap >= MAX_ROW_CAP) break
    rowCap *= ROW_CAP_GROWTH
  }

  const granular = []
  let spent = 0
  for (const entry of ranked) {
    if (spent + entry.cost > budget) break
    spent += entry.cost
    granular.push(entry)
  }

  return { budget, spent, granular, rollup: rollupPurchases(granular) }
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

import { getPrioritizedNextUpgrades } from './cheapestNextUpgrades'
import { unlockGroupKey } from './workshopUnlockGroups'

/**
 * Full buy-out plan (OQ-8): a purchase sequence simulated from level zero,
 * each purchase chosen by `getPrioritizedNextUpgrades` and then applied to
 * the state it reads before the next is chosen -- a single call ranks from
 * the gates in its input only, so a gate one purchase opens (an unlock
 * group, the Enhancements Lab, an Enhancement tree's threshold) would
 * otherwise never take effect.
 */

// The inputs are the raw text of two entry fields. Returns the budget, or
// an `error` string and no budget when the entries cannot produce a plan.
export function computeBuyOutBudget(lifetimeCoins, labCoinsSpent) {
  const parse = (raw, label) => {
    const text = String(raw ?? '').trim()
    if (text === '') return { error: `Enter ${label}.` }
    const value = Number(text)
    if (!Number.isFinite(value)) return { error: `${label} must be a number.` }
    if (value < 0) return { error: `${label} cannot be negative.` }
    return { value }
  }

  const lifetime = parse(lifetimeCoins, 'Lifetime coins')
  if (lifetime.error) return { error: lifetime.error }
  const spent = parse(labCoinsSpent, 'Coins spent on Labs')
  if (spent.error) return { error: spent.error }
  if (spent.value > lifetime.value) {
    return { error: 'Coins spent on Labs cannot exceed lifetime coins.' }
  }
  return { budget: lifetime.value - spent.value }
}

const entryKey = (entry) => `${entry.source}:${entry.name}`

/**
 * Simulates the buy-out from zero. Returns `{ purchases, unpriced, budget,
 * spent, remaining, endedBy }`, `endedBy` being 'budget' (the next
 * recommended purchase costs more than what is left) or 'everything-bought'
 * (nothing priceable is left to buy). `purchases` are the buy order's own
 * rows; `unpriced` is everything it reported in `unknownCost` along the way.
 */
export function simulateBuyOut({
  budget,
  discountLabLevels = {},
  enhancementDiscountLabLevels = {},
}) {
  const workshopLevels = {}
  const enhancementLevels = {}
  const unlockedGroups = {}
  let enhancementLabLevel = 0

  const purchases = []
  const unpricedByKey = new Map()
  let spent = 0
  let endedBy = 'everything-bought'

  for (;;) {
    const { ranked, unknownCost } = getPrioritizedNextUpgrades(
      {
        workshopLevels,
        enhancementLevels,
        enhancementLabLevel,
        unlockedGroups,
        discountLabLevels,
        enhancementDiscountLabLevels,
      },
      { rowCap: 1 },
    )
    for (const entry of unknownCost) {
      if (!unpricedByKey.has(entryKey(entry))) unpricedByKey.set(entryKey(entry), entry)
    }

    const next = ranked[0]
    if (!next) break
    if (next.cost > budget - spent) {
      endedBy = 'budget'
      break
    }

    purchases.push(next)
    spent += next.cost
    if (next.source === 'lab') {
      enhancementLabLevel = 1
    } else if (next.source === 'unlock') {
      unlockedGroups[unlockGroupKey(next.categoryId, next.name)] = true
    } else if (next.source === 'workshop') {
      workshopLevels[next.name] = next.nextLevel
    } else {
      enhancementLevels[next.name] = next.nextLevel
    }
  }

  const unpriced = [...unpricedByKey.values()].sort((a, b) => a.name.localeCompare(b.name))
  return { purchases, unpriced, budget, spent, remaining: budget - spent, endedBy }
}

/**
 * One row per upgrade bought, keyed by source and name, in the order of
 * each upgrade's first purchase. Computed from the purchase list alone, so
 * it cannot drift from it.
 */
export function summarisePurchases(purchases) {
  const rows = new Map()
  for (const purchase of purchases) {
    const key = entryKey(purchase)
    const row = rows.get(key)
    if (row) {
      row.levelAfter = purchase.nextLevel
      row.purchaseCount += 1
      row.totalCost += purchase.cost
    } else {
      rows.set(key, {
        source: purchase.source,
        name: purchase.name,
        categoryId: purchase.categoryId,
        levelBefore: purchase.currentLevel,
        levelAfter: purchase.nextLevel,
        purchaseCount: 1,
        totalCost: purchase.cost,
      })
    }
  }
  return [...rows.values()]
}

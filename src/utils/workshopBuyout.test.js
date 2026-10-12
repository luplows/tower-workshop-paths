import { describe, expect, it } from 'vitest'
import { getPrioritizedNextUpgrades } from './cheapestNextUpgrades'
import {
  rollupPurchases,
  simulateWorkshopBuyout,
  validateBuyoutInputs,
} from './workshopBuyout'

describe('validateBuyoutInputs', () => {
  it('OQ-8/AC-1: computes the budget as lifetime coins minus coins spent on Labs', () => {
    expect(validateBuyoutInputs({ lifetimeCoins: '1000', coinsSpentOnLabs: '400' })).toEqual({
      valid: true,
      budget: 600,
    })
  })

  it('OQ-8/AC-1: a budget of zero is still a valid plan input', () => {
    expect(validateBuyoutInputs({ lifetimeCoins: '500', coinsSpentOnLabs: '500' })).toEqual({
      valid: true,
      budget: 0,
    })
  })

  it('reports nothing when both fields are still blank', () => {
    expect(validateBuyoutInputs({ lifetimeCoins: '', coinsSpentOnLabs: '' })).toEqual({
      valid: false,
      error: null,
    })
  })

  it('OQ-8/AC-6: reports coins spent on Labs exceeding lifetime coins', () => {
    const result = validateBuyoutInputs({ lifetimeCoins: '100', coinsSpentOnLabs: '200' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/cannot exceed/i)
  })

  it('OQ-8/AC-6: reports a non-numeric entry', () => {
    const result = validateBuyoutInputs({ lifetimeCoins: 'abc', coinsSpentOnLabs: '0' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('OQ-8/AC-6: reports a negative entry', () => {
    const result = validateBuyoutInputs({ lifetimeCoins: '-5', coinsSpentOnLabs: '0' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('OQ-8/AC-6: reports a negative coins-spent-on-Labs entry even when lifetime coins is valid', () => {
    const result = validateBuyoutInputs({ lifetimeCoins: '100', coinsSpentOnLabs: '-1' })
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })
})

describe('simulateWorkshopBuyout', () => {
  it('OQ-8/AC-2: the sequence matches the existing buy-order scoring run from zero, not a second algorithm', () => {
    const { ranked } = getPrioritizedNextUpgrades({}, { rowCap: 5 })
    const budget = ranked.slice(0, 3).reduce((sum, entry) => sum + entry.cost, 0)

    const plan = simulateWorkshopBuyout(budget)

    expect(plan.granular).toEqual(ranked.slice(0, 3))
  })

  it('OQ-8/AC-5: stops before an entry it cannot fully afford, and reports budget and spend', () => {
    const { ranked } = getPrioritizedNextUpgrades({}, { rowCap: 5 })
    const firstTwoCost = ranked.slice(0, 2).reduce((sum, entry) => sum + entry.cost, 0)
    const budget = firstTwoCost + Math.floor(ranked[2].cost / 2)

    const plan = simulateWorkshopBuyout(budget)

    expect(plan.budget).toBe(budget)
    expect(plan.spent).toBe(firstTwoCost)
    expect(plan.granular).toEqual(ranked.slice(0, 2))
  })

  it('OQ-8/AC-5: a zero budget produces an empty plan that spends nothing', () => {
    const plan = simulateWorkshopBuyout(0)

    expect(plan.spent).toBe(0)
    expect(plan.granular).toEqual([])
  })

  it('OQ-8/AC-2: a large budget grows past the default row cap rather than silently stopping at it', () => {
    const biggerCapRanked = getPrioritizedNextUpgrades({}, { rowCap: 100 }).ranked
    // Only meaningful if there really are more than 51 batches available
    // from zero -- true for this dataset, since the Workshop/Enhancement
    // trees have far more than 100.
    expect(biggerCapRanked.length).toBeGreaterThan(51)
    const first51Cost = totalCostOf(biggerCapRanked.slice(0, 51))

    const plan = simulateWorkshopBuyout(first51Cost)

    expect(plan.granular.length).toBeGreaterThan(50)
  })
})

function totalCostOf(entries) {
  return entries.reduce((sum, entry) => sum + entry.cost, 0)
}

describe('rollupPurchases', () => {
  const row = (overrides) => ({
    name: 'A',
    source: 'workshop',
    categoryId: 'attack',
    categoryLabel: 'Attack',
    currentLevel: 0,
    nextLevel: 1,
    levels: 1,
    cost: 10,
    ...overrides,
  })

  it('OQ-8/AC-3: groups consecutive purchases of the same upgrade, leaving a different one its own row', () => {
    const granular = [
      row({ currentLevel: 0, nextLevel: 1, cost: 10 }),
      row({ currentLevel: 1, nextLevel: 2, cost: 20 }),
      row({ name: 'B', currentLevel: 0, nextLevel: 1, cost: 5 }),
    ]

    const rollup = rollupPurchases(granular)

    expect(rollup).toHaveLength(2)
    expect(rollup[0]).toMatchObject({ name: 'A', startLevel: 0, endLevel: 2, levels: 2, cost: 30 })
    expect(rollup[1]).toMatchObject({ name: 'B', startLevel: 0, endLevel: 1, levels: 1, cost: 5 })
  })

  it('OQ-8/AC-3: does not merge the same upgrade name bought non-consecutively', () => {
    const granular = [
      row({ name: 'A', currentLevel: 0, nextLevel: 1, cost: 10 }),
      row({ name: 'B', currentLevel: 0, nextLevel: 1, cost: 5 }),
      row({ name: 'A', currentLevel: 1, nextLevel: 2, cost: 20 }),
    ]

    const rollup = rollupPurchases(granular)

    expect(rollup).toHaveLength(3)
  })

  it('OQ-8/AC-3: does not merge the same name across different sources (Workshop vs. Enhancement)', () => {
    const granular = [
      row({ name: 'Damage', source: 'workshop' }),
      row({ name: 'Damage', source: 'enhancement' }),
    ]

    const rollup = rollupPurchases(granular)

    expect(rollup).toHaveLength(2)
  })

  it('OQ-8/AC-4: expanding the rollup reproduces the granular sequence exactly, by construction', () => {
    const { ranked } = getPrioritizedNextUpgrades({}, { rowCap: 60 })

    const rollup = rollupPurchases(ranked)

    expect(rollup.flatMap((group) => group.entries)).toEqual(ranked)
  })

  it('OQ-8/AC-4: an empty granular sequence rolls up to nothing', () => {
    expect(rollupPurchases([])).toEqual([])
  })
})

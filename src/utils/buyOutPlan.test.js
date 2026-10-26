import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { computeBuyOutBudget, simulateBuyOut, summarisePurchases } from './buyOutPlan'

describe('computeBuyOutBudget', () => {
  it('OQ-8/AC-1: budget is lifetime coins less coins spent on Labs', () => {
    expect(computeBuyOutBudget('1000', '250')).toEqual({ budget: 750 })
    expect(computeBuyOutBudget('5e9', '0')).toEqual({ budget: 5e9 })
    expect(computeBuyOutBudget('100', '100')).toEqual({ budget: 0 })
  })

  it('OQ-8/AC-7: reports inputs that cannot produce a plan, with no budget', () => {
    for (const [lifetime, spent] of [
      ['100', '200'],
      ['abc', '0'],
      ['100', 'x'],
      ['-1', '0'],
      ['100', '-5'],
      ['', '0'],
      ['100', ''],
      ['Infinity', '0'],
    ]) {
      const result = computeBuyOutBudget(lifetime, spent)
      expect(result.error, `${lifetime}/${spent}`).toBeTruthy()
      expect(result.budget).toBeUndefined()
    }
  })
})

describe('simulateBuyOut', () => {
  it('OQ-8/AC-2: the sequence starts from level zero, and stops before the first purchase it cannot pay for', () => {
    const plan = simulateBuyOut({ budget: 100_000 })
    expect(plan.purchases.length).toBeGreaterThan(0)
    expect(plan.purchases[0].currentLevel).toBe(0)
    expect(plan.endedBy).toBe('budget')
    expect(plan.spent).toBeLessThanOrEqual(100_000)
    expect(plan.remaining).toBeCloseTo(100_000 - plan.spent)
    // Re-running with exactly what was spent buys the same sequence.
    expect(simulateBuyOut({ budget: plan.spent }).purchases).toEqual(plan.purchases)
  })

  it('OQ-8/AC-2: prices purchases with the entered discount Labs', () => {
    const full = simulateBuyOut({ budget: 1e6 })
    const discounted = simulateBuyOut({
      budget: 1e6,
      discountLabLevels: { attack: 50, defense: 50, utility: 50 },
    })
    expect(discounted.purchases.length).toBeGreaterThan(full.purchases.length)
  })

  it('OQ-8/AC-2: prices Enhancements with the entered Enhancement discount Labs', () => {
    const budget = 1e11
    const full = simulateBuyOut({ budget })
    const discounted = simulateBuyOut({
      budget,
      enhancementDiscountLabLevels: { attack: 50, defense: 50, utility: 50 },
    })
    const firstEnhancement = (plan) => plan.purchases.find((p) => p.source === 'enhancement')
    expect(firstEnhancement(discounted).cost).toBeLessThan(firstEnhancement(full).cost)
  }, 120_000)

  it('OQ-8/AC-3: a budget above everything maxes every upgrade, or lists it as unpriced', () => {
    const plan = simulateBuyOut({ budget: Number.MAX_VALUE })
    expect(plan.endedBy).toBe('everything-bought')

    const reached = {}
    for (const purchase of plan.purchases) {
      reached[`${purchase.source}:${purchase.name}`] = purchase.nextLevel
    }
    const unpriced = new Set(plan.unpriced.map((entry) => `${entry.source}:${entry.name}`))

    const check = (categories, source) => {
      for (const category of categories) {
        for (const upgrade of category.upgrades) {
          const key = `${source}:${upgrade.name}`
          expect(
            reached[key] === upgrade.quantity || unpriced.has(key),
            `${key} reached ${reached[key]} of ${upgrade.quantity}`,
          ).toBe(true)
        }
      }
    }
    check(WORKSHOP_CATEGORIES, 'workshop')
    check(ENHANCEMENT_CATEGORIES, 'enhancement')
    expect(reached['lab:Workshop Enhancements Lab']).toBe(1)
  }, 120_000)

  it('OQ-8/AC-6: lists what the buy order reports as unknownCost, in both endings', () => {
    const full = simulateBuyOut({ budget: Number.MAX_VALUE })
    const small = simulateBuyOut({ budget: 1000 })
    expect(small.endedBy).toBe('budget')
    expect(small.spent + small.remaining).toBe(1000)
    expect(full.spent + full.remaining).toBe(Number.MAX_VALUE)
    expect(Array.isArray(small.unpriced)).toBe(true)
    expect(Array.isArray(full.unpriced)).toBe(true)
  }, 120_000)
})

describe('summarisePurchases', () => {
  const plan = simulateBuyOut({ budget: 5e9 })
  const summary = summarisePurchases(plan.purchases)

  it('OQ-8/AC-5: counts and costs add up to the granular list', () => {
    const repeated = summary.filter((row) => row.purchaseCount > 1)
    expect(repeated.length).toBeGreaterThanOrEqual(2)
    expect(summary.reduce((sum, row) => sum + row.purchaseCount, 0)).toBe(plan.purchases.length)
    expect(summary.reduce((sum, row) => sum + row.totalCost, 0)).toBeCloseTo(plan.spent, 3)
  })

  it('OQ-8/AC-5: each row levels equal the first and last granular entries, in first-purchase order', () => {
    const order = []
    for (const row of summary) {
      const entries = plan.purchases.filter((p) => p.source === row.source && p.name === row.name)
      expect(row.levelBefore).toBe(entries[0].currentLevel)
      expect(row.levelAfter).toBe(entries.at(-1).nextLevel)
      order.push(plan.purchases.indexOf(entries[0]))
    }
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('OQ-8/AC-4: keys rows by source and name, so same-named Workshop and Enhancement upgrades stay apart', () => {
    const rows = summarisePurchases([
      { source: 'workshop', name: 'Damage', currentLevel: 0, nextLevel: 1, cost: 5 },
      { source: 'enhancement', name: 'Damage', currentLevel: 0, nextLevel: 1, cost: 7 },
    ])
    expect(rows).toHaveLength(2)
  })
})

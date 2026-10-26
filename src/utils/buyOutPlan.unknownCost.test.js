import { describe, expect, it, vi } from 'vitest'

const rows = [
  { source: 'workshop', name: 'A', currentLevel: 0, nextLevel: 1, cost: 10 },
  { source: 'workshop', name: 'B', currentLevel: 0, nextLevel: 1, cost: 50 },
]

// Stubs the buy order: it recommends each row once, then nothing, and
// reports one upgrade it cannot price on every call.
vi.mock('./cheapestNextUpgrades', () => {
  let calls = 0
  return {
    getPrioritizedNextUpgrades: () => ({
      ranked: calls < 2 ? [rows[calls++]] : [],
      unknownCost: [{ source: 'enhancement', name: 'Mystery' }],
    }),
  }
})

import { simulateBuyOut } from './buyOutPlan'

describe('simulateBuyOut unknownCost', () => {
  it('OQ-8/AC-6: an unknownCost entry reaches unpriced when everything priceable is bought', () => {
    const plan = simulateBuyOut({ budget: 1000 })
    expect(plan.endedBy).toBe('everything-bought')
    expect(plan.purchases).toHaveLength(2)
    expect(plan.unpriced.map((e) => e.name)).toEqual(['Mystery'])
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const rows = [
  { source: 'workshop', name: 'A', currentLevel: 0, nextLevel: 1, cost: 10 },
  { source: 'workshop', name: 'B', currentLevel: 0, nextLevel: 1, cost: 50 },
]

// Stubs the buy order: it recommends each row once, then nothing, and
// reports one upgrade it cannot price on every call.
const state = vi.hoisted(() => ({ calls: 0 }))

vi.mock('./cheapestNextUpgrades', () => {
  return {
    getPrioritizedNextUpgrades: () => ({
      ranked: state.calls < 2 ? [rows[state.calls++]] : [],
      unknownCost: [{ source: 'enhancement', name: 'Mystery' }],
    }),
  }
})

import { simulateBuyOut } from './buyOutPlan'

describe('simulateBuyOut unknownCost', () => {
  beforeEach(() => {
    state.calls = 0
  })

  it('OQ-8/AC-6: an unknownCost entry reaches unpriced when the budget runs out', () => {
    const plan = simulateBuyOut({ budget: 20 })
    expect(plan.endedBy).toBe('budget')
    expect(plan.purchases).toHaveLength(1)
    expect(plan.unpriced.map((e) => e.name)).toEqual(['Mystery'])
  })

  it('OQ-8/AC-6: an unknownCost entry reaches unpriced when everything priceable is bought', () => {
    const plan = simulateBuyOut({ budget: 1000 })
    expect(plan.endedBy).toBe('everything-bought')
    expect(plan.purchases).toHaveLength(2)
    expect(plan.unpriced.map((e) => e.name)).toEqual(['Mystery'])
  })
})

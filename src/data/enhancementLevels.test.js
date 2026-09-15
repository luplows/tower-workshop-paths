import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from './enhancementCategories'
import { ENHANCEMENT_LEVELS } from './enhancementLevels'

const ALL_UPGRADES = ENHANCEMENT_CATEGORIES.flatMap((category) => category.upgrades)

describe('ENHANCEMENT_LEVELS', () => {
  it('has a cost array for every Enhancement category, and nothing extra', () => {
    expect(Object.keys(ENHANCEMENT_LEVELS).sort()).toEqual(
      ALL_UPGRADES.map((u) => u.name).sort(),
    )
  })

  it("matches each category's own quantity (max level) exactly", () => {
    // A mismatch here means either enhancementCategories.js's quantity or
    // this file's transcribed array is wrong -- getPrioritizedNextUpgrades
    // (OQ-2) and enhancementTreeSpend (OQ-6) both rely on every level up to
    // `quantity - 1` having real cost data, with nothing beyond it.
    for (const upgrade of ALL_UPGRADES) {
      expect(ENHANCEMENT_LEVELS[upgrade.name], `expected a cost array for "${upgrade.name}"`).toHaveLength(
        upgrade.quantity,
      )
    }
  })

  it('has only positive, finite costs -- no gaps, sentinels, or transcription slips', () => {
    // Unlike WORKSHOP_LEVELS (tower-idle-toolkit), this data has no known
    // gaps or "nothing more to buy" sentinel (see cheapestNextUpgrades.js) --
    // every entry should be a real, positive cost.
    for (const [name, costs] of Object.entries(ENHANCEMENT_LEVELS)) {
      for (const [level, cost] of costs.entries()) {
        expect(Number.isFinite(cost), `${name} level ${level}: ${cost}`).toBe(true)
        expect(cost, `${name} level ${level}: ${cost}`).toBeGreaterThan(0)
      }
    }
  })

  it('costs strictly increase within each category, matching every known category (no reversals)', () => {
    // Not a rule enforced by this file's own shape -- a transcription slip
    // (two rows swapped, a digit dropped) could easily produce a cost lower
    // than the level before it without violating anything else checked
    // above. Real per-level Workshop Enhancement costs only ever rise.
    for (const [name, costs] of Object.entries(ENHANCEMENT_LEVELS)) {
      for (let level = 1; level < costs.length; level++) {
        expect(
          costs[level],
          `${name} level ${level} (${costs[level]}) should cost more than level ${level - 1} (${costs[level - 1]})`,
        ).toBeGreaterThan(costs[level - 1])
      }
    }
  })

  // Change-detection tripwire, not a correctness assertion: this data is
  // hand-transcribed from the community sheet's own condensed display
  // values (see the comment atop enhancementLevels.js), so there's no
  // independent source to verify it against here -- this only catches an
  // *accidental* future edit (a stray keystroke, a dropped/duplicated row),
  // the same role workshopCategories.test.js's and
  // enhancementCategories.test.js's snapshots play for their own data. A
  // snapshot update should always be a deliberate, reviewed choice -- see
  // Open-Questions.md.
  it('matches the known per-level cost data (snapshot)', () => {
    expect(ENHANCEMENT_LEVELS).toMatchSnapshot()
  })
})

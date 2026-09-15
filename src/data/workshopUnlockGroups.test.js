import { describe, expect, it } from 'vitest'
import { WORKSHOP_CATEGORIES } from './workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from './workshopUnlockGroups'

describe('WORKSHOP_UNLOCK_GROUPS', () => {
  it('has an entry for every Workshop category id', () => {
    expect(Object.keys(WORKSHOP_UNLOCK_GROUPS).sort()).toEqual(
      WORKSHOP_CATEGORIES.map((c) => c.id).sort(),
    )
  })

  it('starts every tree with a free "Default" group', () => {
    for (const groups of Object.values(WORKSHOP_UNLOCK_GROUPS)) {
      expect(groups[0].name).toBe('Default')
      expect(groups[0].cost).toBe(0)
    }
  })

  it('covers every Workshop upgrade in its tree exactly once, across all groups', () => {
    for (const category of WORKSHOP_CATEGORIES) {
      const groups = WORKSHOP_UNLOCK_GROUPS[category.id]
      const covered = groups.flatMap((g) => g.upgrades)
      expect(covered.sort()).toEqual(category.upgrades.map((u) => u.name).sort())
      expect(new Set(covered).size).toBe(covered.length)
    }
  })

  // Change-detection tripwire, not a correctness assertion: this data is
  // hand-transcribed (see the comment atop workshopUnlockGroups.js), so a
  // snapshot update here should always be a deliberate, reviewed choice --
  // confirm it reflects a real correction to the source data, not an
  // accidental edit. Same role workshopCategories.test.js's snapshot plays
  // for Workshop upgrades themselves.
  it('matches the known group structure (snapshot)', () => {
    expect(WORKSHOP_UNLOCK_GROUPS).toMatchSnapshot()
  })
})

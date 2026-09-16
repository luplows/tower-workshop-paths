// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  findUnlockGroup,
  isUnlockGroupPurchased,
  isWorkshopUpgradeUnlocked,
  nextPurchasableGroup,
  unlockGroupKey,
} from './workshopUnlockGroups'

describe('workshopUnlockGroups', () => {
  describe('findUnlockGroup', () => {
    it('finds the group a real Workshop upgrade belongs to', () => {
      expect(findUnlockGroup('attack', 'Range')?.name).toBe('Range Upgrades')
      expect(findUnlockGroup('attack', 'Damage')?.name).toBe('Default')
    })

    it('returns undefined for a non-Workshop category id (e.g. an Enhancement tree)', () => {
      expect(findUnlockGroup('lab', 'Workshop Enhancements Lab')).toBeUndefined()
    })
  })

  describe('unlockGroupKey', () => {
    it('composes a category-qualified key, since group names collide across trees and systems', () => {
      expect(unlockGroupKey('attack', 'Default')).toBe('attack:Default')
      expect(unlockGroupKey('defense', 'Default')).toBe('defense:Default')
      expect(unlockGroupKey('attack', 'Default')).not.toBe(unlockGroupKey('defense', 'Default'))
    })
  })

  describe('isUnlockGroupPurchased', () => {
    it('is false when the key is absent, and true once marked', () => {
      expect(isUnlockGroupPurchased('attack', 'Range Upgrades', {})).toBe(false)
      expect(isUnlockGroupPurchased('attack', 'Range Upgrades', undefined)).toBe(false)
      expect(
        isUnlockGroupPurchased('attack', 'Range Upgrades', {
          [unlockGroupKey('attack', 'Range Upgrades')]: true,
        }),
      ).toBe(true)
    })
  })

  describe('isWorkshopUpgradeUnlocked', () => {
    it('is always true for a free "Default" group upgrade, regardless of purchased state', () => {
      expect(isWorkshopUpgradeUnlocked('attack', 'Damage', {})).toBe(true)
      expect(isWorkshopUpgradeUnlocked('attack', 'Damage', undefined)).toBe(true)
    })

    it('is false for a paid group\'s upgrade until purchased', () => {
      expect(isWorkshopUpgradeUnlocked('attack', 'Range', {})).toBe(false)
      expect(
        isWorkshopUpgradeUnlocked('attack', 'Range', {
          [unlockGroupKey('attack', 'Range Upgrades')]: true,
        }),
      ).toBe(true)
    })

    // Defense's order: Default (Health/Health Regen) -> "Defense Upgrades"
    // (Defense Percent/Defense Absolute) -> "Thorn Upgrades" (Thorns) -> ...
    // -- groups unlock in order, so Thorns can't be bought before Defense
    // Upgrades, even though they gate unrelated upgrades.
    it("stays locked for a later group's upgrade even if that group's own flag is (incorrectly) marked purchased, when an earlier group isn't", () => {
      expect(
        isWorkshopUpgradeUnlocked('defense', 'Thorns', {
          [unlockGroupKey('defense', 'Thorn Upgrades')]: true,
        }),
      ).toBe(false)
    })

    it("unlocks once its own group and every earlier group in the tree are purchased", () => {
      expect(
        isWorkshopUpgradeUnlocked('defense', 'Thorns', {
          [unlockGroupKey('defense', 'Defense Upgrades')]: true,
          [unlockGroupKey('defense', 'Thorn Upgrades')]: true,
        }),
      ).toBe(true)
    })
  })

  describe('nextPurchasableGroup', () => {
    it("is the tree's first paid group when nothing has been purchased", () => {
      expect(nextPurchasableGroup('defense', {})?.name).toBe('Defense Upgrades')
    })

    it('advances to the next group in order once the current one is purchased', () => {
      expect(
        nextPurchasableGroup('defense', {
          [unlockGroupKey('defense', 'Defense Upgrades')]: true,
        })?.name,
      ).toBe('Thorn Upgrades')
    })

    it("isn't fooled by a later group marked purchased out of order", () => {
      // Same real-world mistake as the isWorkshopUpgradeUnlocked test above
      // -- "Thorn Upgrades" marked purchased shouldn't skip "Defense
      // Upgrades", which is still the actual next one in sequence.
      expect(
        nextPurchasableGroup('defense', {
          [unlockGroupKey('defense', 'Thorn Upgrades')]: true,
        })?.name,
      ).toBe('Defense Upgrades')
    })

    it('is undefined once every paid group in the tree is purchased', () => {
      const allDefensePaidGroups = {
        [unlockGroupKey('defense', 'Defense Upgrades')]: true,
        [unlockGroupKey('defense', 'Thorn Upgrades')]: true,
        [unlockGroupKey('defense', 'Lifesteal Upgrades')]: true,
        [unlockGroupKey('defense', 'Knockback Upgrades')]: true,
        [unlockGroupKey('defense', 'Orbs Upgrades')]: true,
        [unlockGroupKey('defense', 'Shockwave Upgrades')]: true,
        [unlockGroupKey('defense', 'Land Mine Upgrades')]: true,
        [unlockGroupKey('defense', 'Death Defy')]: true,
        [unlockGroupKey('defense', 'The Wall')]: true,
      }
      expect(nextPurchasableGroup('defense', allDefensePaidGroups)).toBeUndefined()
    })
  })
})

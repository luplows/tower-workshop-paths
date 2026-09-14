import { describe, expect, it } from 'vitest'
import {
  findUnlockGroup,
  isUnlockGroupPurchased,
  isWorkshopUpgradeUnlocked,
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
  })
})

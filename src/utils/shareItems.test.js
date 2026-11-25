import { describe, expect, it } from 'vitest'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'
import { TOWER_DATA_KEYS } from '../storageKeys'
import { DATA_REVISION } from './shareCodec'
import { SHARE_ITEMS, idTable, itemTableFingerprint } from './shareItems'

const K = TOWER_DATA_KEYS

// The permanent table, written out. Rows are only ever ADDED: to add an item,
// append its row here and in shareItems.js, then raise DATA_REVISION.
const PINNED_IDS = {
  1: [K.workshopLevels, 'Damage'],
  2: [K.workshopLevels, 'Attack Speed'],
  3: [K.workshopLevels, 'Critical Chance'],
  4: [K.workshopLevels, 'Critical Factor'],
  5: [K.workshopLevels, 'Range'],
  6: [K.workshopLevels, 'Damage / Meter'],
  7: [K.workshopLevels, 'Multishot Chance'],
  8: [K.workshopLevels, 'Multishot Targets'],
  9: [K.workshopLevels, 'Rapid Fire Chance'],
  10: [K.workshopLevels, 'Rapid Fire Duration'],
  11: [K.workshopLevels, 'Bounce Shot Chance'],
  12: [K.workshopLevels, 'Bounce Shot Targets'],
  13: [K.workshopLevels, 'Bounce Shot Range'],
  14: [K.workshopLevels, 'Super Crit Chance'],
  15: [K.workshopLevels, 'Super Crit Mult'],
  16: [K.workshopLevels, 'Rend Armor Chance'],
  17: [K.workshopLevels, 'Rend Armor Mult'],
  18: [K.workshopLevels, 'Health'],
  19: [K.workshopLevels, 'Health Regen'],
  20: [K.workshopLevels, 'Defense Percent'],
  21: [K.workshopLevels, 'Defense Absolute'],
  22: [K.workshopLevels, 'Thorns'],
  23: [K.workshopLevels, 'Lifesteal'],
  24: [K.workshopLevels, 'Knockback Chance'],
  25: [K.workshopLevels, 'Knockback Force'],
  26: [K.workshopLevels, 'Orb Speed'],
  27: [K.workshopLevels, 'Orbs'],
  28: [K.workshopLevels, 'Shockwave Size'],
  29: [K.workshopLevels, 'Shockwave Frequency'],
  30: [K.workshopLevels, 'Land Mine Chance'],
  31: [K.workshopLevels, 'Land Mine Damage'],
  32: [K.workshopLevels, 'Land Mine Radius'],
  33: [K.workshopLevels, 'Death Defy'],
  34: [K.workshopLevels, 'Wall Health'],
  35: [K.workshopLevels, 'Wall Rebuild'],
  36: [K.workshopLevels, 'Cash Bonus'],
  37: [K.workshopLevels, 'Cash / Wave'],
  38: [K.workshopLevels, 'Coins / Kill Bonus'],
  39: [K.workshopLevels, 'Coins / Wave'],
  40: [K.workshopLevels, 'Free Attack Upgrade'],
  41: [K.workshopLevels, 'Free Defense Upgrade'],
  42: [K.workshopLevels, 'Free Utility Upgrade'],
  43: [K.workshopLevels, 'Interest / Wave'],
  44: [K.workshopLevels, 'Recovery Amount'],
  45: [K.workshopLevels, 'Max Recovery'],
  46: [K.workshopLevels, 'Package Chance'],
  47: [K.workshopLevels, 'Enemy Attack Level Skip'],
  48: [K.workshopLevels, 'Enemy Health Level Skip'],
  49: [K.enhancementLevels, 'Damage'],
  50: [K.enhancementLevels, 'Rend Armor'],
  51: [K.enhancementLevels, 'Critical Factor'],
  52: [K.enhancementLevels, 'Damage/Meter'],
  53: [K.enhancementLevels, 'Super Crit Mult'],
  54: [K.enhancementLevels, 'Attack Speed'],
  55: [K.enhancementLevels, 'Health'],
  56: [K.enhancementLevels, 'Health Regen'],
  57: [K.enhancementLevels, 'Defense Absolute'],
  58: [K.enhancementLevels, 'Land Mine Damage'],
  59: [K.enhancementLevels, 'Wall Health'],
  60: [K.enhancementLevels, 'Orb Size'],
  61: [K.enhancementLevels, 'Cash Bonus'],
  62: [K.enhancementLevels, 'Coin Bonus'],
  63: [K.enhancementLevels, 'Cells/Kill Bonus'],
  64: [K.enhancementLevels, 'Free Upgrades'],
  65: [K.enhancementLevels, 'Recovery Package'],
  66: [K.enhancementLevels, 'Enemy Level Skip'],
  67: [K.workshopDiscountLabs, 'attack'],
  68: [K.workshopDiscountLabs, 'defense'],
  69: [K.workshopDiscountLabs, 'utility'],
  70: [K.enhancementDiscountLabs, 'attack'],
  71: [K.enhancementDiscountLabs, 'defense'],
  72: [K.enhancementDiscountLabs, 'utility'],
  73: [K.enhancementLabLevel, null],
  74: [K.workshopUnlockedGroups, 'attack:Default'],
  75: [K.workshopUnlockedGroups, 'attack:Range Upgrades'],
  76: [K.workshopUnlockedGroups, 'attack:Multishot Upgrades'],
  77: [K.workshopUnlockedGroups, 'attack:Rapid Fire Upgrades'],
  78: [K.workshopUnlockedGroups, 'attack:Bounce Shot Upgrades'],
  79: [K.workshopUnlockedGroups, 'attack:Super Critical Hits'],
  80: [K.workshopUnlockedGroups, 'attack:Rend Armor'],
  81: [K.workshopUnlockedGroups, 'defense:Default'],
  82: [K.workshopUnlockedGroups, 'defense:Defense Upgrades'],
  83: [K.workshopUnlockedGroups, 'defense:Thorn Upgrades'],
  84: [K.workshopUnlockedGroups, 'defense:Lifesteal Upgrades'],
  85: [K.workshopUnlockedGroups, 'defense:Knockback Upgrades'],
  86: [K.workshopUnlockedGroups, 'defense:Orbs Upgrades'],
  87: [K.workshopUnlockedGroups, 'defense:Shockwave Upgrades'],
  88: [K.workshopUnlockedGroups, 'defense:Land Mine Upgrades'],
  89: [K.workshopUnlockedGroups, 'defense:Death Defy'],
  90: [K.workshopUnlockedGroups, 'defense:The Wall'],
  91: [K.workshopUnlockedGroups, 'utility:Default'],
  92: [K.workshopUnlockedGroups, 'utility:Cash Bonuses'],
  93: [K.workshopUnlockedGroups, 'utility:Coin Bonuses'],
  94: [K.workshopUnlockedGroups, 'utility:Upgrade Chances'],
  95: [K.workshopUnlockedGroups, 'utility:Interest / Wave'],
  96: [K.workshopUnlockedGroups, 'utility:Recovery Package'],
  97: [K.workshopUnlockedGroups, 'utility:Enemy Level Skips'],
  98: [K.buyOutLifetimeCoins, null],
  99: [K.buyOutLabCoinsSpent, null],
}

// Pinned alongside the revision it was taken at. When the data files change
// the fingerprint, raise DATA_REVISION in shareCodec.js, then update both.
const PINNED_DATA = { revision: 1, fingerprint: 'b530b5bb' }

describe('OQ-141 shareItems', () => {
  it('OQ-141/AC-2 never removes, reuses or reassigns an ID: every pinned row is still in the table, unchanged', () => {
    const current = idTable()
    for (const [id, row] of Object.entries(PINNED_IDS)) {
      expect(current[id], `ID ${id} (${row.join(' / ')}) was removed or given to another item`).toEqual(row)
    }
  })

  it('OQ-141/AC-2 only ever adds: IDs are unique, and every added ID is above the pinned ones', () => {
    const ids = SHARE_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    const pinnedMax = Math.max(...Object.keys(PINNED_IDS).map(Number))
    const added = ids.filter((id) => !(id in PINNED_IDS))
    for (const id of added) expect(id).toBeGreaterThan(pinnedMax)
    const rows = SHARE_ITEMS.map((item) => `${item.key}\0${item.name}`)
    expect(new Set(rows).size).toBe(rows.length)
  })

  it('OQ-141/AC-2 gives every item in the data files an ID', () => {
    const has = (key, name) => SHARE_ITEMS.some((item) => item.key === key && item.name === name)
    for (const category of WORKSHOP_CATEGORIES) {
      for (const { name } of category.upgrades) {
        expect(has(K.workshopLevels, name), `Workshop upgrade "${name}" has no ID`).toBe(true)
      }
      expect(has(K.workshopDiscountLabs, category.id), `Workshop discount Lab "${category.id}" has no ID`).toBe(true)
    }
    for (const category of ENHANCEMENT_CATEGORIES) {
      for (const { name } of category.upgrades) {
        expect(has(K.enhancementLevels, name), `Enhancement "${name}" has no ID`).toBe(true)
      }
      expect(
        has(K.enhancementDiscountLabs, category.id),
        `Enhancement discount Lab "${category.id}" has no ID`,
      ).toBe(true)
    }
    for (const [treeId, groups] of Object.entries(WORKSHOP_UNLOCK_GROUPS)) {
      for (const group of groups) {
        expect(has(K.workshopUnlockedGroups, `${treeId}:${group.name}`), `unlock group ${treeId}:${group.name} has no ID`).toBe(true)
      }
    }
  })

  it('OQ-141/AC-2 gives every tower-data key an ID', () => {
    for (const key of Object.values(K)) {
      expect(
        SHARE_ITEMS.some((item) => item.key === key),
        `tower-data key ${key} has no ID`,
      ).toBe(true)
    }
    // The Enhancements Lab level and the two Buy-out inputs are the keys' own value.
    for (const key of [K.enhancementLabLevel, K.buyOutLifetimeCoins, K.buyOutLabCoinsSpent]) {
      expect(SHARE_ITEMS.filter((item) => item.key === key)).toHaveLength(1)
    }
  })

  it('OQ-141/AC-4 raises the data revision whenever the item table fingerprint changes', () => {
    const fingerprint = itemTableFingerprint()
    expect(
      fingerprint,
      `The item table (IDs, names, maxes) changed. Raise DATA_REVISION in shareCodec.js (now ${DATA_REVISION}) and update PINNED_DATA to { revision: <new>, fingerprint: '${fingerprint}' }.`,
    ).toBe(PINNED_DATA.fingerprint)
    expect(DATA_REVISION).toBe(PINNED_DATA.revision)
  })

  it('OQ-141/AC-4 fingerprint changes with any max, name or ID', () => {
    const base = itemTableFingerprint()
    const item = SHARE_ITEMS[0]
    const { max, name, id } = item
    try {
      item.max = max + 1
      expect(itemTableFingerprint()).not.toBe(base)
      item.max = max
      item.name = `${name}!`
      expect(itemTableFingerprint()).not.toBe(base)
      item.name = name
      item.id = id + 1000
      expect(itemTableFingerprint()).not.toBe(base)
    } finally {
      Object.assign(item, { max, name, id })
    }
    expect(itemTableFingerprint()).toBe(base)
  })
})

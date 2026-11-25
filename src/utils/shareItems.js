import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { TOWER_DATA_KEYS as KEYS } from '../storageKeys'
import { WORKSHOP_DISCOUNT_LAB_MAX_LEVEL } from './workshopDiscount'
import { ENHANCEMENT_DISCOUNT_LAB_MAX_LEVEL } from './enhancementDiscount'

/**
 * Permanent numeric IDs for everything a share link can carry (OQ-141/AC-2).
 * A link outlives the code, so an ID is only ever ADDED: never removed,
 * reused, or given to a different item. shareItems.test.js pins this table
 * and fails if that happens. The next unused ID is 100.
 *
 * Each row is `[id, name]` under the tower-data key it belongs to. `name` is
 * the item's key inside that stored object -- an upgrade name, a tree id for
 * a discount Lab, a `tree:group` key for an unlock group -- or null when the
 * stored value is the item itself.
 */
const ID_TABLE = {
  [KEYS.workshopLevels]: [
    [1, 'Damage'], [2, 'Attack Speed'], [3, 'Critical Chance'], [4, 'Critical Factor'],
    [5, 'Range'], [6, 'Damage / Meter'], [7, 'Multishot Chance'], [8, 'Multishot Targets'],
    [9, 'Rapid Fire Chance'], [10, 'Rapid Fire Duration'], [11, 'Bounce Shot Chance'],
    [12, 'Bounce Shot Targets'], [13, 'Bounce Shot Range'], [14, 'Super Crit Chance'],
    [15, 'Super Crit Mult'], [16, 'Rend Armor Chance'], [17, 'Rend Armor Mult'],
    [18, 'Health'], [19, 'Health Regen'], [20, 'Defense Percent'], [21, 'Defense Absolute'],
    [22, 'Thorns'], [23, 'Lifesteal'], [24, 'Knockback Chance'], [25, 'Knockback Force'],
    [26, 'Orb Speed'], [27, 'Orbs'], [28, 'Shockwave Size'], [29, 'Shockwave Frequency'],
    [30, 'Land Mine Chance'], [31, 'Land Mine Damage'], [32, 'Land Mine Radius'],
    [33, 'Death Defy'], [34, 'Wall Health'], [35, 'Wall Rebuild'], [36, 'Cash Bonus'],
    [37, 'Cash / Wave'], [38, 'Coins / Kill Bonus'], [39, 'Coins / Wave'],
    [40, 'Free Attack Upgrade'], [41, 'Free Defense Upgrade'], [42, 'Free Utility Upgrade'],
    [43, 'Interest / Wave'], [44, 'Recovery Amount'], [45, 'Max Recovery'],
    [46, 'Package Chance'], [47, 'Enemy Attack Level Skip'], [48, 'Enemy Health Level Skip'],
  ],
  [KEYS.enhancementLevels]: [
    [49, 'Damage'], [50, 'Rend Armor'], [51, 'Critical Factor'], [52, 'Damage/Meter'],
    [53, 'Super Crit Mult'], [54, 'Attack Speed'], [55, 'Health'], [56, 'Health Regen'],
    [57, 'Defense Absolute'], [58, 'Land Mine Damage'], [59, 'Wall Health'], [60, 'Orb Size'],
    [61, 'Cash Bonus'], [62, 'Coin Bonus'], [63, 'Cells/Kill Bonus'], [64, 'Free Upgrades'],
    [65, 'Recovery Package'], [66, 'Enemy Level Skip'],
  ],
  [KEYS.workshopDiscountLabs]: [
    [67, 'attack'], [68, 'defense'], [69, 'utility'],
  ],
  [KEYS.enhancementDiscountLabs]: [
    [70, 'attack'], [71, 'defense'], [72, 'utility'],
  ],
  [KEYS.enhancementLabLevel]: [[73, null]],
  [KEYS.workshopUnlockedGroups]: [
    [74, 'attack:Default'], [75, 'attack:Range Upgrades'], [76, 'attack:Multishot Upgrades'],
    [77, 'attack:Rapid Fire Upgrades'], [78, 'attack:Bounce Shot Upgrades'],
    [79, 'attack:Super Critical Hits'], [80, 'attack:Rend Armor'], [81, 'defense:Default'],
    [82, 'defense:Defense Upgrades'], [83, 'defense:Thorn Upgrades'],
    [84, 'defense:Lifesteal Upgrades'], [85, 'defense:Knockback Upgrades'],
    [86, 'defense:Orbs Upgrades'], [87, 'defense:Shockwave Upgrades'],
    [88, 'defense:Land Mine Upgrades'], [89, 'defense:Death Defy'], [90, 'defense:The Wall'],
    [91, 'utility:Default'], [92, 'utility:Cash Bonuses'], [93, 'utility:Coin Bonuses'],
    [94, 'utility:Upgrade Chances'], [95, 'utility:Interest / Wave'],
    [96, 'utility:Recovery Package'], [97, 'utility:Enemy Level Skips'],
  ],
  [KEYS.buyOutLifetimeCoins]: [[98, null]],
  [KEYS.buyOutLabCoinsSpent]: [[99, null]],
}

/** How each tower-data key's items are stored, and so how a record carries them. */
export const VALUE_KINDS = {
  level: 'level', // a non-negative integer, 0..max
  flag: 'flag', // a set member: present or absent
  text: 'text', // a string
}

const KIND_OF_KEY = {
  [KEYS.workshopLevels]: VALUE_KINDS.level,
  [KEYS.enhancementLevels]: VALUE_KINDS.level,
  [KEYS.workshopDiscountLabs]: VALUE_KINDS.level,
  [KEYS.enhancementDiscountLabs]: VALUE_KINDS.level,
  [KEYS.enhancementLabLevel]: VALUE_KINDS.level,
  [KEYS.workshopUnlockedGroups]: VALUE_KINDS.flag,
  [KEYS.buyOutLifetimeCoins]: VALUE_KINDS.text,
  [KEYS.buyOutLabCoinsSpent]: VALUE_KINDS.text,
}

const maxesByName = (categories) =>
  Object.fromEntries(
    categories.flatMap((category) => category.upgrades.map(({ name, quantity }) => [name, quantity])),
  )
const WORKSHOP_MAX = maxesByName(WORKSHOP_CATEGORIES)
const ENHANCEMENT_MAX = maxesByName(ENHANCEMENT_CATEGORIES)

// The current max of a level item; undefined when the data files no longer
// have it (the ID stays in the table), and for items that are not levels.
const maxOf = (key, name) => {
  if (key === KEYS.workshopLevels) return WORKSHOP_MAX[name]
  if (key === KEYS.enhancementLevels) return ENHANCEMENT_MAX[name]
  if (key === KEYS.workshopDiscountLabs) return WORKSHOP_DISCOUNT_LAB_MAX_LEVEL
  if (key === KEYS.enhancementDiscountLabs) return ENHANCEMENT_DISCOUNT_LAB_MAX_LEVEL
  if (key === KEYS.enhancementLabLevel) return 1
  return undefined
}

/** @type {{id: number, key: string, name: string|null, kind: string, max: number|undefined}[]} */
export const SHARE_ITEMS = Object.entries(ID_TABLE)
  .flatMap(([key, rows]) =>
    rows.map(([id, name]) => ({ id, key, name, kind: KIND_OF_KEY[key], max: maxOf(key, name) })),
  )
  .sort((a, b) => a.id - b.id)

export const ITEM_BY_ID = new Map(SHARE_ITEMS.map((item) => [item.id, item]))

/** The permanent table as `id -> [key, name]`, for the test that pins it. */
export const idTable = () => Object.fromEntries(SHARE_ITEMS.map(({ id, key, name }) => [id, [key, name]]))

/**
 * A fingerprint of every item's ID, name and current max (OQ-141/AC-4): FNV-1a
 * over one line per item. The data revision in shareCodec.js must be raised
 * whenever this changes.
 */
export function itemTableFingerprint() {
  let hash = 0x811c9dc5
  const text = SHARE_ITEMS.map(({ id, key, name, max }) => `${id}|${key}|${name}|${max}`).join('\n')
  for (const byte of new TextEncoder().encode(text)) {
    hash = Math.imul(hash ^ byte, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

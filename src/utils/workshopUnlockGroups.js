import { WORKSHOP_UNLOCK_GROUPS } from '../data/workshopUnlockGroups'

// Every Workshop upgrade belongs to exactly one unlock group within its
// tree (see workshopUnlockGroups.js) -- undefined only for a non-Workshop
// category id (e.g. an Enhancement tree, which has no unlock groups at
// all), never for a real Workshop upgrade.
export function findUnlockGroup(categoryId, upgradeName) {
  return WORKSHOP_UNLOCK_GROUPS[categoryId]?.find((group) =>
    group.upgrades.includes(upgradeName),
  )
}

// `unlockedGroups` (the `workshopUnlockedGroups` localStorage shape) is a
// flat `{ [key]: true }` map, keyed by this composite key rather than the
// group's own `name` alone -- group names aren't unique across trees (every
// tree has its own free "Default" group) or even across systems (Utility's
// paid "Recovery Package" group shares a name with an Enhancement category).
export const unlockGroupKey = (categoryId, groupName) => `${categoryId}:${groupName}`

export const isUnlockGroupPurchased = (categoryId, groupName, unlockedGroups) =>
  Boolean(unlockedGroups?.[unlockGroupKey(categoryId, groupName)])

// A group with no cost (every tree's free starter group) is always
// unlocked, no purchase or persisted state needed.
export function isWorkshopUpgradeUnlocked(categoryId, upgradeName, unlockedGroups) {
  const group = findUnlockGroup(categoryId, upgradeName)
  if (!group || group.cost === 0) return true
  return isUnlockGroupPurchased(categoryId, group.name, unlockedGroups)
}

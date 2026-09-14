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

// A tree's paid groups must be bought in order -- the game doesn't let you
// unlock "Thorn Upgrades" before "Defense Upgrades", even though they gate
// unrelated upgrades. Returns the earliest not-yet-purchased paid group in
// the tree (the only one currently purchasable), or undefined once every
// group in the tree is bought. Walking from the start rather than trusting
// any individual group's own flag also makes this self-correcting against
// inconsistent stored state (e.g. a later group marked purchased without an
// earlier one) -- a later group's flag is never enough on its own.
export function nextPurchasableGroup(categoryId, unlockedGroups) {
  const groups = WORKSHOP_UNLOCK_GROUPS[categoryId] ?? []
  return groups
    .slice(1) // every tree's first group is the free "Default", never purchasable
    .find((group) => !isUnlockGroupPurchased(categoryId, group.name, unlockedGroups))
}

// A group with no cost (every tree's free starter group) is always
// unlocked, no purchase or persisted state needed. A paid group's upgrade
// is unlocked only once its own group, and every group before it in the
// tree's order, have all been purchased -- see `nextPurchasableGroup`.
export function isWorkshopUpgradeUnlocked(categoryId, upgradeName, unlockedGroups) {
  const group = findUnlockGroup(categoryId, upgradeName)
  if (!group || group.cost === 0) return true

  const groups = WORKSHOP_UNLOCK_GROUPS[categoryId] ?? []
  for (const candidate of groups.slice(1)) {
    if (!isUnlockGroupPurchased(categoryId, candidate.name, unlockedGroups)) return false
    if (candidate === group) return true
  }
  return true
}

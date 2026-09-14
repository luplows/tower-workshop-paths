import { enhancementTreeSpend } from '../utils/enhancementTreeSpend'
import { formatCoins } from '../utils/formatCoins'
import { findUnlockGroup, isUnlockGroupPurchased } from '../utils/workshopUnlockGroups'
import { UpgradeLevelInput } from './UpgradeLevelInput'

// Two independent, unrelated gates can lock a row here, one per system:
// - Enhancement categories carry `unlocksAt` (a plain Workshop upgrade
//   never does) -- each later category in a tree stays locked, showing a
//   note, until the tree's cumulative spend crosses its threshold
//   (Project-Outline.md's "Workshop Enhancements" section, OQ-6).
// - Workshop upgrades belong to an unlock group (`onUnlockGroup` is only
//   ever passed by the Upgrade screen -- Enhance leaves it undefined, so
//   this branch never runs there, guarding against a false-positive group
//   match since category ids, and even some names, overlap between the two
//   systems) -- a not-yet-purchased group shows an inline "Unlock" button
//   instead of the note, since unlocking here is a distinct one-time
//   purchase, not something that resolves itself as spend accumulates
//   (OQ-5).
export function WorkshopCategoryPanel({
  category,
  levels,
  onLevelChange,
  formatValue,
  nameSuffix = '',
  unlockedGroups,
  onUnlockGroup,
}) {
  const treeSpend = enhancementTreeSpend(category, levels)

  return (
    <div
      role="tabpanel"
      id={`panel-${category.id}`}
      aria-labelledby={`tab-${category.id}`}
      className={`category-panel category-panel--${category.id}`}
    >
      {category.upgrades.map((upgrade) => {
        const enhancementLocked = upgrade.unlocksAt != null && treeSpend < upgrade.unlocksAt
        if (enhancementLocked) {
          return (
            <div key={upgrade.name} className="upgrade-row upgrade-row--locked">
              <span className="upgrade-row__label">{`${upgrade.name}${nameSuffix}`}</span>
              <span className="upgrade-row__locked-note">
                Locked until {formatCoins(upgrade.unlocksAt)} spent in this tree
              </span>
            </div>
          )
        }

        const unlockGroup = onUnlockGroup
          ? findUnlockGroup(category.id, upgrade.name)
          : undefined
        const groupLocked =
          unlockGroup?.cost > 0 &&
          !isUnlockGroupPurchased(category.id, unlockGroup.name, unlockedGroups)
        if (groupLocked) {
          return (
            <div key={upgrade.name} className="upgrade-row upgrade-row--locked">
              <span className="upgrade-row__label">{`${upgrade.name}${nameSuffix}`}</span>
              <button
                type="button"
                className="upgrade-row__unlock"
                onClick={() => onUnlockGroup(category.id, unlockGroup.name)}
              >
                Unlock &quot;{unlockGroup.name}&quot; ({formatCoins(unlockGroup.cost)})
              </button>
            </div>
          )
        }

        return (
          <UpgradeLevelInput
            key={upgrade.name}
            upgrade={upgrade}
            level={levels[upgrade.name] ?? 0}
            onChange={(level) => onLevelChange(upgrade.name, level)}
            formatValue={formatValue}
            nameSuffix={nameSuffix}
          />
        )
      })}
    </div>
  )
}

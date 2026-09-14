import { enhancementTreeSpend } from '../utils/enhancementTreeSpend'
import { formatCoins } from '../utils/formatCoins'
import {
  findUnlockGroup,
  isWorkshopUpgradeUnlocked,
  nextPurchasableGroup,
} from '../utils/workshopUnlockGroups'
import { UpgradeLevelInput } from './UpgradeLevelInput'

// Two independent, unrelated gates can hide an upgrade here, one per
// system:
// - Enhancement categories carry `unlocksAt` (a plain Workshop upgrade
//   never does) -- each later category in a tree stays locked, showing a
//   note in its usual place, until the tree's cumulative spend crosses its
//   threshold (Project-Outline.md's "Workshop Enhancements" section, OQ-6).
// - Workshop upgrades belong to an unlock group (`onUnlockGroup` is only
//   ever passed by the Upgrade screen -- Enhance leaves it undefined, so
//   this branch never runs there, guarding against a false-positive group
//   match since category ids, and even some names, overlap between the two
//   systems), and a tree's paid groups unlock in order (OQ-5). Unlike the
//   Enhancement gate, a locked Workshop upgrade isn't shown as a row at
//   all -- with several groups' worth potentially still locked, a row (or
//   button) per upgrade got noisy. Instead, every currently-locked upgrade
//   is hidden entirely, and a single Unlock button for the tree's one
//   currently-purchasable group appears once, below the visible upgrades
//   -- the same "one button, not a row" shape as the Enhance screen's own
//   Lab-unlock prompt.
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
  const purchasableGroup = onUnlockGroup
    ? nextPurchasableGroup(category.id, unlockedGroups)
    : undefined

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
          !isWorkshopUpgradeUnlocked(category.id, upgrade.name, unlockedGroups)
        if (groupLocked) return null

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
      {purchasableGroup && (
        <button
          type="button"
          className="category-panel__unlock"
          onClick={() => onUnlockGroup(category.id, purchasableGroup.name)}
        >
          Unlock &quot;{purchasableGroup.name}&quot; ({formatCoins(purchasableGroup.cost)})
        </button>
      )}
    </div>
  )
}

import { enhancementTreeSpend } from '../utils/enhancementTreeSpend'
import { formatCoins } from '../utils/formatCoins'
import {
  DISCOUNT_LAB_LABEL,
  formatDiscountPercent,
  WORKSHOP_DISCOUNT_LAB_MAX_LEVEL,
  workshopDiscountPercent,
} from '../utils/workshopDiscount'
import {
  findUnlockGroup,
  isWorkshopUpgradeUnlocked,
  nextPurchasableGroup,
} from '../utils/workshopUnlockGroups'
import { UpgradeLevelInput } from './UpgradeLevelInput'

const DISCOUNT_LAB_UPGRADE = { name: DISCOUNT_LAB_LABEL, quantity: WORKSHOP_DISCOUNT_LAB_MAX_LEVEL }

// Two independent, unrelated gates can hide an upgrade here, one per
// system -- both now follow the same "show only the next one, hide the
// rest" shape as the game's own Workshop upgrade-unlock screen:
// - Enhancement categories carry `unlocksAt` (a plain Workshop upgrade
//   never does) -- categories are listed in ascending-threshold order
//   within a tree, so the first not-yet-reached one is always the next to
//   unlock. Only that one shows a row at all, with the coins still needed
//   (threshold minus the tree's current cumulative spend, OQ-6) -- every
//   category after it is hidden entirely rather than each showing its own
//   (fully redundant, since they're all still further away) locked note.
// - Workshop upgrades belong to an unlock group (`onUnlockGroup` is only
//   ever passed by the Upgrade screen -- Enhance leaves it undefined, so
//   this branch never runs there, guarding against a false-positive group
//   match since category ids, and even some names, overlap between the two
//   systems), and a tree's paid groups unlock in order (OQ-5). A locked
//   Workshop upgrade isn't shown as a row at all -- every currently-locked
//   upgrade is hidden, and a single Unlock button for the tree's one
//   currently-purchasable group appears once, below the visible upgrades.
//
// `discountLabLevels`/`onDiscountLabLevelChange` are Workshop-only too (OQ-4),
// gated on the same "only the Upgrade screen passes this" pattern as
// `onUnlockGroup` -- the discount Lab reduces this tree's own Workshop
// upgrade costs, nothing Enhancement-related, so it has no place on the
// Enhance screen.
export function WorkshopCategoryPanel({
  category,
  levels,
  onLevelChange,
  formatValue,
  nameSuffix = '',
  unlockedGroups,
  onUnlockGroup,
  discountLabLevels,
  onDiscountLabLevelChange,
}) {
  const treeSpend = enhancementTreeSpend(category, levels)
  const purchasableGroup = onUnlockGroup
    ? nextPurchasableGroup(category.id, unlockedGroups)
    : undefined
  const nextLockedCategory = category.upgrades.find(
    (upgrade) => upgrade.unlocksAt != null && treeSpend < upgrade.unlocksAt,
  )

  return (
    <div
      role="tabpanel"
      id={`panel-${category.id}`}
      aria-labelledby={`tab-${category.id}`}
      className={`category-panel category-panel--${category.id}`}
    >
      {onDiscountLabLevelChange && (
        <UpgradeLevelInput
          upgrade={DISCOUNT_LAB_UPGRADE}
          level={discountLabLevels?.[category.id] ?? 0}
          onChange={(level) => onDiscountLabLevelChange(category.id, level)}
          formatValue={(level) => formatDiscountPercent(workshopDiscountPercent(category.id, level))}
        />
      )}
      {category.upgrades.map((upgrade) => {
        const enhancementLocked = upgrade.unlocksAt != null && treeSpend < upgrade.unlocksAt
        if (enhancementLocked) {
          if (upgrade !== nextLockedCategory) return null
          const remaining = upgrade.unlocksAt - treeSpend
          return (
            <div key={upgrade.name} className="upgrade-row upgrade-row--locked">
              <span className="upgrade-row__label">{`${upgrade.name}${nameSuffix}`}</span>
              <span className="upgrade-row__locked-note">
                {formatCoins(remaining)} more spent in this tree to unlock
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

import { enhancementTreeSpend } from '../utils/enhancementTreeSpend'
import { formatCoins } from '../utils/formatCoins'
import { UpgradeLevelInput } from './UpgradeLevelInput'

// Only Enhancement categories carry `unlocksAt` (a plain Workshop upgrade
// never does, so `treeSpend` below is computed but unused for those) --
// each later category in a tree stays locked, showing a note instead of its
// usual input, until the tree's cumulative spend crosses its threshold
// (Project-Outline.md's "Workshop Enhancements" section, OQ-6).
export function WorkshopCategoryPanel({
  category,
  levels,
  onLevelChange,
  formatValue,
  nameSuffix = '',
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
        const locked = upgrade.unlocksAt != null && treeSpend < upgrade.unlocksAt
        if (locked) {
          return (
            <div key={upgrade.name} className="upgrade-row upgrade-row--locked">
              <span className="upgrade-row__label">{`${upgrade.name}${nameSuffix}`}</span>
              <span className="upgrade-row__locked-note">
                Locked until {formatCoins(upgrade.unlocksAt)} spent in this tree
              </span>
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

import { UpgradeLevelInput } from './UpgradeLevelInput'

export function WorkshopCategoryPanel({
  category,
  levels,
  onLevelChange,
  formatValue,
  nameSuffix,
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${category.id}`}
      aria-labelledby={`tab-${category.id}`}
      className={`category-panel category-panel--${category.id}`}
    >
      {category.upgrades.map((upgrade) => (
        <UpgradeLevelInput
          key={upgrade.name}
          upgrade={upgrade}
          level={levels[upgrade.name] ?? 0}
          onChange={(level) => onLevelChange(upgrade.name, level)}
          formatValue={formatValue}
          nameSuffix={nameSuffix}
        />
      ))}
    </div>
  )
}

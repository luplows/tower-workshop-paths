import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { BottomTabBar } from './BottomTabBar'
import { WorkshopCategoryPanel } from './WorkshopCategoryPanel'
import './WorkshopInputs.css'

/**
 * Category tabs + level-input panel + localStorage persistence, shared by
 * the Workshop Upgrade screen and the Workshop Enhancements screen -- same
 * three trees, same per-item level input, different data, storage key, and
 * (via `nameSuffix`) displayed name -- Enhance passes " +" to match the
 * game's own "{name} +" naming convention (OQ-29), Upgrade passes nothing.
 * Which tree tab is active is owned by the caller (App), not here, so it
 * stays the same tree when switching between the Upgrade and Enhance
 * screens -- see Open-Questions.md's OQ-16.
 *
 * `unlockedGroups`/`onUnlockGroup` and `discountLabLevels`/
 * `onDiscountLabLevelChange` are both Workshop-only (OQ-5/OQ-4) --
 * WorkshopInputs passes them through, EnhancementInputs leaves them
 * undefined, since neither unlock groups nor discount Labs have any
 * Enhancement equivalent (Enhancements only have the per-tree spend gate,
 * handled separately -- see WorkshopCategoryPanel).
 */
export function CategoryLevelInputs({
  categories,
  storageKey,
  formatValue,
  nameSuffix,
  activeCategoryId,
  onCategoryChange,
  unlockedGroups,
  onUnlockGroup,
  discountLabLevels,
  onDiscountLabLevelChange,
}) {
  const [levels, setLevels] = useLocalStorageState(storageKey, {})

  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0]

  const handleLevelChange = (upgradeName, level) => {
    setLevels((previous) => ({ ...previous, [upgradeName]: level }))
  }

  return (
    <div className="workshop-inputs">
      <WorkshopCategoryPanel
        category={activeCategory}
        levels={levels}
        onLevelChange={handleLevelChange}
        formatValue={formatValue}
        nameSuffix={nameSuffix}
        unlockedGroups={unlockedGroups}
        onUnlockGroup={onUnlockGroup}
        discountLabLevels={discountLabLevels}
        onDiscountLabLevelChange={onDiscountLabLevelChange}
      />
      <BottomTabBar
        categories={categories}
        activeCategoryId={activeCategory.id}
        onSelect={onCategoryChange}
      />
    </div>
  )
}

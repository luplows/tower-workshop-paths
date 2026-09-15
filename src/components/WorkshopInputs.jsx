import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { unlockGroupKey } from '../utils/workshopUnlockGroups'
import { CategoryLevelInputs } from './CategoryLevelInputs'

// Owns `workshopUnlockedGroups` (OQ-5) and `workshopDiscountLabs` (OQ-4) --
// the same localStorage keys UpgradePath reads independently for the Path
// list's own unlock-group rows and discount-adjusted costs, the same
// pattern already used for `enhancementLabLevel` (OQ-32): the two screens
// are never mounted at once, so there's nothing to keep live-in-sync.
export function WorkshopInputs({ activeCategoryId, onCategoryChange }) {
  const [unlockedGroups, setUnlockedGroups] = useLocalStorageState(
    'workshopUnlockedGroups',
    {},
  )
  const [discountLabLevels, setDiscountLabLevels] = useLocalStorageState(
    'workshopDiscountLabs',
    {},
  )

  const handleUnlockGroup = (categoryId, groupName) => {
    setUnlockedGroups((previous) => ({
      ...previous,
      [unlockGroupKey(categoryId, groupName)]: true,
    }))
  }

  const handleDiscountLabLevelChange = (categoryId, level) => {
    setDiscountLabLevels((previous) => ({ ...previous, [categoryId]: level }))
  }

  return (
    <CategoryLevelInputs
      categories={WORKSHOP_CATEGORIES}
      storageKey="workshopLevels"
      activeCategoryId={activeCategoryId}
      onCategoryChange={onCategoryChange}
      unlockedGroups={unlockedGroups}
      onUnlockGroup={handleUnlockGroup}
      discountLabLevels={discountLabLevels}
      onDiscountLabLevelChange={handleDiscountLabLevelChange}
    />
  )
}

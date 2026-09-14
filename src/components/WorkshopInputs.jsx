import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { CategoryLevelInputs } from './CategoryLevelInputs'

export function WorkshopInputs({ activeCategoryId, onCategoryChange }) {
  return (
    <CategoryLevelInputs
      categories={WORKSHOP_CATEGORIES}
      storageKey="workshopLevels"
      activeCategoryId={activeCategoryId}
      onCategoryChange={onCategoryChange}
    />
  )
}

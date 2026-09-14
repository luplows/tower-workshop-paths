import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { formatEnhancementValue } from '../utils/enhancementValue'
import { CategoryLevelInputs } from './CategoryLevelInputs'

export function EnhancementInputs({ activeCategoryId, onCategoryChange }) {
  return (
    <CategoryLevelInputs
      categories={ENHANCEMENT_CATEGORIES}
      storageKey="enhancementLevels"
      formatValue={formatEnhancementValue}
      nameSuffix=" +"
      activeCategoryId={activeCategoryId}
      onCategoryChange={onCategoryChange}
    />
  )
}

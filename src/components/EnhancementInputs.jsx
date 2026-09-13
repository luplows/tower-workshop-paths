import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { CategoryLevelInputs } from './CategoryLevelInputs'

export function EnhancementInputs() {
  return (
    <CategoryLevelInputs
      categories={ENHANCEMENT_CATEGORIES}
      storageKey="enhancementLevels"
    />
  )
}

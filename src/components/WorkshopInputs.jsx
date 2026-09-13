import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { CategoryLevelInputs } from './CategoryLevelInputs'

export function WorkshopInputs() {
  return (
    <CategoryLevelInputs categories={WORKSHOP_CATEGORIES} storageKey="workshopLevels" />
  )
}

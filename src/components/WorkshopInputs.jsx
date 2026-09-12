import { useState } from 'react'
import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { BottomTabBar } from './BottomTabBar'
import { WorkshopCategoryPanel } from './WorkshopCategoryPanel'
import './WorkshopInputs.css'

export function WorkshopInputs() {
  const [activeCategoryId, setActiveCategoryId] = useState(WORKSHOP_CATEGORIES[0].id)
  const [levels, setLevels] = useLocalStorageState('workshopLevels', {})

  const activeCategory = WORKSHOP_CATEGORIES.find((c) => c.id === activeCategoryId)

  const handleLevelChange = (upgradeName, level) => {
    setLevels((previous) => ({ ...previous, [upgradeName]: level }))
  }

  return (
    <div className="workshop-inputs">
      <WorkshopCategoryPanel
        category={activeCategory}
        levels={levels}
        onLevelChange={handleLevelChange}
      />
      <BottomTabBar
        categories={WORKSHOP_CATEGORIES}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />
    </div>
  )
}

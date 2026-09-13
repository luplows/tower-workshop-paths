import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { BottomTabBar } from './BottomTabBar'
import { WorkshopCategoryPanel } from './WorkshopCategoryPanel'
import './WorkshopInputs.css'

/**
 * Category tabs + level-input panel + localStorage persistence, shared by
 * the Workshop Upgrade screen and the Workshop Enhancements screen -- same
 * three trees, same per-item level input, different data and storage key.
 */
export function CategoryLevelInputs({ categories, storageKey, formatValue }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id)
  const [levels, setLevels] = useLocalStorageState(storageKey, {})

  const activeCategory = categories.find((c) => c.id === activeCategoryId)

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
      />
      <BottomTabBar
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />
    </div>
  )
}

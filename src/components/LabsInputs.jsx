import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import {
  formatDiscountPercent,
  WORKSHOP_DISCOUNT_LAB_MAX_LEVEL,
  workshopDiscountPercent,
} from '../utils/workshopDiscount'
import { UpgradeLevelInput } from './UpgradeLevelInput'
import './WorkshopInputs.css'

/**
 * Dedicated top-level section for the Workshop discount Labs (OQ-4) -- one
 * flat list of 3 inputs (Attack/Defense/Utility), not nested under the
 * Upgrade/Enhance tree tabs the way it briefly was. There's nothing here
 * that varies by mode, and giving it a "Labs" slot in `ModeTabBar` would
 * break that bar's own invariant of mirroring only the game's two buttons
 * -- so, like Path, it lives at the same top level as Input/Path instead,
 * with no in-game equivalent to mirror.
 *
 * Owns `workshopDiscountLabs` directly (`{ attack, defense, utility }`,
 * each 0-99) rather than through a shared parent -- `WorkshopCategoryPanel`
 * (and `UpgradePath`, for scoring) still read it independently, the same
 * "no live parent to keep in sync, since these screens are never mounted
 * at once" pattern already used for `workshopUnlockedGroups`/
 * `enhancementLabLevel`.
 */
export function LabsInputs() {
  const [discountLabLevels, setDiscountLabLevels] = useLocalStorageState(
    'workshopDiscountLabs',
    {},
  )

  const handleChange = (categoryId, level) => {
    setDiscountLabLevels((previous) => ({ ...previous, [categoryId]: level }))
  }

  return (
    <div className="category-panel">
      {WORKSHOP_CATEGORIES.map((category) => (
        <UpgradeLevelInput
          key={category.id}
          upgrade={{
            name: `${category.label} Discount Lab`,
            quantity: WORKSHOP_DISCOUNT_LAB_MAX_LEVEL,
          }}
          level={discountLabLevels[category.id] ?? 0}
          onChange={(level) => handleChange(category.id, level)}
          formatValue={(level) => formatDiscountPercent(workshopDiscountPercent(category.id, level))}
        />
      ))}
    </div>
  )
}

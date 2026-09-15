import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { ENHANCEMENT_LAB_NAME } from '../utils/cheapestNextUpgrades'
import {
  ENHANCEMENT_DISCOUNT_LAB_MAX_LEVEL,
  enhancementDiscountPercent,
} from '../utils/enhancementDiscount'
import {
  formatDiscountPercent,
  WORKSHOP_DISCOUNT_LAB_MAX_LEVEL,
  workshopDiscountPercent,
} from '../utils/workshopDiscount'
import { UpgradeLevelInput } from './UpgradeLevelInput'
import './LabsInputs.css'
import './WorkshopInputs.css'

const ENHANCEMENT_LAB_UPGRADE = { name: ENHANCEMENT_LAB_NAME, quantity: 1 }
const formatUnlockState = (level) => (level >= 1 ? 'Unlocked' : 'Locked')

/**
 * Dedicated top-level section for every Lab this tool tracks -- Workshop
 * discount Labs first (OQ-4), then the one-time "Workshop Enhancements"
 * unlock (OQ-31/32), then the Enhancement discount Labs (OQ-37) below that.
 * Not nested under the Upgrade/Enhance tree tabs, and not a third
 * `ModeTabBar` entry either -- there's nothing here that varies by mode,
 * and giving it a slot in that bar would break its own invariant of
 * mirroring only the game's two buttons -- so, like Path, it lives at the
 * same top level as Input/Path instead, with no in-game equivalent to
 * mirror.
 *
 * Owns `workshopDiscountLabs` and `enhancementDiscountLabs` (both
 * `{ attack, defense, utility }`, 0-99 and 0-100 respectively) and
 * reads/writes `enhancementLabLevel` (0 or 1) directly, rather than
 * through a shared parent -- other screens that care about any of these
 * (`WorkshopCategoryPanel`/`UpgradePath` for the Workshop discount Labs;
 * `cheapestNextUpgrades.js`/`UpgradePath` for the Enhancement discount
 * Labs; `EnhancementInputs`/`UpgradePath` for the Enhancement unlock)
 * already read them independently, the same "no live parent to keep in
 * sync, since these screens are never mounted at once" pattern used
 * throughout. The Enhancement unlock is presented the same plain 0/1-Lab
 * shape as the discount Labs here -- no coins, no Buy button -- purely
 * "what do you currently have"; it still separately costs 5B coins to
 * actually reach that state in the Path list (OQ-31) and the Enhance
 * screen's own lock prompt (OQ-32), both untouched by this page.
 */
export function LabsInputs() {
  const [discountLabLevels, setDiscountLabLevels] = useLocalStorageState(
    'workshopDiscountLabs',
    {},
  )
  const [enhancementLabLevel, setEnhancementLabLevel] = useLocalStorageState(
    'enhancementLabLevel',
    0,
  )
  const [enhancementDiscountLabLevels, setEnhancementDiscountLabLevels] = useLocalStorageState(
    'enhancementDiscountLabs',
    {},
  )

  const handleDiscountChange = (categoryId, level) => {
    setDiscountLabLevels((previous) => ({ ...previous, [categoryId]: level }))
  }

  const handleEnhancementDiscountChange = (categoryId, level) => {
    setEnhancementDiscountLabLevels((previous) => ({ ...previous, [categoryId]: level }))
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
          onChange={(level) => handleDiscountChange(category.id, level)}
          formatValue={(level) => formatDiscountPercent(workshopDiscountPercent(category.id, level))}
        />
      ))}

      <div className="labs-inputs__divider" />
      <span className="labs-inputs__section-label">Enhancements</span>
      <UpgradeLevelInput
        upgrade={ENHANCEMENT_LAB_UPGRADE}
        level={enhancementLabLevel}
        onChange={setEnhancementLabLevel}
        formatValue={formatUnlockState}
      />
      {WORKSHOP_CATEGORIES.map((category) => (
        <UpgradeLevelInput
          key={`enhancement-discount-${category.id}`}
          upgrade={{
            name: `${category.label} Enhancement Discount Lab`,
            quantity: ENHANCEMENT_DISCOUNT_LAB_MAX_LEVEL,
          }}
          level={enhancementDiscountLabLevels[category.id] ?? 0}
          onChange={(level) => handleEnhancementDiscountChange(category.id, level)}
          formatValue={(level) => formatDiscountPercent(enhancementDiscountPercent(level))}
        />
      ))}
    </div>
  )
}

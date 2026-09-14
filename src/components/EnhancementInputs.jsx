import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { ENHANCEMENT_LAB_COST } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import { formatEnhancementValue } from '../utils/enhancementValue'
import { CategoryLevelInputs } from './CategoryLevelInputs'
import './EnhancementInputs.css'

/**
 * The whole Enhancement system is gated behind the one-time Workshop
 * Enhancements Lab in-game (see Project-Outline.md, OQ-31) -- so until
 * it's bought, this screen shows a lock prompt instead of the usual
 * tree tabs + level inputs. Owns its own `enhancementLabLevel`
 * localStorage read/write, the same pattern as `workshopLevels`/
 * `enhancementLevels` elsewhere (UpgradePath keeps its own independent
 * copy of this same key, for the Path list's own Lab row) rather than
 * this being lifted to a shared parent -- the two screens are never
 * mounted at once, so there's nothing to keep in sync live.
 */
export function EnhancementInputs({ activeCategoryId, onCategoryChange }) {
  const [enhancementLabLevel, setEnhancementLabLevel] = useLocalStorageState(
    'enhancementLabLevel',
    0,
  )

  if (enhancementLabLevel < 1) {
    return (
      <div className="enhancement-lock">
        <p className="enhancement-lock__title">Workshop Enhancements are locked</p>
        <p className="enhancement-lock__body">
          Buy the one-time Workshop Enhancements Lab to start entering levels here.
        </p>
        <button
          type="button"
          className="enhancement-lock__unlock"
          onClick={() => setEnhancementLabLevel(1)}
        >
          Unlock ({formatCoins(ENHANCEMENT_LAB_COST)})
        </button>
      </div>
    )
  }

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

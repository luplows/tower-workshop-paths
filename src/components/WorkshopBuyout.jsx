import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { formatCoins } from '../utils/formatCoins'
import { simulateWorkshopBuyout, validateBuyoutInputs } from '../utils/workshopBuyout'
import './WorkshopBuyout.css'

// Mirrors UpgradePath's own `displayName` -- the two components are never
// mounted at once and this is only a few lines, so a shared export isn't
// worth the coupling for OQ-8's own scope.
const displayName = (entry) => {
  if (entry.source === 'enhancement') return `${entry.name} +`
  if (entry.source === 'unlock') return `Unlock: ${entry.name}`
  return entry.name
}

const VIEWS = [
  { id: 'rollup', label: 'Rollup' },
  { id: 'granular', label: 'Granular' },
]

/**
 * OQ-8. A full Workshop buy-out simulated from level zero against a coin
 * budget derived from lifetime coins and coins already spent on Labs --
 * additive to the existing per-upgrade entry flow (Input/Path/Labs), not a
 * replacement for it: this owns its own top-level section and its own pair
 * of localStorage-backed inputs, and touches nothing those screens read or
 * write (AC-8).
 */
export function WorkshopBuyout() {
  const [lifetimeCoins, setLifetimeCoins] = useLocalStorageState('buyoutLifetimeCoins', '')
  const [coinsSpentOnLabs, setCoinsSpentOnLabs] = useLocalStorageState(
    'buyoutCoinsSpentOnLabs',
    '',
  )
  const [viewId, setViewId] = useState(VIEWS[0].id)

  const validation = validateBuyoutInputs({ lifetimeCoins, coinsSpentOnLabs })
  const plan = validation.valid ? simulateWorkshopBuyout(validation.budget) : null

  return (
    <div className="workshop-buyout">
      <div className="workshop-buyout__inputs">
        <label className="workshop-buyout__field" htmlFor="workshop-buyout-lifetime-coins">
          Lifetime coins
        </label>
        <input
          id="workshop-buyout-lifetime-coins"
          type="number"
          inputMode="decimal"
          step="any"
          className="workshop-buyout__input"
          value={lifetimeCoins}
          onChange={(event) => setLifetimeCoins(event.target.value)}
        />

        <label className="workshop-buyout__field" htmlFor="workshop-buyout-coins-spent-on-labs">
          Coins spent on Labs
        </label>
        <input
          id="workshop-buyout-coins-spent-on-labs"
          type="number"
          inputMode="decimal"
          step="any"
          className="workshop-buyout__input"
          value={coinsSpentOnLabs}
          onChange={(event) => setCoinsSpentOnLabs(event.target.value)}
        />
      </div>

      {validation.error && (
        <p className="workshop-buyout__error" role="alert">
          {validation.error}
        </p>
      )}

      {plan && (
        <>
          <p className="workshop-buyout__summary">
            Budget: {formatCoins(plan.budget)}. Plan spends {formatCoins(plan.spent)}.
          </p>

          <div
            className="workshop-buyout__view-toggle"
            role="tablist"
            aria-label="Buyout plan view"
          >
            {VIEWS.map((view) => {
              const isActive = view.id === viewId
              return (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`workshop-buyout__view-tab${isActive ? ' workshop-buyout__view-tab--active' : ''}`}
                  onClick={() => setViewId(view.id)}
                >
                  {view.label}
                </button>
              )
            })}
          </div>

          {plan.granular.length === 0 ? (
            <p className="workshop-buyout__empty">
              The budget doesn&rsquo;t cover even the cheapest next purchase.
            </p>
          ) : viewId === 'rollup' ? (
            <ol className="workshop-buyout__list" aria-label="Simplified buyout plan">
              {plan.rollup.map((group) => (
                <li key={`${group.source}-${group.name}-${group.startLevel}`}>
                  <span className="workshop-buyout__name">{displayName(group)}</span>
                  <span className="workshop-buyout__level">
                    Lv {group.startLevel} → {group.endLevel}
                  </span>
                  <span className="workshop-buyout__cost">{formatCoins(group.cost)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="workshop-buyout__list" aria-label="Granular buyout plan">
              {plan.granular.map((entry, index) => (
                <li key={`${entry.source}-${entry.name}-${entry.currentLevel}-${index}`}>
                  <span className="workshop-buyout__name">{displayName(entry)}</span>
                  <span className="workshop-buyout__level">
                    Lv {entry.currentLevel} → {entry.nextLevel}
                  </span>
                  <span className="workshop-buyout__cost">{formatCoins(entry.cost)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  )
}

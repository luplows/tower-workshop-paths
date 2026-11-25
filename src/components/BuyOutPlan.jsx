import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { STORAGE_KEYS } from '../storageKeys'
import { computeBuyOutBudget, simulateBuyOut, summarisePurchases } from '../utils/buyOutPlan'
import { ENHANCEMENT_LAB_NAME } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import { UpgradeLevelInput } from './UpgradeLevelInput'
import './BuyOutPlan.css'
import './UpgradePath.css'
import './WorkshopInputs.css'

// The granular list of a full buy-out is thousands of rows (OQ-8), so it is
// shown a page at a time, "Show more" reaching every purchase in the plan.
const PAGE_SIZE = 100

const displayName = (entry) => {
  if (entry.source === 'enhancement') return `${entry.name} +`
  if (entry.source === 'unlock') return `Unlock: ${entry.name}`
  return entry.name
}

const ENHANCEMENT_LAB_UPGRADE = { name: ENHANCEMENT_LAB_NAME, quantity: 1 }
const formatUnlockState = (level) => (level >= 1 ? 'Unlocked' : 'Locked')

const rowClass = (entry) => `upgrade-path__row upgrade-path__row--${entry.categoryId} buy-out__row`
const buttonClass = 'upgrade-path__buy buy-out__button'

// Read when the plan is computed rather than held in state: the discount
// Labs are owned by LabsInputs, which writes them to localStorage as they
// change, and this sits beside it on the same page.
const readStored = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? {}
  } catch {
    return {}
  }
}

/**
 * The Respec view of Path (OQ-143), the full buy-out from lifetime coins
 * (OQ-8). Enter lifetime coins and the coins spent on Labs; the plan is
 * simulated from level zero, ignoring the levels entered on Input, and writes
 * nothing back. The Enhancements Lab is the player's own, the same
 * `enhancementLabLevel` the Labs page sets, and is never bought.
 */
export function BuyOutPlan() {
  const [lifetimeCoins, setLifetimeCoins] = useLocalStorageState(STORAGE_KEYS.buyOutLifetimeCoins, '')
  const [labCoinsSpent, setLabCoinsSpent] = useLocalStorageState(
    STORAGE_KEYS.buyOutLabCoinsSpent,
    '',
  )
  const [enhancementLabLevel, setEnhancementLabLevel] = useLocalStorageState(
    STORAGE_KEYS.enhancementLabLevel,
    0,
  )
  const [result, setResult] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const handleCompute = () => {
    const { budget, error } = computeBuyOutBudget(lifetimeCoins, labCoinsSpent)
    setVisibleCount(PAGE_SIZE)
    if (error) {
      setResult({ error })
      return
    }
    const plan = simulateBuyOut({
      budget,
      enhancementLabLevel,
      discountLabLevels: readStored(STORAGE_KEYS.workshopDiscountLabs),
      enhancementDiscountLabLevels: readStored(STORAGE_KEYS.enhancementDiscountLabs),
    })
    setResult({ plan, summary: summarisePurchases(plan.purchases) })
  }

  const plan = result?.plan

  return (
    <section className="buy-out" aria-label="Buy-out plan">
      <h2 className="buy-out__heading">Respec</h2>
      <UpgradeLevelInput
        upgrade={ENHANCEMENT_LAB_UPGRADE}
        level={enhancementLabLevel}
        onChange={(level) => {
          setEnhancementLabLevel(level)
          setResult(null)
        }}
        formatValue={formatUnlockState}
      />
      {enhancementLabLevel < 1 && (
        <p className="buy-out__note">
          The Enhancements Lab is needed for Enhancements, so the plan has none until it is set.
        </p>
      )}
      <p className="buy-out__note">Both amounts below are on the game's settings screen.</p>
      <label className="buy-out__field">
        Lifetime coins
        <input
          type="text"
          inputMode="decimal"
          value={lifetimeCoins}
          onChange={(event) => setLifetimeCoins(event.target.value)}
        />
      </label>
      <label className="buy-out__field">
        Coins spent on Labs
        <input
          type="text"
          inputMode="decimal"
          value={labCoinsSpent}
          onChange={(event) => setLabCoinsSpent(event.target.value)}
        />
      </label>
      <button type="button" className={buttonClass} onClick={handleCompute}>
        <span className="upgrade-path__buy-label">Plan buy-out</span>
      </button>

      {result?.error && (
        <p role="alert" className="buy-out__error">
          {result.error}
        </p>
      )}

      {plan && (
        <>
          <p className="buy-out__status">
            Budget {formatCoins(plan.budget)}, spent {formatCoins(plan.spent)}, left{' '}
            {formatCoins(plan.remaining)}.{' '}
            {plan.endedBy === 'budget'
              ? 'The budget runs out before the next recommended purchase.'
              : 'Everything priceable is bought.'}
          </p>

          {plan.unpriced.length > 0 && (
            <div>
              <p>Unpriced (no cost data) for {plan.unpriced.length} items:</p>
              <ul aria-label="Unpriced upgrades">
                {plan.unpriced.map((entry) => (
                  <li key={`${entry.source}-${entry.name}`}>{displayName(entry)}</li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="buy-out__subheading">Summary by upgrade</h3>
          <ul className="buy-out__list" aria-label="Buy-out summary">
            {result.summary.map((row) => (
              <li key={`${row.source}-${row.name}`} className={rowClass(row)}>
                <span className="upgrade-path__name">{displayName(row)}</span>
                <span className="upgrade-path__level">
                  Lv {row.levelBefore} → {row.levelAfter}
                </span>
                <span>
                  {row.purchaseCount} purchase{row.purchaseCount === 1 ? '' : 's'}
                </span>
                <span>{formatCoins(row.totalCost)}</span>
              </li>
            ))}
          </ul>

          <h3 className="buy-out__subheading">Purchases in order ({plan.purchases.length})</h3>
          <ol className="buy-out__list" aria-label="Buy-out purchases">
            {plan.purchases.slice(0, visibleCount).map((entry, index) => (
              <li key={index} className={rowClass(entry)}>
                <span className="upgrade-path__name">{displayName(entry)}</span>
                <span className="upgrade-path__level">
                  Lv {entry.currentLevel} → {entry.nextLevel}
                </span>
                <span>{formatCoins(entry.cost)}</span>
              </li>
            ))}
          </ol>
          {visibleCount < plan.purchases.length && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              <span className="upgrade-path__buy-label">
                Show more ({plan.purchases.length - visibleCount} left)
              </span>
            </button>
          )}
        </>
      )}
    </section>
  )
}

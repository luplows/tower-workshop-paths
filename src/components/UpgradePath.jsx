import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { getCheapestNextUpgrades } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import './UpgradePath.css'

export function UpgradePath() {
  const [levels, setLevels] = useLocalStorageState('workshopLevels', {})
  const [pendingBuy, setPendingBuy] = useState(null)
  const { ranked, unknownCost } = getCheapestNextUpgrades(levels)

  const applyBuy = (name, levelsToAdd) => {
    setLevels((previous) => ({
      ...previous,
      [name]: (previous[name] ?? 0) + levelsToAdd,
    }))
  }

  const handleBuyClick = (entry, index) => {
    // If this upgrade also appears earlier in the list (OQ-19 repeats),
    // buying just this row's batch would skip those -- ask which the
    // player actually wants rather than silently under-buying.
    const priorSameUpgrade = ranked
      .slice(0, index)
      .filter((row) => row.name === entry.name)

    if (priorSameUpgrade.length === 0) {
      applyBuy(entry.name, entry.levels)
      return
    }

    setPendingBuy({
      entry,
      priorLevels: priorSameUpgrade.reduce((sum, row) => sum + row.levels, 0),
      totalCost: priorSameUpgrade.reduce((sum, row) => sum + row.cost, 0) + entry.cost,
    })
  }

  const handleBuyAll = () => {
    applyBuy(pendingBuy.entry.name, pendingBuy.priorLevels + pendingBuy.entry.levels)
    setPendingBuy(null)
  }

  return (
    <div className="upgrade-path">
      {ranked.length === 0 ? (
        <p className="upgrade-path__empty">
          Every Workshop upgrade with known cost data is maxed out.
        </p>
      ) : (
        <ol className="upgrade-path__list" aria-label="Cheapest next upgrades">
          {ranked.map((entry, index) => (
            <li
              key={`${entry.name}-${entry.currentLevel}`}
              className={`upgrade-path__row upgrade-path__row--${entry.categoryId}`}
            >
              <span className="upgrade-path__rank">{index + 1}</span>
              <span className="upgrade-path__name">{entry.name}</span>
              <span className="upgrade-path__level">
                Lv {entry.currentLevel} → {entry.nextLevel}
              </span>
              <button
                type="button"
                className="upgrade-path__buy"
                aria-label={`Buy ${entry.levels} level${entry.levels === 1 ? '' : 's'} of ${entry.name} for ${formatCoins(entry.cost)}`}
                onClick={() => handleBuyClick(entry, index)}
              >
                <span className="upgrade-path__buy-label">Buy</span>
                <span className="upgrade-path__buy-cost">{formatCoins(entry.cost)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {unknownCost.length > 0 && (
        <div className="upgrade-path__unknown">
          <p className="upgrade-path__unknown-heading">
            Cost data unavailable at your current level for {unknownCost.length}{' '}
            upgrade{unknownCost.length === 1 ? '' : 's'} (see OQ-1):
          </p>
          <ul className="upgrade-path__unknown-list" aria-label="Upgrades with unknown cost">
            {unknownCost.map((entry) => (
              <li key={entry.name}>
                {entry.name} (Lv {entry.currentLevel})
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendingBuy && (
        <div className="upgrade-path__overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={`Buy all ${pendingBuy.entry.name} upgrades to reach Lv ${pendingBuy.entry.nextLevel} for ${formatCoins(pendingBuy.totalCost)}?`}
            className="upgrade-path__confirm"
          >
            <p className="upgrade-path__confirm-body">
              Buy all {pendingBuy.entry.name} upgrades to reach Lv{' '}
              {pendingBuy.entry.nextLevel} ({formatCoins(pendingBuy.totalCost)})?
            </p>
            <div className="upgrade-path__confirm-actions">
              <button
                type="button"
                className="upgrade-path__confirm-buy-all"
                onClick={handleBuyAll}
              >
                Buy all
              </button>
              <button
                type="button"
                className="upgrade-path__confirm-cancel"
                onClick={() => setPendingBuy(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

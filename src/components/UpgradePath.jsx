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

    const currentReal = levels[entry.name] ?? 0
    setPendingBuy({
      entry,
      priorCount: priorSameUpgrade.length,
      priorLevels: priorSameUpgrade.reduce((sum, row) => sum + row.levels, 0),
      justThisLevel: currentReal + entry.levels,
    })
  }

  const handleBuyJustThis = () => {
    applyBuy(pendingBuy.entry.name, pendingBuy.entry.levels)
    setPendingBuy(null)
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
            aria-labelledby="upgrade-path-confirm-title"
            className="upgrade-path__confirm"
          >
            <p id="upgrade-path-confirm-title" className="upgrade-path__confirm-title">
              {pendingBuy.entry.name} appears earlier in this list
            </p>
            <p className="upgrade-path__confirm-body">
              Buying just this batch adds {pendingBuy.entry.levels} level
              {pendingBuy.entry.levels === 1 ? '' : 's'}, reaching Lv{' '}
              {pendingBuy.justThisLevel} — skipping the {pendingBuy.priorCount}{' '}
              occurrence{pendingBuy.priorCount === 1 ? '' : 's'} of{' '}
              {pendingBuy.entry.name} shown above it. Buy those too to reach Lv{' '}
              {pendingBuy.entry.nextLevel} instead?
            </p>
            <div className="upgrade-path__confirm-actions">
              <button
                type="button"
                className="upgrade-path__confirm-buy-all"
                onClick={handleBuyAll}
              >
                Buy all {pendingBuy.priorCount + 1}
              </button>
              <button type="button" onClick={handleBuyJustThis}>
                Just this batch
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

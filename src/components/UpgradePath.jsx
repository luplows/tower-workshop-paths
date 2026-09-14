import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { getCheapestNextUpgrades } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import './UpgradePath.css'

export function UpgradePath() {
  const [workshopLevels, setWorkshopLevels] = useLocalStorageState('workshopLevels', {})
  const [enhancementLevels, setEnhancementLevels] = useLocalStorageState(
    'enhancementLevels',
    {},
  )
  const [pendingBuy, setPendingBuy] = useState(null)
  const { ranked, unknownCost } = getCheapestNextUpgrades({
    workshopLevels,
    enhancementLevels,
  })

  // Workshop and Enhancement names overlap (e.g. "Damage", "Health"), so a
  // buy must be routed by source, not just name, to the matching
  // localStorage-backed state.
  const applyBuy = (entry, levelsToAdd) => {
    const setLevels = entry.source === 'workshop' ? setWorkshopLevels : setEnhancementLevels
    setLevels((previous) => ({
      ...previous,
      [entry.name]: (previous[entry.name] ?? 0) + levelsToAdd,
    }))
  }

  const handleBuyClick = (entry, index) => {
    // If this same item (same name AND source) also appears earlier in the
    // list (OQ-19 repeats), buying just this row's batch would skip those
    // -- ask which the player actually wants rather than silently
    // under-buying.
    const priorSameUpgrade = ranked
      .slice(0, index)
      .filter((row) => row.name === entry.name && row.source === entry.source)

    if (priorSameUpgrade.length === 0) {
      applyBuy(entry, entry.levels)
      return
    }

    setPendingBuy({
      entry,
      priorLevels: priorSameUpgrade.reduce((sum, row) => sum + row.levels, 0),
      totalCost: priorSameUpgrade.reduce((sum, row) => sum + row.cost, 0) + entry.cost,
    })
  }

  const handleBuyAll = () => {
    applyBuy(pendingBuy.entry, pendingBuy.priorLevels + pendingBuy.entry.levels)
    setPendingBuy(null)
  }

  return (
    <div className="upgrade-path">
      {ranked.length === 0 ? (
        <p className="upgrade-path__empty">
          Every Workshop upgrade and Enhancement with known cost data is maxed out.
        </p>
      ) : (
        <ol className="upgrade-path__list" aria-label="Cheapest next upgrades">
          {ranked.map((entry, index) => (
            <li
              key={`${entry.source}-${entry.name}-${entry.currentLevel}`}
              className={`upgrade-path__row upgrade-path__row--${entry.categoryId}`}
            >
              <span className="upgrade-path__rank">{index + 1}</span>
              <span className="upgrade-path__name">
                {entry.name}
                {/* Workshop and Enhancement names overlap (e.g. "Damage"),
                    so an Enhancement row needs a visible tag to tell them
                    apart -- Workshop rows stay untagged since they're the
                    game-mirroring default. */}
                {entry.source === 'enhancement' && (
                  <span className="upgrade-path__source-tag">Enh</span>
                )}
              </span>
              <span className="upgrade-path__level">
                Lv {entry.currentLevel} → {entry.nextLevel}
              </span>
              <button
                type="button"
                className="upgrade-path__buy"
                aria-label={`Buy ${entry.levels} level${entry.levels === 1 ? '' : 's'} of ${entry.name}${entry.source === 'enhancement' ? ' (Enhancement)' : ''} for ${formatCoins(entry.cost)}`}
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
            item{unknownCost.length === 1 ? '' : 's'} (see OQ-1):
          </p>
          <ul className="upgrade-path__unknown-list" aria-label="Upgrades with unknown cost">
            {unknownCost.map((entry) => (
              <li key={`${entry.source}-${entry.name}`}>
                {entry.name}
                {entry.source === 'enhancement' ? ' (Enhancement)' : ''} (Lv {entry.currentLevel})
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
            aria-label={`Buy all ${pendingBuy.entry.name}${pendingBuy.entry.source === 'enhancement' ? ' (Enhancement)' : ''} upgrades to reach Lv ${pendingBuy.entry.nextLevel} for ${formatCoins(pendingBuy.totalCost)}?`}
            className="upgrade-path__confirm"
          >
            <p className="upgrade-path__confirm-body">
              Buy all {pendingBuy.entry.name}
              {pendingBuy.entry.source === 'enhancement' ? ' (Enhancement)' : ''} upgrades to
              reach Lv {pendingBuy.entry.nextLevel} ({formatCoins(pendingBuy.totalCost)})?
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

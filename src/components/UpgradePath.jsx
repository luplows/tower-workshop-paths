import { useState } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { getCheapestNextUpgrades } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import { unlockGroupKey } from '../utils/workshopUnlockGroups'
import './UpgradePath.css'

// Workshop and Enhancement names overlap (e.g. "Damage", "Health"), and an
// unlock group's name can collide with a plain Workshop upgrade name too
// (e.g. "Death Defy" is both -- see cheapestNextUpgrades.js). Rather than a
// separate badge, this matches the game's own convention for Enhancements
// ("{name} +") and adds an "Unlock: " prefix for a group purchase, which
// isn't itself an in-game label but reads unambiguously either way.
const displayName = (entry) => {
  if (entry.source === 'enhancement') return `${entry.name} +`
  if (entry.source === 'unlock') return `Unlock: ${entry.name}`
  return entry.name
}

export function UpgradePath() {
  const [workshopLevels, setWorkshopLevels] = useLocalStorageState('workshopLevels', {})
  const [enhancementLevels, setEnhancementLevels] = useLocalStorageState(
    'enhancementLevels',
    {},
  )
  const [enhancementLabLevel, setEnhancementLabLevel] = useLocalStorageState(
    'enhancementLabLevel',
    0,
  )
  const [unlockedGroups, setUnlockedGroups] = useLocalStorageState(
    'workshopUnlockedGroups',
    {},
  )
  const [pendingBuy, setPendingBuy] = useState(null)
  const { ranked, unknownCost } = getCheapestNextUpgrades({
    workshopLevels,
    enhancementLevels,
    enhancementLabLevel,
    unlockedGroups,
  })

  // Workshop and Enhancement names overlap (e.g. "Damage", "Health"), so a
  // buy must be routed by source, not just name, to the matching
  // localStorage-backed state. The Lab isn't per-name at all -- just one
  // flat 0-or-1 value gating every Enhancement (OQ-31). An unlock-group
  // purchase (OQ-5) similarly isn't a level -- it just flips that group's
  // entry in `unlockedGroups` on, keyed by category + group name since
  // group names aren't unique on their own (every tree has its own
  // "Default", and some collide with each other or an Enhancement category
  // -- see workshopUnlockGroups.js).
  const applyBuy = (entry, levelsToAdd) => {
    if (entry.source === 'lab') {
      setEnhancementLabLevel((previous) => previous + levelsToAdd)
      return
    }
    if (entry.source === 'unlock') {
      setUnlockedGroups((previous) => ({
        ...previous,
        [unlockGroupKey(entry.categoryId, entry.name)]: true,
      }))
      return
    }
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
              <span className="upgrade-path__name">{displayName(entry)}</span>
              <span className="upgrade-path__level">
                Lv {entry.currentLevel} → {entry.nextLevel}
              </span>
              <button
                type="button"
                className="upgrade-path__buy"
                aria-label={`Buy ${entry.levels} level${entry.levels === 1 ? '' : 's'} of ${displayName(entry)} for ${formatCoins(entry.cost)}`}
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
                {displayName(entry)} (Lv {entry.currentLevel})
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
            aria-label={`Buy all ${displayName(pendingBuy.entry)} upgrades to reach Lv ${pendingBuy.entry.nextLevel} for ${formatCoins(pendingBuy.totalCost)}?`}
            className="upgrade-path__confirm"
          >
            <p className="upgrade-path__confirm-body">
              Buy all {displayName(pendingBuy.entry)} upgrades to reach Lv{' '}
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

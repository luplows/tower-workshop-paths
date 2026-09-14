import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { getCheapestNextUpgrades } from '../utils/cheapestNextUpgrades'
import { formatCoins } from '../utils/formatCoins'
import './UpgradePath.css'

export function UpgradePath() {
  const [levels, setLevels] = useLocalStorageState('workshopLevels', {})
  const { ranked, unknownCost } = getCheapestNextUpgrades(levels)

  const handleBuy = (entry) => {
    setLevels((previous) => ({
      ...previous,
      [entry.name]: (previous[entry.name] ?? 0) + entry.levels,
    }))
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
              <span className="upgrade-path__cost">{formatCoins(entry.cost)}</span>
              <button
                type="button"
                className="upgrade-path__buy"
                aria-label={`Buy ${entry.levels} level${entry.levels === 1 ? '' : 's'} of ${entry.name}`}
                onClick={() => handleBuy(entry)}
              >
                Buy
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
    </div>
  )
}

import { clampLevel } from '../utils/clampLevel'

export function UpgradeLevelInput({ upgrade, level, onChange, formatValue }) {
  const inputId = `upgrade-level-${upgrade.name}`
  const hasMax = Number.isFinite(upgrade.quantity)

  return (
    <div className="upgrade-row">
      <label htmlFor={inputId} className="upgrade-row__label">
        {upgrade.name}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={0}
        max={hasMax ? upgrade.quantity : undefined}
        step={1}
        className="upgrade-row__input"
        value={level}
        onChange={(event) =>
          onChange(clampLevel(event.target.value, upgrade.quantity))
        }
      />
      {hasMax && <span className="upgrade-row__max">/ {upgrade.quantity}</span>}
      {formatValue && <span className="upgrade-row__value">{formatValue(level)}</span>}
    </div>
  )
}

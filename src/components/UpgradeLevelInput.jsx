import { clampLevel } from '../utils/clampLevel'

export function UpgradeLevelInput({ upgrade, level, onChange }) {
  const inputId = `upgrade-level-${upgrade.name}`

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
        max={upgrade.quantity}
        step={1}
        className="upgrade-row__input"
        value={level}
        onChange={(event) =>
          onChange(clampLevel(event.target.value, upgrade.quantity))
        }
      />
      <span className="upgrade-row__max">/ {upgrade.quantity}</span>
    </div>
  )
}

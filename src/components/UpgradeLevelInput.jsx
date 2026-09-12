const clampToNonNegativeInt = (rawValue) => {
  const parsed = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

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
        step={1}
        className="upgrade-row__input"
        value={level}
        onChange={(event) => onChange(clampToNonNegativeInt(event.target.value))}
      />
      <span className="upgrade-row__max">/ ~{upgrade.quantity}</span>
    </div>
  )
}

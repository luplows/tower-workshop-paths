import { useState } from 'react'
import { clampLevel } from '../utils/clampLevel'

export function UpgradeLevelInput({ upgrade, level, onChange, formatValue, nameSuffix = '' }) {
  const inputId = `upgrade-level-${upgrade.name}`
  const hasMax = Number.isFinite(upgrade.quantity)
  // The text shown while editing, as a string: React leaves a number input's text alone when its
  // number equals the new value, so a numeric `value` of 5 would leave `05` showing.
  const [draft, setDraft] = useState(null)

  return (
    <div className="upgrade-row">
      <label htmlFor={inputId} className="upgrade-row__label">
        {`${upgrade.name}${nameSuffix}`}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={0}
        max={hasMax ? upgrade.quantity : undefined}
        step={1}
        className="upgrade-row__input"
        value={draft ?? level}
        onChange={(event) => {
          const clamped = clampLevel(event.target.value, upgrade.quantity)
          setDraft(event.target.value === '' ? '' : String(clamped))
          onChange(clamped)
        }}
        onMouseDown={(event) => {
          // The browser places the caret after focus, which would undo the selection below.
          if (document.activeElement !== event.target) {
            event.preventDefault()
            event.target.focus()
          }
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => setDraft(null)}
        onWheel={(event) => event.target.blur()}
      />
      {hasMax && <span className="upgrade-row__max">/ {upgrade.quantity}</span>}
      {formatValue && <span className="upgrade-row__value">{formatValue(level)}</span>}
    </div>
  )
}

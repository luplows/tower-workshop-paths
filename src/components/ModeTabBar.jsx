export function ModeTabBar({
  modes,
  activeModeId,
  onSelect,
  label = 'Workshop mode',
  idPrefix = 'mode',
}) {
  return (
    <nav className="mode-tab-bar" role="tablist" aria-label={label}>
      {modes.map((mode) => {
        const isActive = mode.id === activeModeId
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${mode.id}`}
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${mode.id}`}
            className={`mode-tab-bar__tab${isActive ? ' mode-tab-bar__tab--active' : ''}`}
            onClick={() => onSelect(mode.id)}
          >
            {mode.label}
          </button>
        )
      })}
    </nav>
  )
}

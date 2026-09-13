export function ModeTabBar({ modes, activeModeId, onSelect }) {
  return (
    <nav className="mode-tab-bar" role="tablist" aria-label="Workshop mode">
      {modes.map((mode) => {
        const isActive = mode.id === activeModeId
        return (
          <button
            key={mode.id}
            type="button"
            role="tab"
            id={`mode-tab-${mode.id}`}
            aria-selected={isActive}
            aria-controls={`mode-panel-${mode.id}`}
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

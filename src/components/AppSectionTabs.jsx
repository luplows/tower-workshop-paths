/**
 * Top-level app navigation between "Input" (the Upgrade/Enhance screens,
 * which mirror the game's own UI) and "Path" (this tool's own recommended
 * buy-order feature, which has no in-game equivalent). Deliberately a
 * separate, compact control from ModeTabBar -- see Open-Questions.md's
 * OQ-17 -- so Path never reads as a third in-game mode alongside
 * Upgrade/Enhance.
 */
export function AppSectionTabs({ sections, activeSectionId, onSelect }) {
  return (
    <div className="app-section-tabs" role="tablist" aria-label="App section">
      {sections.map((section) => {
        const isActive = section.id === activeSectionId
        return (
          <button
            key={section.id}
            type="button"
            role="tab"
            id={`section-tab-${section.id}`}
            aria-selected={isActive}
            aria-controls={`section-panel-${section.id}`}
            className={`app-section-tabs__tab${isActive ? ' app-section-tabs__tab--active' : ''}`}
            onClick={() => onSelect(section.id)}
          >
            {section.label}
          </button>
        )
      })}
    </div>
  )
}

import { useState } from 'react'
import './App.css'
import { AppSectionTabs } from './components/AppSectionTabs'
import { EnhancementInputs } from './components/EnhancementInputs'
import { HeaderMenu } from './components/HeaderMenu'
import { ModeTabBar } from './components/ModeTabBar'
import { UpgradePath } from './components/UpgradePath'
import { WorkshopInputs } from './components/WorkshopInputs'
import { useLocalStorageState } from './hooks/useLocalStorageState'

const SECTIONS = [
  { id: 'input', label: 'Input' },
  { id: 'path', label: 'Path' },
]

const MODES = [
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'enhance', label: 'Enhance' },
]

function App() {
  const [sectionId, setSectionId] = useLocalStorageState('appSection', SECTIONS[0].id)
  const [modeId, setModeId] = useLocalStorageState('workshopMode', MODES[0].id)
  const [activeCategoryId, setActiveCategoryId] = useLocalStorageState(
    'activeCategoryId',
    'attack',
  )
  // Bumped to force WorkshopInputs/EnhancementInputs to remount and re-read
  // localStorage after a Clear (OQ-22) -- not persisted, just an in-memory
  // signal, since it only needs to matter for the lifetime of this page.
  const [resetNonce, setResetNonce] = useState(0)

  const handleClearAllLevels = () => {
    window.localStorage.removeItem('workshopLevels')
    window.localStorage.removeItem('enhancementLevels')
    window.localStorage.removeItem('enhancementLabLevel')
    window.localStorage.removeItem('workshopUnlockedGroups')
    setResetNonce((n) => n + 1)
  }

  return (
    <div className="app">
      {/* Header and (on the Input section) the mode tab bar stick together as
          one unit -- see App.css's .app__sticky-group -- rather than each
          being sticky independently with a manually-measured offset between
          them, which drifted by a fraction of a pixel and showed as a
          visible shift while scrolling (OQ-33 follow-up). */}
      <div className="app__sticky-group">
        <header className="app__header">
          <h1 className="app__title">Workshop Input</h1>
          <div className="app__header-actions">
            <AppSectionTabs
              sections={SECTIONS}
              activeSectionId={sectionId}
              onSelect={setSectionId}
            />
            <HeaderMenu onClearAllLevels={handleClearAllLevels} />
          </div>
        </header>
        {sectionId !== 'path' && (
          <ModeTabBar modes={MODES} activeModeId={modeId} onSelect={setModeId} />
        )}
      </div>

      {sectionId === 'path' ? (
        <div
          role="tabpanel"
          id="section-panel-path"
          aria-labelledby="section-tab-path"
          className="app__mode-panel"
        >
          <UpgradePath key={resetNonce} />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="section-panel-input"
          aria-labelledby="section-tab-input"
          className="app__mode-panel"
        >
          <div
            role="tabpanel"
            id={`mode-panel-${modeId}`}
            aria-labelledby={`mode-tab-${modeId}`}
            className="app__mode-panel"
          >
            {modeId === 'enhance' ? (
              <EnhancementInputs
                key={resetNonce}
                activeCategoryId={activeCategoryId}
                onCategoryChange={setActiveCategoryId}
              />
            ) : (
              <WorkshopInputs
                key={resetNonce}
                activeCategoryId={activeCategoryId}
                onCategoryChange={setActiveCategoryId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App

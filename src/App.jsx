import { useEffect, useState } from 'react'
import './App.css'
import { AppSectionTabs } from './components/AppSectionTabs'
import { BuyOutPlan } from './components/BuyOutPlan'
import { EnhancementInputs } from './components/EnhancementInputs'
import { HeaderMenu } from './components/HeaderMenu'
import { LabsInputs } from './components/LabsInputs'
import { ModeTabBar } from './components/ModeTabBar'
import { UpgradePath } from './components/UpgradePath'
import { WorkshopInputs } from './components/WorkshopInputs'
import { clearStoredValue, useLocalStorageState } from './hooks/useLocalStorageState'
import { STORAGE_KEYS } from './storageKeys'

// "Labs" sits alongside Input/Path rather than as a third ModeTabBar entry
// (below), for the same reason Path does: no in-game equivalent to mirror,
// so no natural home inside the toggle that deliberately mirrors only the
// game's own Upgrade/Enhance buttons.
const SECTIONS = [
  { id: 'input', label: 'Input' },
  { id: 'path', label: 'Path' },
  { id: 'labs', label: 'Labs' },
]

const PATH_VIEWS = [
  { id: 'order', label: 'Buy order' },
  { id: 'respec', label: 'Respec' },
]

const MODES = [
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'enhance', label: 'Enhance' },
]

function App() {
  const [sectionId, setSectionId] = useLocalStorageState(STORAGE_KEYS.appSection, SECTIONS[0].id)
  const [pathViewId, setPathViewId] = useLocalStorageState(STORAGE_KEYS.pathView, PATH_VIEWS[0].id)
  const [modeId, setModeId] = useLocalStorageState(STORAGE_KEYS.workshopMode, MODES[0].id)
  const [activeCategoryId, setActiveCategoryId] = useLocalStorageState(
    STORAGE_KEYS.activeCategoryId,
    'attack',
  )
  // 'auto' (the default) follows the OS's prefers-color-scheme, same as
  // before this setting existed; 'light'/'dark' force that theme regardless
  // of OS preference, via a data-theme attribute on <html> (index.css picks
  // it up) -- not on the React #root div, since CSS's :root selector always
  // means the document root element (<html>), never #root.
  const [themePreference, setThemePreference] = useLocalStorageState(
    STORAGE_KEYS.themePreference,
    'auto',
  )
  // Bumped to force WorkshopInputs/EnhancementInputs to remount and re-read
  // localStorage after a Clear (OQ-22) -- not persisted, just an in-memory
  // signal, since it only needs to matter for the lifetime of this page.
  const [resetNonce, setResetNonce] = useState(0)

  useEffect(() => {
    if (themePreference === 'auto') {
      delete document.documentElement.dataset.theme
    } else {
      document.documentElement.dataset.theme = themePreference
    }
  }, [themePreference])

  const handleClearAllLevels = () => {
    clearStoredValue(STORAGE_KEYS.workshopLevels)
    clearStoredValue(STORAGE_KEYS.enhancementLevels)
    clearStoredValue(STORAGE_KEYS.enhancementLabLevel)
    clearStoredValue(STORAGE_KEYS.workshopUnlockedGroups)
    clearStoredValue(STORAGE_KEYS.workshopDiscountLabs)
    clearStoredValue(STORAGE_KEYS.enhancementDiscountLabs)
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
            <HeaderMenu
              onClearAllLevels={handleClearAllLevels}
              themePreference={themePreference}
              onThemeChange={setThemePreference}
            />
          </div>
        </header>
        {sectionId === 'input' && (
          <ModeTabBar modes={MODES} activeModeId={modeId} onSelect={setModeId} />
        )}
        {sectionId === 'path' && (
          <ModeTabBar
            modes={PATH_VIEWS}
            activeModeId={pathViewId}
            onSelect={setPathViewId}
            label="Path view"
            idPrefix="path-view"
          />
        )}
      </div>

      {sectionId === 'path' && (
        <div
          role="tabpanel"
          id="section-panel-path"
          aria-labelledby="section-tab-path"
          className="app__mode-panel"
        >
          <div
            role="tabpanel"
            id={`path-view-panel-${pathViewId}`}
            aria-labelledby={`path-view-tab-${pathViewId}`}
            className="app__mode-panel"
          >
            {pathViewId === 'respec' ? (
              <BuyOutPlan key={`buy-out-${resetNonce}`} />
            ) : (
              <UpgradePath key={resetNonce} />
            )}
          </div>
        </div>
      )}

      {sectionId === 'labs' && (
        <div
          role="tabpanel"
          id="section-panel-labs"
          aria-labelledby="section-tab-labs"
          className="app__mode-panel"
        >
          <LabsInputs key={resetNonce} />
        </div>
      )}

      {sectionId === 'input' && (
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

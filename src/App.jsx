import './App.css'
import { AppSectionTabs } from './components/AppSectionTabs'
import { EnhancementInputs } from './components/EnhancementInputs'
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

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Workshop Input</h1>
        <AppSectionTabs
          sections={SECTIONS}
          activeSectionId={sectionId}
          onSelect={setSectionId}
        />
      </header>

      {sectionId === 'path' ? (
        <div
          role="tabpanel"
          id="section-panel-path"
          aria-labelledby="section-tab-path"
          className="app__mode-panel"
        >
          <UpgradePath />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="section-panel-input"
          aria-labelledby="section-tab-input"
          className="app__mode-panel"
        >
          <ModeTabBar modes={MODES} activeModeId={modeId} onSelect={setModeId} />
          <div
            role="tabpanel"
            id={`mode-panel-${modeId}`}
            aria-labelledby={`mode-tab-${modeId}`}
            className="app__mode-panel"
          >
            {modeId === 'enhance' ? (
              <EnhancementInputs
                activeCategoryId={activeCategoryId}
                onCategoryChange={setActiveCategoryId}
              />
            ) : (
              <WorkshopInputs
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

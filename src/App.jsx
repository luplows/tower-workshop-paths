import './App.css'
import { EnhancementInputs } from './components/EnhancementInputs'
import { ModeTabBar } from './components/ModeTabBar'
import { WorkshopInputs } from './components/WorkshopInputs'
import { useLocalStorageState } from './hooks/useLocalStorageState'

const MODES = [
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'enhance', label: 'Enhance' },
]

function App() {
  const [modeId, setModeId] = useLocalStorageState('workshopMode', MODES[0].id)
  const [activeCategoryId, setActiveCategoryId] = useLocalStorageState(
    'activeCategoryId',
    'attack',
  )

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Workshop Input</h1>
      </header>
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
  )
}

export default App

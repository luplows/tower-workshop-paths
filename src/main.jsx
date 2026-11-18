import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Empty and passive on purpose: iOS WebKit only applies :active on a tap when
// a touchstart listener is registered, and the pressed look depends on it.
document.addEventListener('touchstart', () => {}, { passive: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

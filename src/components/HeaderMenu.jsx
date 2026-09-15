import { useEffect, useRef, useState } from 'react'
import './HeaderMenu.css'

const THEME_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

/**
 * Header overflow menu for secondary, infrequent actions -- kept separate
 * from AppSectionTabs (Input/Path), which is primary navigation and stays
 * directly visible. Holds "Clear all levels" (OQ-22) and the Auto/Light/Dark
 * theme toggle; room for more later without crowding the header. Unlike
 * "Clear all levels", picking a theme doesn't close the menu -- switching
 * quickly between themes (e.g. while testing) shouldn't require reopening
 * the menu each time.
 */
export function HeaderMenu({ onClearAllLevels, themePreference, onThemeChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleClearClick = () => {
    setMenuOpen(false)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    setConfirmOpen(false)
    onClearAllLevels()
  }

  return (
    <div className="header-menu" ref={menuRef}>
      <button
        type="button"
        className="header-menu__toggle"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label="More actions"
        onClick={() => setMenuOpen((open) => !open)}
      >
        ⋯
      </button>

      {menuOpen && (
        <div className="header-menu__dropdown">
          <button type="button" className="header-menu__item" onClick={handleClearClick}>
            Clear all levels
          </button>
          <div className="header-menu__divider" />
          <div className="header-menu__section">
            <span className="header-menu__section-label">Theme</span>
            <div className="header-menu__theme-tabs" role="radiogroup" aria-label="Theme">
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={themePreference === option.id}
                  className={`header-menu__theme-tab${
                    themePreference === option.id ? ' header-menu__theme-tab--active' : ''
                  }`}
                  onClick={() => onThemeChange(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="header-menu__overlay">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-confirm-title"
            className="header-menu__confirm"
          >
            <p id="clear-confirm-title" className="header-menu__confirm-title">
              Clear all entered levels?
            </p>
            <p className="header-menu__confirm-body">
              This resets every Workshop upgrade and Enhancement level, and
              every Workshop discount Lab level, back to zero, and re-locks
              the Workshop Enhancements Lab and every Workshop upgrade-unlock
              group. This can't be undone.
            </p>
            <div className="header-menu__confirm-actions">
              <button type="button" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="header-menu__confirm-clear"
                onClick={handleConfirm}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

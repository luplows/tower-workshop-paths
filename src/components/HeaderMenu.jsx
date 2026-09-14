import { useEffect, useRef, useState } from 'react'
import './HeaderMenu.css'

/**
 * Header overflow menu for secondary, infrequent actions -- kept separate
 * from AppSectionTabs (Input/Path), which is primary navigation and stays
 * directly visible. Currently holds just "Clear all levels" (OQ-22); room
 * to add more here later without crowding the header.
 */
export function HeaderMenu({ onClearAllLevels }) {
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
              This resets every Workshop upgrade and Enhancement level back to
              zero, and re-locks the Workshop Enhancements Lab. This can't be
              undone.
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

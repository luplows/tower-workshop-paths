import { useEffect, useState } from 'react'

// The value a key holds in this session when its latest write to storage
// failed (OQ-57). Storage then has an older value, or none, so a reader that
// needs what the session holds, such as the share link, asks here first. A
// key is removed once a write for it succeeds, or when it is cleared.
const unsavedValues = new Map()

const readStoredValue = (key, initialValue) => {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? initialValue : JSON.parse(stored)
  } catch {
    return initialValue
  }
}

/**
 * The value this session last held for `key` but could not write to
 * storage, as `{ value }`, or undefined when storage has the latest value.
 */
export function unsavedValueFor(key) {
  return unsavedValues.has(key) ? { value: unsavedValues.get(key) } : undefined
}

/**
 * Removes `key` from storage, and forgets any unsaved value for it, so a
 * reader of the current value sees it as cleared.
 */
export function clearStoredValue(key) {
  unsavedValues.delete(key)
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Storage unavailable: nothing stored to remove.
  }
}

/**
 * Like useState, but persists the value to localStorage under `key` and
 * restores it on mount. Falls back to `initialValue` if storage is
 * unavailable or empty (e.g. private browsing, first visit).
 */
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      unsavedValues.delete(key)
    } catch {
      // Storage unavailable (e.g. private browsing quota) -- state still
      // works for this session, it just won't persist.
      unsavedValues.set(key, value)
    }
  }, [key, value])

  return [value, setValue]
}

import { useEffect, useState } from 'react'

const readStoredValue = (key, initialValue) => {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? initialValue : JSON.parse(stored)
  } catch {
    return initialValue
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
    } catch {
      // Storage unavailable (e.g. private browsing quota) -- state still
      // works for this session, it just won't persist.
    }
  }, [key, value])

  return [value, setValue]
}

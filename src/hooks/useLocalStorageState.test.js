import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearStoredValue, unsavedValueFor, useLocalStorageState } from './useLocalStorageState'

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('starts from the initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState('key', { a: 1 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('restores a previously stored value instead of the initial value', () => {
    window.localStorage.setItem('key', JSON.stringify({ a: 2 }))
    const { result } = renderHook(() => useLocalStorageState('key', { a: 1 }))
    expect(result.current[0]).toEqual({ a: 2 })
  })

  it('persists updates to localStorage', () => {
    const { result } = renderHook(() => useLocalStorageState('key', {}))

    act(() => {
      result.current[1]({ Damage: 5 })
    })

    expect(JSON.parse(window.localStorage.getItem('key'))).toEqual({ Damage: 5 })
  })

  describe('unsaved values (OQ-57)', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      clearStoredValue('key')
    })

    it('OQ-57/AC-1 records a value whose write fails, and forgets it once a write succeeds', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { result } = renderHook(() => useLocalStorageState('key', {}))
      act(() => {
        result.current[1]({ Damage: 42 })
      })
      expect(unsavedValueFor('key')).toEqual({ value: { Damage: 42 } })

      setItem.mockRestore()
      act(() => {
        result.current[1]({ Damage: 43 })
      })
      expect(unsavedValueFor('key')).toBeUndefined()
      expect(JSON.parse(window.localStorage.getItem('key'))).toEqual({ Damage: 43 })
    })

    it('OQ-57/AC-1 clearStoredValue removes the stored value and the unsaved one', () => {
      window.localStorage.setItem('key', JSON.stringify({ Damage: 1 }))
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      const { result, unmount } = renderHook(() => useLocalStorageState('key', {}))
      act(() => {
        result.current[1]({ Damage: 2 })
      })
      unmount()

      clearStoredValue('key')
      expect(unsavedValueFor('key')).toBeUndefined()
      expect(window.localStorage.getItem('key')).toBeNull()
    })
  })
})

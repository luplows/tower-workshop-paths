import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLocalStorageState } from './useLocalStorageState'

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
})

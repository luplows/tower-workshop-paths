import { describe, expect, it } from 'vitest'
import { clampLevel } from './clampLevel'

describe('clampLevel', () => {
  it('clamps negative values to 0', () => {
    expect(clampLevel('-5', 100)).toBe(0)
  })

  it('clamps non-numeric input to 0', () => {
    expect(clampLevel('abc', 100)).toBe(0)
  })

  it('leaves in-range values unchanged', () => {
    expect(clampLevel('42', 100)).toBe(42)
  })

  it('clamps values above the max down to the max', () => {
    expect(clampLevel('9999', 99)).toBe(99)
  })

  it('allows a value exactly at the max', () => {
    expect(clampLevel('99', 99)).toBe(99)
  })

  it('allows a value of exactly 0', () => {
    expect(clampLevel('0', 99)).toBe(0)
  })
})

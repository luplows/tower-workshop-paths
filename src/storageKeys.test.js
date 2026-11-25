import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { INTERFACE_SETTING_KEYS, STORAGE_KEYS, TOWER_DATA_KEYS } from './storageKeys'

const SRC = __dirname
const MODULE = join(SRC, 'storageKeys.js')

const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return !/\.test\./.test(entry) ? [path] : []
  })

describe('OQ-141 storageKeys', () => {
  it('OQ-141/AC-1 names the 8 tower-data keys and 5 interface settings, each under its own name', () => {
    expect(Object.keys(TOWER_DATA_KEYS).sort()).toEqual(
      [
        'buyOutLabCoinsSpent',
        'buyOutLifetimeCoins',
        'enhancementDiscountLabs',
        'enhancementLabLevel',
        'enhancementLevels',
        'workshopDiscountLabs',
        'workshopLevels',
        'workshopUnlockedGroups',
      ].sort(),
    )
    expect(Object.keys(INTERFACE_SETTING_KEYS).sort()).toEqual(
      ['activeCategoryId', 'appSection', 'pathView', 'themePreference', 'workshopMode'].sort(),
    )
    for (const [name, value] of Object.entries(STORAGE_KEYS)) expect(value).toBe(name)
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(13)
  })

  it('OQ-141/AC-1 finds no key name as a string literal in any non-test file under src/ but storageKeys.js', () => {
    // Quotes only: comments name the keys in backticks and are not checked.
    const literal = new RegExp(`(['"])(${Object.values(STORAGE_KEYS).join('|')})\\1`)
    const offenders = []
    for (const file of sourceFiles(SRC)) {
      if (file === MODULE) continue
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (literal.test(line)) offenders.push(`${relative(SRC, file).split(sep).join('/')}:${index + 1}: ${line.trim()}`)
        })
    }
    expect(offenders, `key literals outside storageKeys.js:\n${offenders.join('\n')}`).toEqual([])
  })

  it('OQ-141/AC-1 scan pattern matches a key passed through a helper or a prop, not a comment', () => {
    const literal = /(['"])(workshopDiscountLabs)\1/
    expect(literal.test("readStored('workshopDiscountLabs')")).toBe(true)
    expect(literal.test('storageKey="workshopDiscountLabs"')).toBe(true)
    expect(literal.test('readStored(STORAGE_KEYS.workshopDiscountLabs)')).toBe(false)
    expect(literal.test('// the `workshopDiscountLabs` Lab levels')).toBe(false)
  })
})

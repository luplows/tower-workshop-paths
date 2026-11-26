// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { decodeTower, encodeTower } from './shareCodec'
import { SHARE_ITEMS } from './shareItems'
import { buildShareUrl, MAX_URL_LENGTH, readStoredTower, SHARE_PARAM, ShareLinkError } from './shareLink'
import { TOWER_DATA_KEYS } from '../storageKeys'

const where = { origin: 'https://luplows.github.io', basePath: '/tower-workshop-paths/' }

const memoryStorage = (entries) => {
  const data = { ...entries }
  const writes = []
  return {
    data,
    writes,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => writes.push(['set', key, value]),
    removeItem: (key) => writes.push(['remove', key]),
  }
}

const seeded = () =>
  memoryStorage({
    workshopLevels: JSON.stringify({ Damage: 12, Health: 3 }),
    enhancementLevels: JSON.stringify({}),
    enhancementLabLevel: JSON.stringify(1),
    buyOutLifetimeCoins: JSON.stringify('1.5B'),
    themePreference: JSON.stringify('dark'),
  })

describe('share link', () => {
  it('OQ-57/AC-1 carries the encoded payload of every tower-data key, and nothing from interface settings', () => {
    const stored = readStoredTower(seeded())
    const url = new URL(buildShareUrl(stored, where))
    const decoded = decodeTower(url.searchParams.get(SHARE_PARAM))
    expect(decoded.tower.workshopLevels.Damage).toBe(12)
    expect(decoded.tower.workshopLevels.Health).toBe(3)
    expect(decoded.tower.enhancementLabLevel).toBe(1)
    expect(decoded.tower.buyOutLifetimeCoins).toBe('1.5B')
    expect(decoded.tower).not.toHaveProperty('themePreference')
  })

  it('OQ-57/AC-1 covers every tower-data key the share item table names', () => {
    const keys = new Set(SHARE_ITEMS.map((item) => item.key))
    expect([...keys].sort()).toEqual(Object.values(TOWER_DATA_KEYS).sort())
  })

  it('OQ-57/AC-2 is absolute and carries the deployed base path', () => {
    const url = buildShareUrl({}, where)
    expect(url.startsWith('https://luplows.github.io/tower-workshop-paths/?tower=')).toBe(true)
    expect(buildShareUrl({}, { origin: 'http://localhost:5173', basePath: '/' }).startsWith('http://localhost:5173/?tower=')).toBe(true)
  })

  it('OQ-57/AC-3 leaves stored state unchanged', () => {
    const storage = seeded()
    const before = JSON.stringify(storage.data)
    buildShareUrl(readStoredTower(storage), where)
    expect(JSON.stringify(storage.data)).toBe(before)
    expect(storage.writes).toEqual([])
  })

  it('OQ-57/AC-4 refuses, with a reason, a URL over the budget', () => {
    const tower = { buyOutLifetimeCoins: 'x'.repeat(3000) }
    expect(() => encodeTower(tower)).not.toThrow()
    let caught
    try {
      buildShareUrl(tower, where)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ShareLinkError)
    expect(caught.code).toBe('too-long')
    expect(caught.message).toContain(String(MAX_URL_LENGTH))
  })

  it('OQ-57/AC-4 refuses stored data the codec cannot carry', () => {
    expect(() => buildShareUrl({ workshopLevels: { Damage: 'many' } }, where)).toThrow(ShareLinkError)
  })
})

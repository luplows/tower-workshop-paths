import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  FORMAT_VERSION,
  SHARE_ITEMS,
  ShareCodecError,
  decodeTower,
  encodeTower,
} from './shareCodec'

const buildTower = (levelFor) => {
  const tower = {}
  for (const { key, items } of SHARE_ITEMS) {
    tower[key] = Object.fromEntries(items.map((item, i) => [item.name, levelFor(item, i)]))
  }
  return tower
}

const maxTower = () => buildTower((item) => item.max)
const zeroTower = () => buildTower(() => 0)
const fixedTower = () => buildTower((item, i) => (i * 7) % (item.max + 1))

const towerArbitrary = fc.tuple(
  ...SHARE_ITEMS.map(({ items }) => fc.tuple(...items.map((item) => fc.integer({ min: 0, max: item.max })))),
).map((perSection) => {
  const tower = {}
  SHARE_ITEMS.forEach(({ key, items }, s) => {
    tower[key] = Object.fromEntries(items.map((item, i) => [item.name, perSection[s][i]]))
  })
  return tower
})

const thrownCode = (fn) => {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(ShareCodecError)
    return error.code
  }
  throw new Error('expected a ShareCodecError')
}

describe('OQ-56 shareCodec', () => {
  it('OQ-56/AC-1 round-trips any valid tower and emits only URL-safe characters', () => {
    fc.assert(
      fc.property(towerArbitrary, (tower) => {
        const payload = encodeTower(tower)
        expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
        expect(encodeURIComponent(payload)).toBe(payload)
        expect(decodeTower(payload)).toEqual(tower)
        expect(encodeTower(tower)).toBe(payload)
      }),
      { numRuns: 300 },
    )
  })

  it('OQ-56/AC-1 round-trips the all-zero and all-max towers', () => {
    expect(decodeTower(encodeTower(zeroTower()))).toEqual(zeroTower())
    expect(decodeTower(encodeTower(maxTower()))).toEqual(maxTower())
  })

  it('OQ-56/AC-1 rejects a tower it cannot encode faithfully', () => {
    const over = maxTower()
    over.workshop.Damage += 1
    expect(() => encodeTower(over)).toThrow(RangeError)
    const fractional = zeroTower()
    fractional.enhancement.Damage = 1.5
    expect(() => encodeTower(fractional)).toThrow(RangeError)
  })

  it('OQ-56/AC-2 pins the version-1 encoding of a fixed tower', () => {
    expect(FORMAT_VERSION).toBe(1)
    expect(encodeTower(fixedTower())).toBe(
      'AQAAccKnCNUXD-NV7eI0nADuB-QgjF8mgImiYMgk2QOd3L7M2ukmhXvACaFKEpIAAOBwKg4jCoMQ4D8Rk0VC2YmkcOiXKA',
    )
  })

  it('OQ-56/AC-2 rejects an unknown version distinguishably', () => {
    const bytes = Buffer.from(encodeTower(fixedTower()), 'base64url')
    bytes[0] = 2
    expect(thrownCode(() => decodeTower(bytes.toString('base64url')))).toBe('unknown-version')
    expect(thrownCode(() => decodeTower('AA'))).toBe('unknown-version')
  })

  it('OQ-56/AC-3 keeps the complete share URL of an all-max tower within 2,000 characters', () => {
    const payload = encodeTower(maxTower())
    // Generous stand-in for origin + path + parameter name; no producer exists yet.
    const url = `https://luplows.github.io/tower-workshop-paths/?${'x'.repeat(64)}=${payload}`
    expect(url.length).toBeLessThanOrEqual(2000)
    expect(payload.length).toBeLessThanOrEqual(2000 - 150)
  })

  it('OQ-56/AC-4 rejects truncated payloads at every length', () => {
    const payload = encodeTower(fixedTower())
    for (let length = 0; length < payload.length; length++) {
      expect(() => decodeTower(payload.slice(0, length))).toThrow(ShareCodecError)
    }
    // Cutting mid-byte can leave non-zero trailing bits, which is 'malformed'.
    expect(['truncated', 'malformed']).toContain(thrownCode(() => decodeTower(payload.slice(0, -4))))
  })

  it('OQ-56/AC-4 rejects extended, corrupted and non-payload input', () => {
    const payload = encodeTower(fixedTower())
    expect(() => decodeTower(payload + 'A')).toThrow(ShareCodecError)
    for (const bad of ['', 'not a payload!', '%%%%', '💥', null, undefined, 42, {}]) {
      expect(() => decodeTower(bad)).toThrow(ShareCodecError)
    }
  })

  it('OQ-56/AC-4 rejects any single-character corruption of a valid payload', () => {
    fc.assert(
      fc.property(
        towerArbitrary,
        fc.nat(),
        fc.integer({ min: 1, max: 63 }),
        (tower, position, delta) => {
          const payload = encodeTower(tower)
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
          const at = position % payload.length
          const replacement = alphabet[(alphabet.indexOf(payload[at]) + delta) % 64]
          const corrupted = payload.slice(0, at) + replacement + payload.slice(at + 1)
          expect(() => decodeTower(corrupted)).toThrow(ShareCodecError)
        },
      ),
      { numRuns: 300 },
    )
  })

  it('OQ-56/AC-5 encodes zero levels explicitly and refuses an incomplete level set', () => {
    expect(decodeTower(encodeTower(zeroTower()))).toEqual(zeroTower())

    const missingWorkshop = zeroTower()
    delete missingWorkshop.workshop.Damage
    expect(() => encodeTower(missingWorkshop)).toThrow(TypeError)

    const missingEnhancement = zeroTower()
    delete missingEnhancement.enhancement.Health
    expect(() => encodeTower(missingEnhancement)).toThrow(TypeError)

    expect(() => encodeTower({ workshop: zeroTower().workshop })).toThrow(TypeError)
    expect(() => encodeTower({})).toThrow(TypeError)
  })

  it('OQ-56/AC-5 decodes to every known level, never fewer', () => {
    const decoded = decodeTower(encodeTower(fixedTower()))
    for (const { key, items } of SHARE_ITEMS) {
      expect(Object.keys(decoded[key])).toEqual(items.map((item) => item.name))
    }
  })
})

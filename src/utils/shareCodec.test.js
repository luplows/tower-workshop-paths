import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  DATA_REVISION,
  FORMAT_VERSION,
  ShareCodecError,
  crc16,
  decodeTower,
  encodeTower,
} from './shareCodec'
import { SHARE_ITEMS, VALUE_KINDS } from './shareItems'
import { TOWER_DATA_KEYS } from '../storageKeys'

const K = TOWER_DATA_KEYS
const ID_OF = (key, name = null) => SHARE_ITEMS.find((item) => item.key === key && item.name === name).id

// A tower in the shape decodeTower returns: every level present, groups only
// the ones set, Buy-out inputs '' when empty. `valueFor(item, index)` picks
// each item's value; a flag is set when it returns true.
const buildTower = (valueFor) => {
  const tower = {}
  SHARE_ITEMS.forEach((item, index) => {
    const value = valueFor(item, index)
    if (item.name === null) {
      tower[item.key] = value
      return
    }
    tower[item.key] ??= {}
    if (item.kind === VALUE_KINDS.flag) {
      if (value) tower[item.key][item.name] = true
    } else {
      tower[item.key][item.name] = value
    }
  })
  return tower
}

const emptyTower = () =>
  buildTower((item) => (item.kind === VALUE_KINDS.text ? '' : item.kind === VALUE_KINDS.flag ? false : 0))
const allMaxTower = () =>
  buildTower((item) =>
    item.kind === VALUE_KINDS.text ? '1,234,567,890,123,456,789' : item.kind === VALUE_KINDS.flag ? true : item.max,
  )
const mixedTower = () =>
  buildTower((item, index) => {
    if (item.kind === VALUE_KINDS.text) return index % 2 ? '1.18q' : ''
    if (item.kind === VALUE_KINDS.flag) return index % 3 === 0
    return (index * 7) % (item.max + 1)
  })
const fixedTower = () =>
  buildTower((item, index) => {
    if (item.kind === VALUE_KINDS.text) return item.id === ID_OF(K.buyOutLifetimeCoins) ? '1.18q' : '250T'
    if (item.kind === VALUE_KINDS.flag) return index % 2 === 0
    return (index * 7) % (item.max + 1)
  })

const roundTrip = (tower) => decodeTower(encodeTower(tower))

const towerArbitrary = fc
  .array(fc.nat({ max: 1_000_000 }), { minLength: SHARE_ITEMS.length, maxLength: SHARE_ITEMS.length })
  .map((numbers) =>
    buildTower((item, index) => {
      const n = numbers[index]
      if (item.kind === VALUE_KINDS.text) return n % 3 === 0 ? '' : `${n}é`
      if (item.kind === VALUE_KINDS.flag) return n % 2 === 0
      return n % 4 === 0 ? 0 : n % (item.max + 1)
    }),
  )

const thrownCode = (fn) => {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(ShareCodecError)
    return error.code
  }
  throw new Error('expected a ShareCodecError')
}

const varint = (value) => {
  const bytes = []
  let rest = value
  while (rest >= 128) {
    bytes.push((rest % 128) + 128)
    rest = Math.floor(rest / 128)
  }
  bytes.push(rest)
  return bytes
}
const record = (id, type, ...value) => [...varint(id * 4 + type), ...value]
const withChecksum = (bytes) => {
  const sum = crc16(bytes)
  return Buffer.from([...bytes, sum >> 8, sum & 255]).toString('base64url')
}
const payloadOf = (records, { version = FORMAT_VERSION, revision = DATA_REVISION } = {}) =>
  withChecksum([version, ...varint(revision), ...records.flat()])

describe('OQ-141 shareCodec', () => {
  it('OQ-141/AC-3 checks CRC-16/CCITT-FALSE against its published check value', () => {
    expect(crc16(new TextEncoder().encode('123456789'))).toBe(0x29b1)
  })

  it('OQ-141/AC-3 lays a payload out as [version][revision][records][CRC-16], unpadded base64url', () => {
    const payload = encodeTower({ [K.workshopLevels]: { Damage: 3 }, [K.buyOutLabCoinsSpent]: 'hi' })
    expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
    const bytes = [...Buffer.from(payload, 'base64url')]
    const body = [
      FORMAT_VERSION,
      DATA_REVISION,
      ...record(ID_OF(K.workshopLevels, 'Damage'), 0, 3),
      ...record(ID_OF(K.buyOutLabCoinsSpent), 2, 2, 0x68, 0x69),
    ]
    expect(bytes.slice(0, -2)).toEqual(body)
    expect(bytes.slice(-2)).toEqual([crc16(body) >> 8, crc16(body) & 255])
  })

  it('OQ-141/AC-3 leaves out items at zero, empty or absent, and decodes them as zero or empty', () => {
    expect(encodeTower({})).toBe(payloadOf([]))
    expect(encodeTower(emptyTower())).toBe(payloadOf([]))
    expect(
      encodeTower({ [K.workshopLevels]: { Damage: 0 }, [K.workshopUnlockedGroups]: { 'attack:Range Upgrades': false }, [K.buyOutLifetimeCoins]: '' }),
    ).toBe(payloadOf([]))
    const { tower } = decodeTower(payloadOf([record(ID_OF(K.workshopLevels, 'Damage'), 0, 5)]))
    expect(tower[K.workshopLevels].Damage).toBe(5)
    expect(tower[K.workshopLevels]['Attack Speed']).toBe(0)
    expect(tower[K.enhancementLabLevel]).toBe(0)
    expect(tower[K.workshopUnlockedGroups]).toEqual({})
    expect(tower[K.buyOutLifetimeCoins]).toBe('')
  })

  it('OQ-141/AC-6 round-trips an empty, an all-max and a mixed tower', () => {
    for (const tower of [emptyTower(), allMaxTower(), mixedTower()]) {
      const result = roundTrip(tower)
      expect(result.tower).toEqual(tower)
      expect(result).toMatchObject({ stale: false, unknownIds: [], clamped: [] })
    }
    const allMax = allMaxTower()
    expect(allMax[K.enhancementLabLevel]).toBe(1)
    expect(Object.keys(allMax[K.workshopUnlockedGroups])).toHaveLength(24)
    expect(allMax[K.buyOutLifetimeCoins]).not.toBe('')
  })

  it('OQ-141/AC-7 round-trips any tower, in every tower-data key, with URL-safe output', () => {
    fc.assert(
      fc.property(towerArbitrary, (tower) => {
        const payload = encodeTower(tower)
        expect(payload).toMatch(/^[A-Za-z0-9_-]+$/)
        expect(encodeURIComponent(payload)).toBe(payload)
        expect(decodeTower(payload).tower).toEqual(tower)
        expect(encodeTower(tower)).toBe(payload)
      }),
      { numRuns: 300 },
    )
    expect(Object.keys(mixedTower()).sort()).toEqual(Object.values(K).sort())
  })

  it('OQ-141/AC-7 refuses a tower it cannot encode faithfully', () => {
    expect(() => encodeTower({ [K.workshopLevels]: { Damage: 1e9 } })).toThrow(RangeError)
    expect(() => encodeTower({ [K.workshopLevels]: { Damage: 1.5 } })).toThrow(RangeError)
    expect(() => encodeTower({ [K.workshopDiscountLabs]: { attack: 100 } })).toThrow(RangeError)
    expect(() => encodeTower({ [K.enhancementLabLevel]: 2 })).toThrow(RangeError)
    expect(() => encodeTower({ [K.workshopLevels]: { 'No Such Upgrade': 1 } })).toThrow(TypeError)
    expect(() => encodeTower({ [K.workshopUnlockedGroups]: { 'attack:Range Upgrades': 1 } })).toThrow(TypeError)
    expect(() => encodeTower({ [K.buyOutLifetimeCoins]: 5 })).toThrow(TypeError)
    expect(() => encodeTower(null)).toThrow(TypeError)
  })

  it('OQ-141/AC-6 pins the version-1 encoding of a fixed tower', () => {
    expect(FORMAT_VERSION).toBe(1)
    expect(encodeTower(fixedTower())).toBe('AQEIBwwOEBUUHBgjHCogASQ4KD8sRjAFNBc4WzxiQGlEcEh3TH5QIVSMAVgvXElgUGQEaBNsAnAJdCB4MnwJgAENhAFIiAHnAYwB7gGQAV-UAWaYAW2cAXSgAUmkAVCoAVesAV60AbQCuAEKvAHCAsAByQLEAdACyAHXAswB3gLQAeUC1AHsAtgBRNwB-gLgAYED5AGIA-gBjwPsAZYD8AGiAfQBpAP4AX78AYUBgAKLAYQCwAOIAhyMAj6QAkWUAkyYAk-cAlagAl2tArUCvQLFAs0C1QLdAuUC7QL1Av0ChQOKAwUxLjE4cY4DBDI1MFTALA')
  })

  it('OQ-141/AC-6 keeps the complete share URL of an all-max tower within 2,000 characters, and reports its length', () => {
    const payload = encodeTower(allMaxTower())
    // Generous stand-in for origin + path + parameter name; no producer exists yet.
    const url = `https://luplows.github.io/tower-workshop-paths/?${'x'.repeat(64)}=${payload}`
    console.info(`OQ-141 all-max payload: ${payload.length} characters, URL stand-in ${url.length}`)
    expect(url.length).toBeLessThanOrEqual(2000)
    expect(payload.length).toBeLessThanOrEqual(2000 - 150)
  })

  it('OQ-141/AC-6 fails the checksum when any byte after the version byte changes, 0x00 and 0xFF swapped included', () => {
    for (const tower of [mixedTower(), allMaxTower(), emptyTower()]) {
      const bytes = Buffer.from(encodeTower(tower), 'base64url')
      for (let at = 1; at < bytes.length; at++) {
        const swapped = bytes[at] === 0x00 ? 0xff : bytes[at] === 0xff ? 0x00 : bytes[at] ^ 0xff
        for (const replacement of [swapped, (bytes[at] + 1) & 255, bytes[at] ^ 0x01]) {
          const changed = Buffer.from(bytes)
          changed[at] = replacement
          expect(thrownCode(() => decodeTower(changed.toString('base64url')))).toBe('corrupt')
        }
      }
    }
    // Directly: 0x00 -> 0xFF in a record's value, which OQ-56's checksum missed.
    const bytes = Buffer.from(payloadOf([record(ID_OF(K.workshopLevels, 'Damage'), 0, 0)]), 'base64url')
    expect(bytes[bytes.length - 3]).toBe(0x00)
    bytes[bytes.length - 3] = 0xff
    expect(thrownCode(() => decodeTower(bytes.toString('base64url')))).toBe('corrupt')
  })

  it('OQ-141/AC-5 reports an unknown version before it looks at the checksum', () => {
    const bytes = Buffer.from(encodeTower(mixedTower()), 'base64url')
    bytes[0] = 2
    expect(thrownCode(() => decodeTower(bytes.toString('base64url')))).toBe('unknown-version')
    expect(thrownCode(() => decodeTower('AA'))).toBe('unknown-version')
    expect(thrownCode(() => decodeTower(withChecksum([2, 1, 0xff])))).toBe('unknown-version')
  })

  it('OQ-141/AC-5 throws truncated, corrupt and malformed with their codes, never a partial tower', () => {
    const payload = encodeTower(mixedTower())
    expect(thrownCode(() => decodeTower('AQAA'))).toBe('truncated')
    for (let length = 0; length < payload.length; length++) {
      expect(() => decodeTower(payload.slice(0, length))).toThrow(ShareCodecError)
    }
    const extended = Buffer.concat([Buffer.from(payload, 'base64url'), Buffer.from([1])])
    expect(thrownCode(() => decodeTower(extended.toString('base64url')))).toBe('corrupt')
    for (const bad of ['', 'not a payload!', '%%%%', '💥', null, undefined, 42, {}]) {
      expect(thrownCode(() => decodeTower(bad))).toBe('malformed')
    }
  })

  it('OQ-141/AC-5 rejects any single-character corruption of a valid payload', () => {
    fc.assert(
      fc.property(towerArbitrary, fc.nat(), fc.integer({ min: 1, max: 63 }), (tower, position, delta) => {
        const payload = encodeTower(tower)
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
        const at = position % payload.length
        const replacement = alphabet[(alphabet.indexOf(payload[at]) + delta) % 64]
        expect(() => decodeTower(payload.slice(0, at) + replacement + payload.slice(at + 1))).toThrow(ShareCodecError)
      }),
      { numRuns: 300 },
    )
  })

  it('OQ-141/AC-5 decodes a payload from another data revision, flagged stale', () => {
    const records = [record(ID_OF(K.workshopLevels, 'Damage'), 0, 5)]
    for (const revision of [DATA_REVISION + 1, DATA_REVISION + 300, 0]) {
      const result = decodeTower(payloadOf(records, { revision }))
      expect(result.stale).toBe(true)
      expect(result.tower[K.workshopLevels].Damage).toBe(5)
    }
    expect(decodeTower(payloadOf(records)).stale).toBe(false)
  })

  it('OQ-141/AC-5 skips an ID it does not know and lists it', () => {
    const result = decodeTower(
      payloadOf([record(ID_OF(K.workshopLevels, 'Damage'), 0, 5), record(4000, 0, 7), record(4001, 1), record(4002, 2, 2, 0x68, 0x69)]),
    )
    expect(result.unknownIds).toEqual([4000, 4001, 4002])
    expect(result.tower[K.workshopLevels].Damage).toBe(5)
    expect(result.stale).toBe(false)
  })

  it('OQ-141/AC-5 clamps a level above the current max and lists it', () => {
    const damage = SHARE_ITEMS.find((item) => item.key === K.workshopLevels && item.name === 'Damage')
    const lab = SHARE_ITEMS.find((item) => item.key === K.enhancementLabLevel)
    const result = decodeTower(payloadOf([record(damage.id, 0, ...varint(damage.max + 40)), record(lab.id, 0, 9)]))
    expect(result.tower[K.workshopLevels].Damage).toBe(damage.max)
    expect(result.tower[K.enhancementLabLevel]).toBe(1)
    expect(result.clamped).toEqual([
      { id: damage.id, key: K.workshopLevels, name: 'Damage', value: damage.max + 40, max: damage.max },
      { id: lab.id, key: K.enhancementLabLevel, name: null, value: 9, max: 1 },
    ])
  })

  it('OQ-141/AC-6 skips a record of each type with an unknown ID, and rejects type 3 as malformed', () => {
    const known = record(ID_OF(K.workshopLevels, 'Damage'), 0, 5)
    for (const unknown of [record(9999, 0, 0x80, 0x01), record(9999, 1), record(9999, 2, 3, 0xe2, 0x82, 0xac), record(9999, 2, 0)]) {
      const result = decodeTower(payloadOf([unknown, known]))
      expect(result.unknownIds).toEqual([9999])
      expect(result.tower[K.workshopLevels].Damage).toBe(5)
    }
    // The skipped record's length is honoured, so what follows is still read.
    expect(decodeTower(payloadOf([record(9999, 2, 2, 0x01, 0x02), known])).tower[K.workshopLevels].Damage).toBe(5)
    expect(thrownCode(() => decodeTower(payloadOf([record(9999, 3)])))).toBe('malformed')
    expect(thrownCode(() => decodeTower(payloadOf([known, record(ID_OF(K.workshopLevels, 'Damage'), 3)])))).toBe('malformed')
  })

  it('OQ-141/AC-6 rejects a well-checksummed payload whose records are broken, as malformed', () => {
    const damage = ID_OF(K.workshopLevels, 'Damage')
    const cases = [
      [[...varint(damage * 4)]], // level record with no value
      [record(9999, 2, 5, 0x61)], // string longer than what is left
      [record(ID_OF(K.buyOutLabCoinsSpent), 2, 1, 0xff)], // not UTF-8
      [record(damage, 1)], // a known ID under the wrong type
      [record(damage, 0, 1), record(damage, 0, 2)], // the same ID twice
      [[0x80]], // a key cut off mid-varint
    ]
    for (const records of cases) expect(thrownCode(() => decodeTower(payloadOf(records)))).toBe('malformed')
    expect(thrownCode(() => decodeTower(withChecksum([FORMAT_VERSION, 0x80])))).toBe('malformed')
  })
})

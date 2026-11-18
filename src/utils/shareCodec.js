import { ITEM_BY_ID, SHARE_ITEMS, VALUE_KINDS } from './shareItems'
import { TOWER_DATA_KEYS } from '../storageKeys'

/**
 * Share payload codec (OQ-141, replacing OQ-56's): everything the tower
 * stores <-> a URL-safe string. Nothing produces or consumes a link yet; this
 * is the format, versioned and tested first because a link outlives the code.
 *
 * Layout, as bytes then unpadded base64url (so no percent-encoding):
 *   [format version][data revision, varint][records...][CRC-16, big-endian]
 * A record is a varint key, `id * 4 + type`, then a value the type sizes, so
 * a decoder can skip a record whose ID it does not know:
 *   0: a varint (a level)            1: nothing (a set member)
 *   2: a varint length, then that many bytes of UTF-8 (a string)
 * Type 3 is reserved: a record of that type is malformed.
 *
 * Items at zero, empty or absent are left out, and absent decodes as zero or
 * empty. Item IDs are permanent (shareItems.js), so a payload keeps decoding
 * after a patch changes the data; DATA_REVISION says when it might not mean
 * what it did.
 */
export const FORMAT_VERSION = 1

/**
 * Raise this whenever the item table's fingerprint changes -- a max, a name,
 * an added item (shareCodec.test.js fails until it is). A payload made under
 * another revision still decodes, flagged `stale`.
 */
export const DATA_REVISION = 1

/** Thrown by decodeTower. `code` tells callers why without parsing prose. */
export class ShareCodecError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ShareCodecError'
    this.code = code
  }
}

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const CHECKSUM_BYTES = 2
const MIN_PAYLOAD_BYTES = 1 + 1 + CHECKSUM_BYTES
const MAX_VARINT_BYTES = 7

const TYPE_VARINT = 0
const TYPE_FLAG = 1
const TYPE_BYTES = 2

const TYPE_OF_KIND = {
  [VALUE_KINDS.level]: TYPE_VARINT,
  [VALUE_KINDS.flag]: TYPE_FLAG,
  [VALUE_KINDS.text]: TYPE_BYTES,
}

// CRC-16/CCITT-FALSE: polynomial 0x1021, initial value 0xFFFF, no reflection,
// no final xor. Check value for "123456789" is 0x29B1.
export const crc16 = (bytes) => {
  let crc = 0xffff
  for (const byte of bytes) {
    crc ^= byte << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}

const pushVarint = (bytes, value) => {
  let rest = value
  while (rest >= 128) {
    bytes.push((rest % 128) + 128)
    rest = Math.floor(rest / 128)
  }
  bytes.push(rest)
}

// Returns [value, nextOffset], or null when the varint is cut off or longer
// than any value this format writes.
const readVarint = (bytes, start) => {
  let value = 0
  let scale = 1
  for (let i = 0; i < MAX_VARINT_BYTES; i++) {
    const byte = bytes[start + i]
    if (byte === undefined) return null
    value += (byte & 127) * scale
    if (byte < 128) return [value, start + i + 1]
    scale *= 128
  }
  return null
}

const toBase64Url = (bytes) => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    const chars = Math.min(bytes.length - i + 1, 4)
    for (let c = 0; c < chars; c++) out += BASE64URL[(chunk >> (18 - 6 * c)) & 63]
  }
  return out
}

const fromBase64Url = (text) => {
  if (text.length % 4 === 1) return null
  const bytes = []
  for (let i = 0; i < text.length; i += 4) {
    let chunk = 0
    const chars = Math.min(text.length - i, 4)
    for (let c = 0; c < 4; c++) {
      const index = c < chars ? BASE64URL.indexOf(text[i + c]) : 0
      if (index < 0) return null
      chunk = (chunk << 6) | index
    }
    const count = chars - 1
    for (let k = 0; k < count; k++) bytes.push((chunk >> (16 - 8 * k)) & 255)
    // Leftover bits in the final character must be zero, or two different
    // strings would decode to the same bytes.
    if (chars < 4 && (chunk & ((1 << (8 * (3 - count))) - 1)) !== 0) return null
  }
  return bytes
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// The stored value of one item, or undefined when the tower has none.
const storedValue = (tower, { key, name }) => (name === null ? tower[key] : tower[key]?.[name])

const label = ({ key, name }) => (name === null ? key : `${key}.${name}`)

/**
 * @param {Record<string, any>} tower any subset of the tower-data keys
 *   (storageKeys.js), each shaped as it is stored: levels `{ [name]: n }`,
 *   discount Labs `{ [treeId]: n }`, the Enhancements Lab level `n`, unlocked
 *   groups `{ [treeId:group]: true }`, Buy-out inputs strings. Absent, zero,
 *   false and empty all mean "not set" and are left out of the payload.
 * @returns {string} base64url payload.
 * @throws {TypeError|RangeError} when the input holds something it cannot
 *   carry faithfully: an unknown name, a level that is not an integer in
 *   0..max, a flag that is not a boolean, a text that is not a string.
 */
export function encodeTower(tower) {
  if (!isObject(tower)) throw new TypeError('encodeTower: tower must be an object')
  const known = new Set(SHARE_ITEMS.map((item) => `${item.key}\0${item.name}`))
  for (const key of Object.keys(TOWER_DATA_KEYS)) {
    const given = tower[key]
    if (given === undefined) continue
    const scalar = SHARE_ITEMS.find((item) => item.key === key).name === null
    if (scalar) continue
    if (!isObject(given)) throw new TypeError(`encodeTower: "${key}" must be an object`)
    for (const name of Object.keys(given)) {
      if (!known.has(`${key}\0${name}`)) throw new TypeError(`encodeTower: unknown ${key} item "${name}"`)
    }
  }

  const bytes = [FORMAT_VERSION]
  pushVarint(bytes, DATA_REVISION)
  for (const item of SHARE_ITEMS) {
    const value = storedValue(tower, item)
    if (value === undefined) continue
    const header = item.id * 4 + TYPE_OF_KIND[item.kind]
    if (item.kind === VALUE_KINDS.level) {
      if (!Number.isInteger(value) || value < 0 || value > item.max) {
        throw new RangeError(`encodeTower: ${label(item)} must be an integer 0..${item.max}, got ${value}`)
      }
      if (value === 0) continue
      pushVarint(bytes, header)
      pushVarint(bytes, value)
    } else if (item.kind === VALUE_KINDS.flag) {
      if (typeof value !== 'boolean') throw new TypeError(`encodeTower: ${label(item)} must be a boolean`)
      if (!value) continue
      pushVarint(bytes, header)
    } else {
      if (typeof value !== 'string') throw new TypeError(`encodeTower: ${label(item)} must be a string`)
      if (value === '') continue
      const text = new TextEncoder().encode(value)
      pushVarint(bytes, header)
      pushVarint(bytes, text.length)
      bytes.push(...text)
    }
  }
  const sum = crc16(bytes)
  bytes.push(sum >> 8, sum & 255)
  return toBase64Url(bytes)
}

const emptyTower = () => {
  const tower = {}
  for (const item of SHARE_ITEMS) {
    if (item.name === null) tower[item.key] = item.kind === VALUE_KINDS.text ? '' : 0
    else if (item.kind === VALUE_KINDS.level) (tower[item.key] ??= {})[item.name] = 0
    else tower[item.key] ??= {}
  }
  return tower
}

/**
 * @param {string} payload
 * @returns {{
 *   tower: Record<string, any>,
 *   stale: boolean,
 *   unknownIds: number[],
 *   clamped: {id: number, key: string, name: string|null, value: number, max: number}[],
 * }} `tower` has every tower-data key: each level item present (0 when the
 *   payload had none), unlocked groups only the members the payload names, a
 *   Buy-out input '' when absent. `stale` is true when the payload's data
 *   revision is not DATA_REVISION; `unknownIds` lists skipped records' IDs;
 *   `clamped` lists levels cut down to the item's current max.
 * @throws {ShareCodecError} code is one of 'malformed', 'unknown-version',
 *   'truncated', 'corrupt'; never returns a partial tower. Data changing
 *   never throws.
 */
export function decodeTower(payload) {
  if (typeof payload !== 'string' || payload.length === 0) {
    throw new ShareCodecError('malformed', 'payload is not a non-empty string')
  }
  const bytes = fromBase64Url(payload)
  if (bytes === null) throw new ShareCodecError('malformed', 'payload is not valid base64url')
  // Before the checksum: a future version may checksum differently.
  if (bytes[0] !== FORMAT_VERSION) {
    throw new ShareCodecError('unknown-version', `unsupported payload version ${bytes[0]}`)
  }
  if (bytes.length < MIN_PAYLOAD_BYTES) {
    throw new ShareCodecError('truncated', `payload is ${bytes.length} bytes, at least ${MIN_PAYLOAD_BYTES} needed`)
  }
  const end = bytes.length - CHECKSUM_BYTES
  const sum = crc16(bytes.slice(0, end))
  if (bytes[end] !== sum >> 8 || bytes[end + 1] !== (sum & 255)) {
    throw new ShareCodecError('corrupt', 'payload checksum mismatch')
  }

  const malformed = (message) => new ShareCodecError('malformed', message)
  const revision = readVarint(bytes, 1)
  if (revision === null || revision[1] > end) throw malformed('payload has no data revision')

  const tower = emptyTower()
  const unknownIds = []
  const clamped = []
  const seen = new Set()
  let offset = revision[1]
  while (offset < end) {
    const header = readVarint(bytes, offset)
    if (header === null || header[1] > end) throw malformed('record key is cut off')
    const id = Math.floor(header[0] / 4)
    const type = header[0] % 4
    offset = header[1]
    if (type === 3) throw malformed(`record ${id} has the reserved type 3`)

    let value = null
    let text = null
    if (type === TYPE_VARINT) {
      const read = readVarint(bytes, offset)
      if (read === null || read[1] > end) throw malformed(`record ${id} has no value`)
      ;[value, offset] = read
    } else if (type === TYPE_BYTES) {
      const length = readVarint(bytes, offset)
      if (length === null || length[1] + length[0] > end) throw malformed(`record ${id} is cut off`)
      const start = length[1]
      offset = start + length[0]
      try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes.slice(start, offset)))
      } catch {
        throw malformed(`record ${id} is not valid UTF-8`)
      }
    }

    const item = ITEM_BY_ID.get(id)
    if (item === undefined || (item.kind === VALUE_KINDS.level && item.max === undefined)) {
      unknownIds.push(id)
      continue
    }
    if (TYPE_OF_KIND[item.kind] !== type) throw malformed(`record ${id} has type ${type}, not ${TYPE_OF_KIND[item.kind]}`)
    if (seen.has(id)) throw malformed(`record ${id} appears twice`)
    seen.add(id)

    let stored = value ?? text ?? true
    if (item.kind === VALUE_KINDS.level && value > item.max) {
      clamped.push({ id, key: item.key, name: item.name, value, max: item.max })
      stored = item.max
    }
    if (item.name === null) tower[item.key] = stored
    else tower[item.key][item.name] = stored
  }

  return { tower, stale: revision[0] !== DATA_REVISION, unknownIds, clamped }
}

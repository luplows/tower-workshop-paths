import { WORKSHOP_CATEGORIES } from '../data/workshopCategories'
import { ENHANCEMENT_CATEGORIES } from '../data/enhancementCategories'

/**
 * Share payload codec (OQ-56): a complete Workshop + Enhancement level set
 * <-> a URL-safe string. Nothing produces or consumes a link yet; this is
 * the format, versioned and tested first because a link outlives the code.
 *
 * Layout, as bytes then base64url (no padding, so no percent-encoding):
 *   [version][level bits, packed MSB-first][checksum, 2 bytes, big-endian]
 * Each level takes the fewest bits that hold 0..quantity, in a fixed order:
 * every Workshop upgrade (category order), then every Enhancement. The
 * payload is always the complete set, zeros included -- there is no "absent"
 * for the decoder to interpret (AC-5) -- so the item order IS the schema.
 *
 * Changing the item set (or its order or any quantity) changes the encoding
 * of the same tower: that needs a new FORMAT_VERSION, and the pinned literal
 * in shareCodec.test.js fails until it is dealt with deliberately.
 */
export const FORMAT_VERSION = 1

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

const itemsOf = (categories) =>
  categories.flatMap((category) =>
    category.upgrades.map(({ name, quantity }) => ({ name, max: quantity })),
  )

const bitsFor = (max) => Math.ceil(Math.log2(max + 1))

const SECTIONS = [
  { key: 'workshop', items: itemsOf(WORKSHOP_CATEGORIES) },
  { key: 'enhancement', items: itemsOf(ENHANCEMENT_CATEGORIES) },
]
const SLOTS = SECTIONS.flatMap(({ key, items }) =>
  items.map((item) => ({ section: key, ...item, bits: bitsFor(item.max) })),
)
const TOTAL_BITS = SLOTS.reduce((sum, slot) => sum + slot.bits, 0)
const LEVEL_BYTES = Math.ceil(TOTAL_BITS / 8)
const PAYLOAD_BYTES = 1 + LEVEL_BYTES + CHECKSUM_BYTES

// 16-bit Fletcher-style checksum over [version + level bytes].
const checksum = (bytes) => {
  let a = 0
  let b = 0
  for (const byte of bytes) {
    a = (a + byte + 1) % 255
    b = (b + a) % 255
  }
  return (b << 8) | a
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

const isLevel = (value, max) => Number.isInteger(value) && value >= 0 && value <= max

/**
 * @param {{workshop: Record<string, number>, enhancement: Record<string, number>}} levels
 *   every known Workshop and Enhancement name, each an integer in 0..max.
 * @returns {string} base64url payload.
 * @throws {TypeError|RangeError} when the input is not a complete valid set.
 */
export function encodeTower(levels) {
  const bytes = new Array(1 + LEVEL_BYTES).fill(0)
  bytes[0] = FORMAT_VERSION
  let bitPosition = 0
  for (const section of SECTIONS) {
    const given = levels?.[section.key]
    if (given === null || typeof given !== 'object') {
      throw new TypeError(`encodeTower: missing "${section.key}" levels`)
    }
    const known = new Set(section.items.map((item) => item.name))
    for (const name of Object.keys(given)) {
      if (!known.has(name)) throw new TypeError(`encodeTower: unknown ${section.key} item "${name}"`)
    }
  }
  for (const slot of SLOTS) {
    const value = levels[slot.section][slot.name]
    if (value === undefined) {
      throw new TypeError(`encodeTower: missing ${slot.section} level for "${slot.name}"`)
    }
    if (!isLevel(value, slot.max)) {
      throw new RangeError(
        `encodeTower: ${slot.section} "${slot.name}" must be an integer 0..${slot.max}, got ${value}`,
      )
    }
    for (let bit = slot.bits - 1; bit >= 0; bit--) {
      if ((value >> bit) & 1) bytes[1 + (bitPosition >> 3)] |= 0x80 >> (bitPosition & 7)
      bitPosition++
    }
  }
  const sum = checksum(bytes)
  bytes.push(sum >> 8, sum & 255)
  return toBase64Url(bytes)
}

/**
 * @param {string} payload
 * @returns {{workshop: Record<string, number>, enhancement: Record<string, number>}}
 * @throws {ShareCodecError} code is one of 'malformed', 'unknown-version',
 *   'truncated', 'corrupt'; never returns a partial tower.
 */
export function decodeTower(payload) {
  if (typeof payload !== 'string' || payload.length === 0) {
    throw new ShareCodecError('malformed', 'payload is not a non-empty string')
  }
  const bytes = fromBase64Url(payload)
  if (bytes === null) throw new ShareCodecError('malformed', 'payload is not valid base64url')
  if (bytes[0] !== FORMAT_VERSION) {
    throw new ShareCodecError('unknown-version', `unsupported payload version ${bytes[0]}`)
  }
  if (bytes.length !== PAYLOAD_BYTES) {
    throw new ShareCodecError(
      bytes.length < PAYLOAD_BYTES ? 'truncated' : 'corrupt',
      `payload is ${bytes.length} bytes, expected ${PAYLOAD_BYTES}`,
    )
  }
  const body = bytes.slice(0, 1 + LEVEL_BYTES)
  const sum = checksum(body)
  if (bytes[bytes.length - 2] !== sum >> 8 || bytes[bytes.length - 1] !== (sum & 255)) {
    throw new ShareCodecError('corrupt', 'payload checksum mismatch')
  }
  const result = { workshop: {}, enhancement: {} }
  let bitPosition = 0
  for (const slot of SLOTS) {
    let value = 0
    for (let bit = 0; bit < slot.bits; bit++) {
      value = (value << 1) | ((body[1 + (bitPosition >> 3)] >> (7 - (bitPosition & 7))) & 1)
      bitPosition++
    }
    if (value > slot.max) {
      throw new ShareCodecError('corrupt', `${slot.section} "${slot.name}" level ${value} exceeds ${slot.max}`)
    }
    result[slot.section][slot.name] = value
  }
  // Padding bits after the last level must be zero (one encoding per tower).
  for (; bitPosition < LEVEL_BYTES * 8; bitPosition++) {
    if ((body[1 + (bitPosition >> 3)] >> (7 - (bitPosition & 7))) & 1) {
      throw new ShareCodecError('corrupt', 'non-zero padding bits')
    }
  }
  return result
}

/** The known item set, for callers and tests that need to build a full tower. */
export const SHARE_ITEMS = SECTIONS

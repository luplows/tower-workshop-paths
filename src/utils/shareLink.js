import { encodeTower } from './shareCodec'
import { TOWER_DATA_KEYS } from '../storageKeys'
import { unsavedValueFor } from '../hooks/useLocalStorageState'

/**
 * Share link producer (OQ-57): the current tower -> an absolute URL carrying
 * its encodeTower payload. Reads the current tower, never writes it.
 */

/** The query parameter the payload travels in; OQ-58's viewer reads it back. */
export const SHARE_PARAM = 'tower'

/** The URL budget OQ-56/AC-3 set and OQ-141/AC-6 keeps. */
export const MAX_URL_LENGTH = 2000

/** Thrown by buildShareUrl. `code` is 'too-long' or 'unreadable'. */
export class ShareLinkError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ShareLinkError'
    this.code = code
  }
}

/**
 * Every tower-data key as this session holds it. A value whose write to
 * storage failed is taken from useLocalStorageState's unsaved values, so the
 * link carries what is on screen rather than the older stored value. Any
 * other key is read from storage, `window.localStorage` unless `storage` is
 * given. A key that is absent, unreadable or not JSON is left out, as
 * useLocalStorageState's own read treats it as not set. Reaching
 * `window.localStorage` can itself throw (storage blocked by browser policy),
 * so it is read inside the same guard, and the unsaved values still reach the
 * link.
 */
export function readCurrentTower(storage, unsaved = unsavedValueFor) {
  const tower = {}
  for (const key of Object.values(TOWER_DATA_KEYS)) {
    const held = unsaved(key)
    if (held !== undefined) {
      tower[key] = held.value
      continue
    }
    try {
      const stored = (storage ?? window.localStorage).getItem(key)
      if (stored !== null) tower[key] = JSON.parse(stored)
    } catch {
      // Unavailable or not JSON: treated as not set, as the app's own reads do.
    }
  }
  return tower
}

/**
 * @param {Record<string, any>} tower as stored (see encodeTower)
 * @param {{origin: string, basePath: string}} where the deployed page lives;
 *   basePath is Vite's BASE_URL, e.g. '/tower-workshop-paths/'
 * @returns {string} an absolute URL, at most MAX_URL_LENGTH characters
 * @throws {ShareLinkError} 'unreadable' when the tower holds something the
 *   codec cannot carry, 'too-long' when the URL would pass the budget.
 */
export function buildShareUrl(tower, { origin, basePath }) {
  let payload
  try {
    payload = encodeTower(tower)
  } catch (error) {
    throw new ShareLinkError('unreadable', `Your saved levels could not be encoded (${error.message}).`)
  }
  const url = `${new URL(basePath, origin).href}?${SHARE_PARAM}=${payload}`
  if (url.length > MAX_URL_LENGTH) {
    throw new ShareLinkError(
      'too-long',
      `The share link would be ${url.length} characters, over the ${MAX_URL_LENGTH} that chat apps and browsers reliably accept, so none was made.`,
    )
  }
  return url
}

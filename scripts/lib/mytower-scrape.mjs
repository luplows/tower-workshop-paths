// Shared mytower.app cost-table scraping technique, factored out of
// extract-workshop-data.mjs (OQ-39 Phase 1) so extract-enhancement-data.mjs
// (Phase 2) can reuse it exactly rather than duplicating it. See either
// script's own docstring for the fuller rationale/context.
import { parseAbbreviated } from '../verify-workshop-costs.mjs'

const SCROLL_SETTLE_MS = 150
// Leaves a safety margin below the grid's own ~17 visible rows, so
// adjacent scroll snapshots always overlap by a few rows -- guards
// against off-by-one gaps from rounding `scrollTop`.
const VIEWPORT_OVERLAP_ROWS = 3

export async function dismissConsent(page) {
  const agree = page.getByRole('button', { name: 'Agree and continue' })
  if (await agree.isVisible().catch(() => false)) {
    await agree.click()
  }
}

export async function readMaxLevelOnPage(page) {
  const bodyText = await page.locator('body').innerText()
  const match = bodyText.match(/\nM ([\d,]+)\n/)
  return match ? Number.parseInt(match[1].replace(/,/g, ''), 10) : null
}

/**
 * Reads every currently-rendered row's level + per-level coin cost from
 * the virtualized grid in one DOM call. mytower's "Level N" row shows the
 * cost of buying from N-1 to N -- our own index N-1 (see
 * verify-workshop-costs.mjs's own docstring for the fuller explanation).
 */
async function readVisibleRows(grid) {
  return grid.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('td.sticky.sticky-1'))
    return rows.map((levelCell) => {
      const row = levelCell.closest('tr')
      const coinsCell = row?.querySelector('td.cost-step.currency-coins')
      return { level: levelCell.textContent?.trim(), coins: coinsCell?.textContent?.trim() }
    })
  })
}

/**
 * Navigates to a mytower.app cost-table page and extracts its real max
 * level plus its full per-level cost curve (index 0..maxLevel-1, our own
 * convention -- see readVisibleRows above). Efficient by design: reads
 * ~14 rows per scroll snapshot (the grid's own virtualized viewport) via
 * one page.evaluate() call, rather than one round-trip per individual
 * level.
 *
 * Returns `{ error }` if the page's max level couldn't be read at all, or
 * `{ maxLevel, costs, missing? }` otherwise -- `missing` (mytower-level
 * numbers, 1-indexed) is only present if some level's row was never
 * captured across every scroll snapshot, which would mean the viewport
 * math above needs revisiting, not that the data doesn't exist.
 */
export async function extractFullCostCurve(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await dismissConsent(page)

  const maxLevel = await readMaxLevelOnPage(page)
  if (maxLevel === null || maxLevel <= 0) {
    return { error: 'could not read max level (M) on page' }
  }

  const grid = page.locator('div.data-grid')
  const { scrollHeight, clientHeight } = await grid.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  const rowHeight = scrollHeight / (maxLevel + 1)
  const viewportRows = Math.max(1, Math.floor(clientHeight / rowHeight))
  const stepRows = Math.max(1, viewportRows - VIEWPORT_OVERLAP_ROWS)

  // costsByLevel is keyed by mytower's own 1-indexed "Level" number
  // throughout, remapped to our 0-indexed array only at the very end.
  const costsByLevel = new Map()
  const neededLevels = maxLevel // Level 1..maxLevel

  for (let scrollLevel = 0; scrollLevel <= maxLevel; scrollLevel += stepRows) {
    await grid.evaluate(
      (el, { level, rh }) => {
        el.scrollTop = level * rh
      },
      { level: scrollLevel, rh: rowHeight },
    )
    await page.waitForTimeout(SCROLL_SETTLE_MS)

    const rows = await readVisibleRows(grid)
    for (const { level, coins } of rows) {
      const lvl = Number.parseInt((level ?? '').replace(/,/g, ''), 10)
      if (Number.isNaN(lvl) || lvl < 1 || lvl > maxLevel) continue
      if (!costsByLevel.has(lvl)) costsByLevel.set(lvl, coins)
    }

    if (costsByLevel.size >= neededLevels) break
  }

  const missing = []
  const costs = []
  for (let ourIndex = 0; ourIndex < maxLevel; ourIndex++) {
    const mytowerLevel = ourIndex + 1
    const raw = costsByLevel.get(mytowerLevel)
    const parsed = raw === undefined ? null : parseAbbreviated(raw)
    if (parsed === null) missing.push(mytowerLevel)
    costs.push(parsed)
  }

  return { maxLevel, costs, missing: missing.length > 0 ? missing : undefined }
}

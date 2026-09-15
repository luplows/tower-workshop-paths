#!/usr/bin/env node
/**
 * Cross-checks this project's Workshop upgrade cost data (WORKSHOP_LEVELS,
 * from tower-idle-toolkit) against mytower.app's independently-hosted
 * per-level cost tables -- see Open-Questions.md's OQ-1 and
 * OQ-1-Checklist.md, which this script is built to help work through.
 *
 * For every upgrade in workshopCategories.js, checks the exact 3 spot-check
 * levels the checklist already defines (Lv1, a mid-range level, and the
 * highest level covered by our own data) by computing our own
 * formatCoins(WORKSHOP_LEVELS[name][level].coins) and comparing it against
 * the same level's displayed cost on mytower.app. Also probes the 4 known
 * GAP upgrades (Health, Health Regen, Recovery Amount, Max Recovery) at
 * their corrected, higher max level, to check whether mytower.app has real
 * cost data where tower-idle-toolkit's own table runs out (a `coins: 0`
 * sentinel past the old ceiling -- see cheapestNextUpgrades.js).
 *
 * Both mytower.app's displayed values and the real in-game display are
 * rounded/truncated to ~3 significant digits with a suffix (never raw
 * decimals) -- the same precision OQ-1-Checklist.md's own manual-check
 * methodology already works at, so comparisons here use a small relative
 * tolerance to absorb truncate-vs-round differences between the two sites'
 * formatting, rather than requiring byte-identical strings.
 *
 * mytower.app is a small fan-run site, not an API meant for bulk automated
 * traffic -- this script deliberately uses a single browser context, one
 * navigation per upgrade (not per level), and a short delay between
 * upgrades.
 *
 * Usage (the --import preload lets plain Node resolve this project's own
 * extensionless relative imports, e.g. `./workshopQuantityOverrides`, the
 * same way Vite already does -- see scripts/lib/resolve-extensionless.mjs):
 *   npm run verify:workshop-costs                      # every upgrade
 *   npm run verify:workshop-costs -- Damage "Rend Armor Chance"  # a subset, by name
 */
import { chromium } from 'playwright'
import { WORKSHOP_LEVELS } from 'tower-idle-toolkit'
import { fileURLToPath } from 'node:url'
import { WORKSHOP_CATEGORIES } from '../src/data/workshopCategories.js'
import { formatCoins } from '../src/utils/formatCoins.js'

const BASE_URL = 'https://mytower.app'
const NAV_DELAY_MS = 350

// The 4 upgrades whose corrected quantity (OQ-13) runs past
// tower-idle-toolkit's own cost-table ceiling -- WORKSHOP_LEVELS has no
// real cost data beyond `oldCeiling` for these (a `coins: 0` sentinel
// sits at that index instead). The checklist's own Lv1/mid/max spot-check
// levels for these 4 are chosen from the *old* ceiling, not the corrected
// quantity -- matched here so this script checks the same levels the
// checklist already documents.
const GAP_CEILINGS = {
  Health: 5000,
  'Health Regen': 5000,
  'Recovery Amount': 60,
  'Max Recovery': 50,
}

const filterNames = process.argv.slice(2)

const upgrades = WORKSHOP_CATEGORIES.flatMap((category) =>
  category.upgrades.map((upgrade) => ({
    tree: category.id,
    name: upgrade.name,
    quantity: upgrade.quantity,
  })),
).filter((u) => filterNames.length === 0 || filterNames.includes(u.name))

// Lv1, the midpoint, and the last level covered by our own cost data --
// exactly OQ-1-Checklist.md's own formula (confirmed against its existing
// entries): indices [1, floor((ceiling-1)/2), ceiling-1].
export const checklistLevels = (ceiling) => {
  const maxIndex = ceiling - 1
  const midIndex = Math.floor((ceiling - 1) / 2)
  return [...new Set([1, midIndex, maxIndex])].sort((a, b) => a - b)
}

// 'K' (thousand) is included alongside 'k' since mytower.app displays it
// capitalized where formatCoins.js uses lowercase -- confirmed a pure site
// style difference, not a data discrepancy (e.g. "1.02K"). Every other
// tier is genuinely case-sensitive in our own scheme (q/Q, s/S
// deliberately disambiguate quadrillion/quintillion, sextillion/
// septillion -- see formatCoins.js), so only 'k' gets this treatment.
const SUFFIX_SCALE = { '': 1, k: 1e3, K: 1e3, M: 1e6, B: 1e9, T: 1e12, q: 1e15, Q: 1e18, s: 1e21, S: 1e24, O: 1e27 }

// Parses either site's abbreviated display ("276.51M", "23.61k", "55") back
// to an approximate number, purely to compare the two at a shared scale --
// never used as a source of truth, only for the MATCH/NEAR tolerance check.
export const parseAbbreviated = (str) => {
  const match = str.trim().match(/^(-?[\d,]+\.?\d*)([kKMBTqQsSO]?)$/)
  if (!match) return null
  const scale = SUFFIX_SCALE[match[2]]
  if (scale === undefined) return null
  return Number.parseFloat(match[1].replace(/,/g, '')) * scale
}

// A 2-decimal display's worst-case truncate-vs-round difference is 0.01 at
// a mantissa as low as 1.00 (formatCoins never shows a mantissa below that
// -- a value under 1000 gets no suffix at all) -- a 1% relative difference.
// 1.5% leaves a safety margin above that ceiling for real display-rounding
// noise without masking an actual data discrepancy: the smallest genuine
// mismatch found while building this script (Wall Health) was already a
// 2.4%+ difference at its least severe level, well clear of this cutoff.
const ROUNDING_TOLERANCE = 0.015

export const classify = (ours, theirs) => {
  if (ours === theirs) return 'MATCH'
  const oursNum = parseAbbreviated(ours)
  const theirsNum = parseAbbreviated(theirs)
  if (oursNum === null || theirsNum === null) return 'MISMATCH'
  const relDiff = Math.abs(oursNum - theirsNum) / Math.max(Math.abs(oursNum), Math.abs(theirsNum), 1)
  return relDiff < ROUNDING_TOLERANCE ? 'NEAR (rounding)' : 'MISMATCH'
}

async function dismissConsent(page) {
  const agree = page.getByRole('button', { name: 'Agree and continue' })
  if (await agree.isVisible().catch(() => false)) {
    await agree.click()
  }
}

// mytower's "Level N" row shows the cost of buying from N-1 to N -- the
// same value as our own WORKSHOP_LEVELS[name][N-1].coins. So checking our
// index L means reading mytower's row "Level L+1". The grid is virtualized
// (only ~17 rows ever exist in the DOM), reachable by setting `scrollTop`
// proportionally -- confirmed exact against a known value (Damage, index
// 2999) before this script was written.
async function readMytowerCost(page, mytowerLevel, maxLevelOnPage) {
  const grid = page.locator('div.data-grid')
  await grid.evaluate(
    (el, { level, max }) => {
      el.scrollTop = level * (el.scrollHeight / (max + 1))
    },
    { level: mytowerLevel, max: maxLevelOnPage },
  )
  await page.waitForTimeout(200)
  // The level cell is a leaf <td> (no child elements), so an exact-text
  // regex against it is unambiguous -- unlike matching a whole <tr>, whose
  // concatenated cell text has no separators between cells to anchor on.
  const levelCell = grid.locator('td.sticky.sticky-1', { hasText: new RegExp(`^${mytowerLevel}$`) }).first()
  const row = levelCell.locator('xpath=..')
  const cost = await row.locator('td.cost-step.currency-coins').first().innerText().catch(() => null)
  return cost
}

async function readMaxLevelOnPage(page) {
  const bodyText = await page.locator('body').innerText()
  const match = bodyText.match(/\nM ([\d,]+)\n/)
  return match ? Number.parseInt(match[1].replace(/,/g, ''), 10) : null
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  const results = []

  for (const upgrade of upgrades) {
    const url = `${BASE_URL}/workshop/upgrade/${upgrade.tree}/${encodeURIComponent(upgrade.name)}`
    await page.goto(url, { waitUntil: 'networkidle' })
    await dismissConsent(page)

    const maxLevelOnPage = await readMaxLevelOnPage(page)
    if (maxLevelOnPage === null) {
      results.push({ name: upgrade.name, level: '?', status: 'ERROR', detail: 'could not read page' })
      continue
    }

    const gapCeiling = GAP_CEILINGS[upgrade.name]
    const ceiling = gapCeiling ?? upgrade.quantity
    for (const ourIndex of checklistLevels(ceiling)) {
      const ours = formatCoins(WORKSHOP_LEVELS[upgrade.name]?.[String(ourIndex)]?.coins ?? 0).replace(' coins', '')
      const mytowerLevel = ourIndex + 1
      const theirs = await readMytowerCost(page, mytowerLevel, maxLevelOnPage)
      if (theirs === null) {
        results.push({ name: upgrade.name, level: ourIndex, status: 'ERROR', detail: 'row not found' })
        continue
      }
      results.push({ name: upgrade.name, level: ourIndex, status: classify(ours, theirs), detail: `ours=${ours} theirs=${theirs}` })
    }

    // GAP probe: our own quantity (post-OQ-13 correction) is higher than
    // the ceiling WORKSHOP_LEVELS actually has cost data for -- check
    // whether mytower.app's own max level agrees with our corrected
    // quantity, and if so, whether it has real cost data at our own
    // corrected max-1 index, which we currently have none for at all.
    if (gapCeiling !== undefined) {
      const correctedIndex = upgrade.quantity - 1
      const mytowerLevel = correctedIndex + 1
      const theirs = maxLevelOnPage >= mytowerLevel ? await readMytowerCost(page, mytowerLevel, maxLevelOnPage) : null
      results.push({
        name: upgrade.name,
        level: `${correctedIndex} (GAP)`,
        status: theirs ? 'GAP DATA FOUND' : 'still no data',
        detail: `mytower max=${maxLevelOnPage}, our quantity=${upgrade.quantity}${theirs ? `, mytower cost at Lv${correctedIndex}=${theirs}` : ''}`,
      })
    }

    await page.waitForTimeout(NAV_DELAY_MS)
  }

  await browser.close()

  console.log('\n=== Results ===')
  for (const r of results) {
    console.log(`${r.status.padEnd(16)} ${r.name} Lv${r.level} -- ${r.detail}`)
  }

  const byUpgrade = new Map()
  for (const r of results) {
    if (!byUpgrade.has(r.name)) byUpgrade.set(r.name, [])
    byUpgrade.get(r.name).push(r)
  }
  console.log('\n=== Summary (per upgrade) ===')
  for (const [name, rows] of byUpgrade) {
    const spotCheckRows = rows.filter((r) => r.status === 'MATCH' || r.status === 'NEAR (rounding)' || r.status === 'MISMATCH')
    const clean = spotCheckRows.length > 0 && spotCheckRows.every((r) => r.status === 'MATCH' || r.status === 'NEAR (rounding)')
    console.log(`${clean ? 'CLEAN' : 'REVIEW'.padEnd(6)} ${name}`)
  }
}

// Only run when invoked directly (`node scripts/verify-workshop-costs.mjs`),
// not when imported -- lets a test file import the pure helpers above
// (checklistLevels/parseAbbreviated/classify) without launching a browser.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

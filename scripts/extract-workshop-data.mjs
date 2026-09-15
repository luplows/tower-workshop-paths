#!/usr/bin/env node
/**
 * Extracts every Workshop upgrade's real max level and full per-level cost
 * curve from mytower.app, replacing tower-idle-toolkit as this project's
 * source for that data -- see Open-Questions.md's OQ-39 and
 * OQ-39-Data-Source-Migration.md (Phase 1) for the full rationale.
 *
 * Unlike scripts/verify-workshop-costs.mjs (which only spot-checks 3
 * levels per upgrade against the existing tower-idle-toolkit data), this
 * pulls every level -- ~31,000 data points across 48 upgrades -- and
 * writes `src/data/workshopUpgrades.js` / `src/data/workshopLevels.js`
 * directly, in the same flat-array shape `enhancementLevels.js` already
 * uses. Like that file, the resulting costs carry mytower.app's own
 * display precision (~3 significant figures, rounded) rather than exact
 * decimals -- an accepted tradeoff (see the plan doc), not a bug.
 *
 * Resumable: writes progress to `.cache/workshop-extraction.json`
 * (gitignored) after every upgrade, so an interrupted run picks back up
 * rather than restarting from scratch. Re-run this script to regenerate
 * the data files after a suspected game patch.
 *
 * Efficient by design, not just polite: reads ~14 rows per scroll
 * snapshot (the grid's own virtualized viewport) via one page.evaluate()
 * call, rather than one round-trip per individual level -- still a single
 * browser context, one navigation per upgrade, small delays throughout.
 *
 * Usage (see scripts/lib/resolve-extensionless.mjs for the --import):
 *   npm run extract:workshop-data
 *   npm run extract:workshop-data -- Damage "Multishot Targets"  # a subset
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { WORKSHOP_CATEGORIES } from '../src/data/workshopCategories.js'
import { parseAbbreviated } from './verify-workshop-costs.mjs'

const BASE_URL = 'https://mytower.app'
const NAV_DELAY_MS = 300
const SCROLL_SETTLE_MS = 150
// Leaves a safety margin below the grid's own ~17 visible rows, so
// adjacent scroll snapshots always overlap by a few rows -- guards
// against off-by-one gaps from rounding `scrollTop`.
const VIEWPORT_OVERLAP_ROWS = 3

const CACHE_DIR = new URL('../.cache/', import.meta.url)
const CACHE_PATH = new URL('workshop-extraction.json', CACHE_DIR)

const filterNames = process.argv.slice(2)
const upgrades = WORKSHOP_CATEGORIES.flatMap((category) =>
  category.upgrades.map((upgrade) => ({ tree: category.id, name: upgrade.name })),
).filter((u) => filterNames.length === 0 || filterNames.includes(u.name))

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {}
  return JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
}

function saveCache(cache) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(CACHE_PATH, JSON.stringify(cache))
}

async function dismissConsent(page) {
  const agree = page.getByRole('button', { name: 'Agree and continue' })
  if (await agree.isVisible().catch(() => false)) {
    await agree.click()
  }
}

async function readMaxLevelOnPage(page) {
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

async function extractUpgrade(page, tree, name) {
  const url = `${BASE_URL}/workshop/upgrade/${tree}/${encodeURIComponent(name)}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await dismissConsent(page)

  const maxLevel = await readMaxLevelOnPage(page)
  if (maxLevel === null || maxLevel <= 0) {
    return { tree, name, error: 'could not read max level (M) on page' }
  }

  const grid = page.locator('div.data-grid')
  const { scrollHeight, clientHeight } = await grid.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  const rowHeight = scrollHeight / (maxLevel + 1)
  const viewportRows = Math.max(1, Math.floor(clientHeight / rowHeight))
  const stepRows = Math.max(1, viewportRows - VIEWPORT_OVERLAP_ROWS)

  // Our own cost array covers indices 0..maxLevel-1 -- mytower's "Level
  // 1".."Level maxLevel" rows. costsByLevel is keyed by mytower's own
  // 1-indexed "Level" number throughout, remapped to our 0-indexed array
  // only at the very end.
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

  return { tree, name, maxLevel, costs, missing: missing.length > 0 ? missing : undefined }
}

async function main() {
  const cache = loadCache()
  const browser = await chromium.launch()
  const page = await browser.newPage()

  let completed = 0
  for (const { tree, name } of upgrades) {
    if (cache[name] && !cache[name].error) {
      completed++
      continue
    }

    process.stdout.write(`[${completed + 1}/${upgrades.length}] ${name} (${tree})... `)
    const result = await extractUpgrade(page, tree, name)
    cache[name] = result
    saveCache(cache)
    completed++

    if (result.error) {
      console.log(`ERROR: ${result.error}`)
    } else {
      console.log(`max ${result.maxLevel}, ${result.costs.length} levels${result.missing ? `, MISSING ${result.missing.length}: ${result.missing.slice(0, 5).join(',')}...` : ''}`)
    }

    await page.waitForTimeout(NAV_DELAY_MS)
  }

  await browser.close()
  console.log(`\nDone. Cache at ${fileURLToPath(CACHE_PATH)}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}

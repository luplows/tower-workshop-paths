#!/usr/bin/env node
/**
 * Extracts every Workshop upgrade's real max level and full per-level cost
 * curve from mytower.app, replacing tower-idle-toolkit as this project's
 * source for that data -- see Completed-Questions.md's OQ-39 and
 * OQ-39-Data-Source-Migration.md (Phase 1) for the full rationale.
 *
 * Unlike scripts/verify-workshop-costs.mjs (which only spot-checks 3
 * levels per upgrade against the existing tower-idle-toolkit data), this
 * pulls every level -- ~31,000 data points across 48 upgrades -- feeding
 * `src/data/workshopUpgradeList.js` / `src/data/workshopLevels.js` (via
 * generate-workshop-data-files.mjs, a separate step -- this script only
 * writes the resumable cache). The resulting costs carry mytower.app's
 * own display precision (~3 significant figures, rounded) rather than
 * exact decimals -- an accepted tradeoff (see the plan doc), not a bug.
 *
 * Resumable: writes progress to `.cache/workshop-extraction.json`
 * (gitignored) after every upgrade, so an interrupted run picks back up
 * rather than restarting from scratch. Re-run this script to regenerate
 * the data files after a suspected game patch.
 *
 * The actual scrape technique (efficient by design, not just polite --
 * ~14 rows per scroll snapshot via one page.evaluate() call, rather than
 * one round-trip per individual level; a single browser context, one
 * navigation per upgrade, small delays throughout) lives in
 * scripts/lib/mytower-scrape.mjs, shared with extract-enhancement-data.mjs
 * (Phase 2).
 *
 * Usage (see scripts/lib/resolve-extensionless.mjs for the --import):
 *   npm run extract:workshop-data
 *   npm run extract:workshop-data -- Damage "Multishot Targets"  # a subset
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { WORKSHOP_CATEGORIES } from '../src/data/workshopCategories.js'
import { extractFullCostCurve } from './lib/mytower-scrape.mjs'

const BASE_URL = 'https://mytower.app'
const NAV_DELAY_MS = 300

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

async function extractUpgrade(page, tree, name) {
  const url = `${BASE_URL}/workshop/upgrade/${tree}/${encodeURIComponent(name)}`
  const result = await extractFullCostCurve(page, url)
  return { tree, name, ...result }
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

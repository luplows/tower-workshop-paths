#!/usr/bin/env node
/**
 * Extracts every Workshop Enhancement category's full per-level cost curve
 * from mytower.app, replacing the community Google Sheet as this project's
 * source for that data -- OQ-39 Phase 2 (see Open-Questions.md and
 * OQ-39-Data-Source-Migration.md).
 *
 * Unlike Phase 1 (Workshop upgrades), this only replaces per-level costs
 * (feeding `src/data/enhancementLevels.js`, via
 * generate-enhancement-data-files.mjs). `enhancementCategories.js` (names,
 * `quantity`, and the OQ-6 cumulative-spend `unlocksAt` thresholds) stays
 * as-is: mytower.app's own max level matched ours on every category
 * spot-checked, with no evidence either is wrong, and mytower.app doesn't
 * model the tree-threshold-gating mechanic at all (confirmed by
 * inspecting its Enhancement pages directly -- no lock/unlock/threshold
 * concept appears anywhere), the same way it never modeled Workshop's
 * paid-unlock-groups mechanic (OQ-5) in Phase 1.
 *
 * mytower.app's own per-category names don't match this project's 1:1 --
 * most add a trailing " +" (matching the game's own Enhancement-display
 * convention this project already uses, see UpgradePath.jsx's
 * `displayName`), but not all (`ENHANCEMENT_NAME_ALIASES` below has the
 * full, verified mapping, confirmed against mytower.app's own
 * /workshop hub page listing).
 *
 * Resumable: writes progress to `.cache/enhancement-extraction.json`
 * (gitignored) after every category, so an interrupted run picks back up
 * rather than restarting from scratch. Re-run this script to regenerate
 * the data file after a suspected game patch.
 *
 * The actual scrape technique lives in scripts/lib/mytower-scrape.mjs,
 * shared with extract-workshop-data.mjs (Phase 1) -- see that module for
 * the efficiency/politeness rationale.
 *
 * Usage (see scripts/lib/resolve-extensionless.mjs for the --import):
 *   npm run extract:enhancement-data
 *   npm run extract:enhancement-data -- Damage "Rend Armor"  # a subset, by OUR name
 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ENHANCEMENT_CATEGORIES } from '../src/data/enhancementCategories.js'
import { extractFullCostCurve } from './lib/mytower-scrape.mjs'

const BASE_URL = 'https://mytower.app'
const NAV_DELAY_MS = 300

const CACHE_DIR = new URL('../.cache/', import.meta.url)
const CACHE_PATH = new URL('enhancement-extraction.json', CACHE_DIR)

// Our name -> mytower.app's own page name, confirmed 2026-09-15 against
// https://mytower.app/workshop's own rendered Enhancement links (not
// guessed from the "+" pattern, which doesn't hold for all of them).
const ENHANCEMENT_NAME_ALIASES = {
  Damage: 'Damage +',
  'Rend Armor': 'Rend Armor Max',
  'Critical Factor': 'Critical Factor +',
  'Damage/Meter': 'Damage / Meter +',
  'Super Crit Mult': 'Super Crit Mult +',
  'Attack Speed': 'Attack Speed +',
  Health: 'Health +',
  'Health Regen': 'Health Regen +',
  'Defense Absolute': 'Defense Absolute +',
  'Land Mine Damage': 'Land Mine Damage +',
  'Wall Health': 'Wall Health +',
  'Orb Size': 'Orb Size',
  'Cash Bonus': 'Cash Bonus +',
  'Coin Bonus': 'Coin Bonus +',
  'Cells/Kill Bonus': 'Cells / Kill Bonus',
  'Free Upgrades': 'Free Upgrades +',
  'Recovery Package': 'Recovery Package +',
  'Enemy Level Skip': 'Enemy Level Skip +',
}

const filterNames = process.argv.slice(2)
const categories = ENHANCEMENT_CATEGORIES.flatMap((category) =>
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

async function extractCategory(page, tree, name) {
  const mytowerName = ENHANCEMENT_NAME_ALIASES[name]
  if (!mytowerName) {
    return { tree, name, error: `no mytower.app name mapping for "${name}"` }
  }
  const url = `${BASE_URL}/workshop/enhancement/${tree}/${encodeURIComponent(mytowerName)}`
  const result = await extractFullCostCurve(page, url)
  return { tree, name, ...result }
}

async function main() {
  const cache = loadCache()
  const browser = await chromium.launch()
  const page = await browser.newPage()

  let completed = 0
  for (const { tree, name } of categories) {
    if (cache[name] && !cache[name].error) {
      completed++
      continue
    }

    process.stdout.write(`[${completed + 1}/${categories.length}] ${name} (${tree})... `)
    const result = await extractCategory(page, tree, name)
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

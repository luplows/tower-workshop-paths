# OQ-39 Plan: Source Workshop, Enhancement, and Lab data from mytower.app instead of `tower-idle-toolkit`

Companion plan for [Open-Questions.md](Open-Questions.md)'s OQ-39 — mirrors how [`OQ-1-Checklist.md`](OQ-1-Checklist.md) tracks OQ-1's own work. **Status: Phase 1 (Workshop) done. Phase 2 (Enhancement) not started.**

## Why

The Wall Health bug (OQ-38) showed `tower-idle-toolkit`'s `WORKSHOP_LEVELS` can be meaningfully wrong (confirmed against the user's own real in-game purchase cost — our data was ~3.46× too high), not just occasionally stale. mytower.app's cost tables, by contrast, are independently maintained, spot-checked clean against our data for 47 of 48 Workshop upgrades, and now confirmed accurate against a real in-game number where our own data was wrong. Moving the primary source of truth there — rather than patching individual bad values as they're found — is more consistent than the current "trust `tower-idle-toolkit`, override known-bad values" model, and drops a ~2.4MB dependency (OQ-12) that's mostly unused bundled game data in the first place.

## Current `tower-idle-toolkit` footprint

Only 4 files import it, across 4 distinct data categories:

| Category | Export | File | mytower.app equivalent |
|---|---|---|---|
| Workshop upgrade list, order, max level | `ATTACK_UPGRADES`/`DEFENSE_UPGRADES`/`UTILITY_UPGRADES` | `workshopCategories.js` | `/workshop` (name/order per tree) + each upgrade's own page (`M {max}`) |
| Workshop per-level costs | `WORKSHOP_LEVELS` | `cheapestNextUpgrades.js` | `/workshop/upgrade/{tree}/{name}` |
| Workshop discount Lab % | `LabValues` (`Workshop {Tree} Discount`) | `workshopDiscount.js` | `/labs/Workshop {Tree} Discount` (same page shape already used for Enhancement discount Labs, OQ-37 — not yet individually confirmed to exist for all 3 Workshop ones, but expected given the identical URL pattern) |
| Workshop upgrade-unlock groups (group names, one-time costs, upgrade membership — OQ-5) | `ATTACK_UNLOCKS`/`DEFENSE_UNLOCKS`/`UTILITY_UNLOCKS` | `workshopUnlockGroups.js` | **None found** — checked the upgrade pages, the Workshop input hub, and network requests for a hidden API; mytower.app's own calculator doesn't appear to model this mechanic at all |

Enhancement data (`enhancementCategories.js`/`enhancementLevels.js`) is already independent of `tower-idle-toolkit` — hand-transcribed from the community Google Sheet (OQ-14). This migration re-sources it to mytower.app too, for one consistent, re-verifiable source instead of two.

## Decisions made (2026-09-15)

- **Unlock groups:** keep `tower-idle-toolkit` as a dependency solely for `ATTACK_UNLOCKS`/`DEFENSE_UNLOCKS`/`UTILITY_UNLOCKS` — not implicated in any known bug. Two alternative sources were investigated and rejected (licensing; see below) — **this decision is now final**, not pending.
- **Precision:** accept mytower.app's rounded (~3 significant figures) display values as the new baseline, replacing `tower-idle-toolkit`'s exact fractional costs. This matches what a player actually sees in-game anyway, and the "exact" data hasn't proven more trustworthy (see Wall Health). Affects batch-purchase sums and OQ-6's cumulative-spend thresholds, which currently benefit from exact inputs — a real but accepted tradeoff.
  **Observed in practice (2026-09-15):** the user's real 100-level Wall Health batch (Lv700→800, 10.5% discount) displayed in-game as 959.72B; this app showed 959.71B. The underlying math is exactly right — the app's raw total is 959,717,450,000, i.e. 959.71745B, genuinely on the truncate side of the `.715` boundary — so this isn't a `formatCoins.js` truncate-vs-round bug (a deliberate, tested choice — see its own docstring and `formatCoins.test.js`'s ".xx5 boundary" test, verified against a clean single-level in-game value). It's this precision tradeoff surfacing exactly as expected: summing 100 individually-~3-sig-fig-rounded per-level costs can drift a large batch's total by roughly a hundredth of a percent, occasionally landing it on the wrong side of a display-rounding boundary even though every individual level is correct to display precision. Judged not worth chasing right now (would mean reopening the tower-smith/the-tower-unified-tools licensing tradeoff for exact per-level data) — **noted here for reference if a similar user-reported mismatch comes up again**, so it isn't re-investigated as a new, unexplained bug each time.
- **Staging:** phased, one data category (and PR) at a time — Workshop first, then Enhancement. Smaller reviewable diffs, each independently mergeable, lower blast radius if a category turns out to need rework.

## Alternative sources considered, for the unlock-groups gap (2026-09-15)

The user found two candidate replacement sources for the Workshop upgrade-unlock group data (the one category with no mytower.app equivalent — see the footprint table above): [tower-smith](https://github.com/AngryBrit/tower-smith) and [the-tower-unified-tools](https://github.com/SFleet89/the-tower-unified-tools) (a newer tool that explicitly derives its own Workshop cost data from tower-smith's). Both were investigated and **rejected in favor of staying with mytower.app**, primarily over licensing:

- **Both are CC BY-NC-SA 4.0**, not a permissive license — NonCommercial and ShareAlike clauses that conflict with this project's MIT license (SA in particular would require any derivative work to carry the same copyleft license, not MIT). mytower.app's own terms, by contrast, only ask for a linkback credit — no copyleft entanglement, consistent with how this project already credits `tower-idle-toolkit` and the community Google Sheet.
- Technically, neither actually had the unlock-group *cost* data either — `tower-smith`'s unlock-gate code only maps group names to upgrade membership (for interpreting an externally-linked, live-synced "Effective Paths" Google Sheet, not bundled cost data), and `the-tower-unified-tools` has no unlock-group handling at all. So even setting licensing aside, neither source would have closed the actual gap.
- `tower-smith` (archived/discontinued as of 2026-06-28) did turn up one genuinely useful data point along the way: its raw per-level Workshop cost JSON is **exact precision**, not rounded like mytower.app's UI, and it independently confirmed the OQ-38 Wall Health finding (its Lv1 cost, 8.2M, matches mytower.app and the user's real in-game number, contradicting `tower-idle-toolkit`'s 8.4M) — a third independent confirmation, but not enough to outweigh the licensing conflict for actually sourcing data from it.

## Data volume

31,107 Workshop upgrade levels + 8,360 Enhancement levels ≈ **39,467 data points**, across 48 + 18 = 66 page loads. At the pace already proven safe in `scripts/verify-workshop-costs.mjs` (~17 rows read per scroll snapshot, a short delay between pages), a full extraction is roughly **13–15 minutes**, run once (or again after a suspected patch) — never at app runtime. This project has no backend and nothing leaves the user's machine while actually running (Project-Outline.md) — mytower.app can only ever be a data-generation-time source, feeding static files checked into the repo, the same way `enhancementLevels.js` already works today.

## Phased plan

### Phase 1: Workshop upgrade costs, max levels, and discount Lab data — ✅ done

- `scripts/extract-workshop-data.mjs` (new): full per-level extraction for all 48 Workshop upgrades — not just the 3 checklist spot-check levels. Reads ~14 rows per scroll snapshot via one `page.evaluate()` call (the grid's own virtualized viewport), rather than one round-trip per level; resumable via `.cache/workshop-extraction.json` (gitignored), so an interrupted run picks back up. Full run: all 48 upgrades, zero missing levels, zero errors, ~9 minutes total (the two largest, Damage and Health/Health Regen at 6000 levels each, ~80s apiece).
- `scripts/generate-workshop-data-files.mjs` (new): turns that cache into the two files app code actually imports — a separate, instant, deterministic step from the slow scrape itself.
- New data files: `src/data/workshopUpgradeList.js` (name/order/max level per tree) and `src/data/workshopLevels.js` (per-upgrade cost arrays, `enhancementLevels.js`'s flat `{ [name]: [cost, cost, ...] }` shape) — replacing `workshopCategories.js`'s `ATTACK_UPGRADES`/etc. import and `cheapestNextUpgrades.js`'s `WORKSHOP_LEVELS` import.
- `workshopDiscount.js`'s `LabValues` import replaced with a hardcoded formula (mirroring `enhancementDiscount.js`) — independently re-verified against `/labs/Workshop {Tree} Discount` on all 3 trees first (0.5%/level, 99 max, identical to what `LabValues` already gave), so no data changed, just its source.
- **`workshopQuantityOverrides.js` deleted entirely**, not just kept as a mechanism — all 48 upgrades' mytower.app max levels matched this project's existing values exactly (confirmed via a byte-identical `workshopCategories.test.js` snapshot diff), including all 5 previously-corrected ones (OQ-13). The override mechanism itself is gone; if a future patch needs one again, it'll need reintroducing.
- `workshopUnlockGroups.js` untouched, still importing `tower-idle-toolkit` for `ATTACK_UNLOCKS`/etc., per the decision above.
- **Test fallout, all resolved:** 4 tests in `cheapestNextUpgrades.test.js` and 1 in `UpgradePath.test.jsx` depended on the old Health/Health Regen/Recovery Amount/Max Recovery cost-data gap (OQ-1) to exercise `unknownCost`/partial-batch-refusal — removed, since that gap no longer exists anywhere in the real data (their premise is now unreachable), with a comment pointing at why. 4 fixtures elsewhere hardcoded `tower-idle-toolkit`'s exact-decimal batch sums (e.g. `2964837.2903208775`) — recomputed against the new data and updated to the new real values (e.g. `2964910`), not guessed.
- One lint cleanup found along the way: `parseAbbreviated`'s float multiplication (`8.2 * 1e6`) produces meaningless trailing noise like `8199999.999999999` — now rounded to a clean integer when generating the final data files, since the source precision is only ever ~3 significant figures anyway.
- `scripts/verify-workshop-costs.mjs` updated to import from this project's own new `workshopLevels.js` instead of `tower-idle-toolkit` — its role shifted from "does our data match mytower.app" (the original OQ-1/OQ-38 cross-check) to "does our *shipped* data still match mytower.app's *live* data" (a drift detector for after a future patch), since both now come from the same place. Also gained a `MAX LEVEL DRIFT` check (comparing our stored `quantity` against mytower's live `M` field) as a natural side effect of no longer needing the old gap-specific logic.
- **Bundle size increased** (2,526.55 kB → 2,755.90 kB minified) rather than decreased — carrying both the new generated data and the still-needed `tower-idle-toolkit` (for unlock groups) adds up to more than `tower-idle-toolkit` alone did. OQ-12's bundle-size goal stays unmet until/unless the unlock-groups dependency is ever fully dropped.

### Phase 2: Enhancement costs

- Same extraction approach against `/workshop/enhancement/{tree}/{name}`, all 18 categories.
- Replaces `enhancementLevels.js`'s Google-Sheet-sourced cost arrays. `enhancementCategories.js`'s `unlocksAt` thresholds (OQ-6, the 50B/500B/5T/50T/500T progression) and `quantity` (max level) values are community-sheet-specific constructs not obviously present on mytower.app in the same shape — needs checking whether mytower.app's own Enhancement pages expose an equivalent threshold/max, or whether these stay sourced from the Google Sheet even after Phase 2 (a partial migration, not a full one, for this file specifically).
- Test impact: `enhancementLevels.test.js`'s snapshot, plus any test fixture using specific real Enhancement costs (e.g. `getPrioritizedNextUpgrades.test.js`'s Coin Bonus/Cash Bonus values used throughout the eHP scoring tests) — same re-verification need as Phase 1.

### Phase 1.5 / future: fully remove `tower-idle-toolkit`

- Only possible if the Workshop upgrade-unlock group data (group names, one-time costs, upgrade membership) ever gets a real replacement source — two candidates were already investigated and rejected (see "Alternative sources considered" above). Not actively pursued; `tower-idle-toolkit` staying as a small, single-purpose dependency is the accepted long-term state, not a stopgap.
- If a source does turn up later: replace `workshopUnlockGroups.js`'s import, remove `tower-idle-toolkit` from `package.json`, and get the real bundle-size win noted in OQ-12.

## Open items before Phase 2 starts

- Whether `enhancementCategories.js`'s `unlocksAt` thresholds (OQ-6) and `quantity` values are re-sourceable from mytower.app at all, or need to stay Google-Sheet-sourced even after Phase 2 (a partial migration for that one file) — not yet checked.
- Decide the Enhancement data files' exact shape/location, following the same conventions Phase 1 landed on (`workshopUpgradeList.js` + `workshopLevels.js`).

# OQ-39 Plan: Source Workshop, Enhancement, and Lab data from mytower.app instead of `tower-idle-toolkit`

Companion plan for [Open-Questions.md](Open-Questions.md)'s OQ-39 — mirrors how [`OQ-1-Checklist.md`](OQ-1-Checklist.md) tracks OQ-1's own work. **Status: planned, not started.** Waiting on an additional data source (Workshop upgrade-unlock groups, see below) before Phase 1 begins.

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

- **Unlock groups:** keep `tower-idle-toolkit` as a dependency solely for `ATTACK_UNLOCKS`/`DEFENSE_UNLOCKS`/`UTILITY_UNLOCKS` — not implicated in any known bug, and no replacement source has been found yet. **The user may have found an alternative source for this data** (pending as of this writing) — if so, this decision should be revisited before Phase 1, since a full removal becomes possible.
- **Precision:** accept mytower.app's rounded (~3 significant figures) display values as the new baseline, replacing `tower-idle-toolkit`'s exact fractional costs. This matches what a player actually sees in-game anyway, and the "exact" data hasn't proven more trustworthy (see Wall Health). Affects batch-purchase sums and OQ-6's cumulative-spend thresholds, which currently benefit from exact inputs — a real but accepted tradeoff.
- **Staging:** phased, one data category (and PR) at a time — Workshop first, then Enhancement. Smaller reviewable diffs, each independently mergeable, lower blast radius if a category turns out to need rework.

## Data volume

31,107 Workshop upgrade levels + 8,360 Enhancement levels ≈ **39,467 data points**, across 48 + 18 = 66 page loads. At the pace already proven safe in `scripts/verify-workshop-costs.mjs` (~17 rows read per scroll snapshot, a short delay between pages), a full extraction is roughly **13–15 minutes**, run once (or again after a suspected patch) — never at app runtime. This project has no backend and nothing leaves the user's machine while actually running (Project-Outline.md) — mytower.app can only ever be a data-generation-time source, feeding static files checked into the repo, the same way `enhancementLevels.js` already works today.

## Phased plan

### Phase 1: Workshop upgrade costs, max levels, and discount Lab data

- Extend `scripts/verify-workshop-costs.mjs`'s technique into a proper extraction script (or a new mode of it) that captures every level's cost for all 48 upgrades, not just the 3 checklist spot-check levels — writing incrementally to a cache file so an interrupted run can resume rather than restarting from scratch.
- Also capture each upgrade's real max level (`M` field) and each tree's discount Lab data from `/labs/Workshop {Tree} Discount`.
- New data file(s) under `src/data/` (shape TBD at implementation time — likely mirroring `enhancementLevels.js`'s flat `{ [name]: [cost, cost, ...] }` structure) replacing:
  - `workshopCategories.js`'s `ATTACK_UPGRADES`/`DEFENSE_UPGRADES`/`UTILITY_UPGRADES` import (keeps `workshopQuantityOverrides.js`'s override *mechanism* if any mytower-sourced max level is later found stale, but the 5 currently-known corrections may become unnecessary if mytower.app's own max levels already reflect them — needs checking during implementation)
  - `cheapestNextUpgrades.js`'s `WORKSHOP_LEVELS` import
  - `workshopDiscount.js`'s `LabValues` import
- `workshopUnlockGroups.js` keeps importing `tower-idle-toolkit` for `ATTACK_UNLOCKS`/etc. (per the decision above), so the dependency stays in `package.json` after this phase — only fully removable once Phase 1.5 (see below) resolves.
- Test impact: `workshopCategories.test.js`'s snapshot will need regenerating (`vitest -u`, reviewed) since the data source itself changes shape/values. `cheapestNextUpgrades.test.js`/`getPrioritizedNextUpgrades.test.js`'s fixtures reference specific real costs (e.g. Multishot Targets' 450/2000/5000/... sequence) — need re-verifying against the new source, since a rounded-precision source may shift small numbers that happen to display identically today but could differ once the source itself changes.
- `scripts/verify-workshop-costs.mjs` (or its extraction-mode successor) becomes the ongoing re-verification tool after future patches, replacing its current "spot-check 3 levels" role with "this is how the data gets (re-)generated in the first place."

### Phase 2: Enhancement costs

- Same extraction approach against `/workshop/enhancement/{tree}/{name}`, all 18 categories.
- Replaces `enhancementLevels.js`'s Google-Sheet-sourced cost arrays. `enhancementCategories.js`'s `unlocksAt` thresholds (OQ-6, the 50B/500B/5T/50T/500T progression) and `quantity` (max level) values are community-sheet-specific constructs not obviously present on mytower.app in the same shape — needs checking whether mytower.app's own Enhancement pages expose an equivalent threshold/max, or whether these stay sourced from the Google Sheet even after Phase 2 (a partial migration, not a full one, for this file specifically).
- Test impact: `enhancementLevels.test.js`'s snapshot, plus any test fixture using specific real Enhancement costs (e.g. `getPrioritizedNextUpgrades.test.js`'s Coin Bonus/Cash Bonus values used throughout the eHP scoring tests) — same re-verification need as Phase 1.

### Phase 1.5 / future: fully remove `tower-idle-toolkit`

- Only possible once the Workshop upgrade-unlock group data (group names, one-time costs, upgrade membership) has a real replacement source — either the user's alternative source (pending) or the community Google Sheet, if it turns out to already document this.
- Once resolved: replace `workshopUnlockGroups.js`'s import, remove `tower-idle-toolkit` from `package.json`, and get the real bundle-size win noted in OQ-12.

## Open items before Phase 1 starts

- **The user's alternative data source** for Workshop upgrade-unlock groups — once provided, re-evaluate whether Phase 1.5 can be folded into Phase 1 instead of deferred.
- Confirm `/labs/Workshop Attack Discount` (and Defense/Utility) actually exist on mytower.app in the same shape as the Enhancement discount Lab pages already used for OQ-37 — assumed, not yet individually verified.
- Decide the new data files' exact shape/location during implementation, following this project's existing conventions (`enhancementLevels.js`'s flat per-name array is the closest precedent).

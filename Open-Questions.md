# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
**Mostly resolved via OQ-39's Phase 1 migration:** Workshop upgrade costs now come directly from mytower.app (`src/data/workshopLevels.js`) rather than `tower-idle-toolkit` — the source itself changed, not just a cross-check layer bolted on top of it. This fixed a real, confirmed-wrong data point (Wall Health, OQ-38) and closed the old 4-upgrade cost-data gap entirely — every level 0..quantity-1 now has a real cost, nothing left to report as `unknownCost` for missing Workshop data. **Still genuinely open:** "Max level confirmed" — no upgrade's max level has been checked against the real, current-patch game directly. mytower.app's own max level matched this project's existing value for all 48 upgrades (a byte-identical structural snapshot), which is reassuring but not the same as independent in-game confirmation. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — now primarily useful for that remaining max-level task. Re-running `scripts/verify-workshop-costs.mjs` going forward checks for *drift* from mytower.app's own live data (e.g. after a future patch changes a cost before this project re-extracts it), not independent cross-validation — our data comes from the same place it's being checked against now.

**OQ-39. Source Workshop, Enhancement, and Lab data from mytower.app instead of tower-idle-toolkit**
As a maintainer, I want this project's core cost/level data to come from a source that's actually held up under scrutiny, so that bugs like OQ-38's aren't found only when a player happens to report a mismatched number.
**Phase 1 (Workshop) done:** all 48 Workshop upgrades' costs and max levels, plus the Workshop discount Lab formula, now come from mytower.app (`src/data/workshopUpgradeList.js`, `src/data/workshopLevels.js`, `src/utils/workshopDiscount.js`) via two new scripts, `scripts/extract-workshop-data.mjs` (full per-level extraction, resumable) and `scripts/generate-workshop-data-files.mjs` (cache → final data files) — resolving OQ-38 (Wall Health) as part of the same migration, not a standalone patch. Every upgrade's max level matched what this project already had (byte-identical structural snapshot across all 48, not just the 5 previously-corrected ones); the discount Lab formula (0.5%/level, 99 max) was independently re-confirmed against mytower.app on all 3 trees and needed no data change, just a source change. **Phase 2 (Enhancement) not started.** `tower-idle-toolkit` stays a dependency, now solely for Workshop upgrade-unlock groups (OQ-5, decided final — see the plan doc for the licensing investigation that ruled out two alternative sources). **Full plan / details:** [`OQ-39-Data-Source-Migration.md`](OQ-39-Data-Source-Migration.md). **Bundle-size note:** carrying both the new generated data and the still-needed toolkit actually *increased* the shipped bundle size for now (OQ-12) — only resolved if the unlock-groups dependency is ever fully dropped.

### Depends on the above being mature

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. OQ-2, OQ-4, OQ-5, OQ-6, and OQ-7 are all done now, so this is fully unblocked on the buy-order side.

### Anytime — no dependencies

**OQ-9. Verify the UI on a real mobile device**
As a player who checks this tool while actually playing on my phone, I want the phone-mimicking layout to work correctly on a real touch device, so that it's usable in the situation it's designed for.
Only checked in a desktop browser at a fixed width so far.

**OQ-12. Reduce production bundle size**
As a maintainer, I want the shipped JS bundle to only include what the app uses, so that load time doesn't suffer as real usage grows.
Currently ~2.4MB minified, mostly `tower-idle-toolkit`'s bundled game data (labs, cards, bots, etc. we don't use). Worth revisiting with code-splitting or a narrower import once the app has more real usage to justify the effort. Not currently blocking anything.

**OQ-24. Import current levels from the game's `playerInfo.dat` file**
As a player, I want to import my Workshop and Enhancement current levels straight from the game's own save data, so that I don't have to manually type in every level to get started.
The game keeps a `playerInfo.dat` file (not normally player-facing) that should already contain current Workshop and Enhancement levels. Open questions: what format the file is actually in (plain JSON, a custom binary format, encrypted/obfuscated — unknown until inspected) and whether it's even parseable client-side; how the user gets the file into the browser (a file picker is the obvious client-only option, consistent with `Project-Outline.md`'s no-backend scope); and whether an import fully replaces entered levels (interacting with OQ-22's Clear) or merges with them.

**OQ-25. Share entered levels with a friend via a link**
As a player, I want to share my current Workshop/Enhancement levels with a friend (e.g. to compare progress or get buy-order advice), so that I don't have to describe my levels to them by hand.
Client-only, per `Project-Outline.md`'s no-backend scope: likely encode `workshopLevels`/`enhancementLevels` into the URL itself (query string or fragment, probably compressed given ~48 Workshop + 18 Enhancement values) rather than a server-hosted share. Open questions: does opening a shared link overwrite the recipient's own entered levels (interacting with OQ-22's Clear/confirmation pattern) or show a separate read-only view; and how large the resulting link gets and whether that's practical to share (e.g. via text message). Now that the priority-weighted Path (OQ-2) exists, there's more worth sharing than raw levels alone — still worth doing regardless of timing.

### Lowest priority

**OQ-21. Consider forking tower-idle-toolkit to contribute corrected Workshop data back**
As a maintainer, I want to consider publishing our corrected/verified Workshop cost and max-level data back to `tower-idle-toolkit` (or a maintained fork), so that other tools built on the package — and the community generally — benefit from the corrections instead of them living only in this repo's overrides.
Not urgent. Depends on OQ-1 and OQ-13's corrections actually being thorough and trustworthy first — no point publishing back data we haven't verified ourselves. Open question: fork and maintain independently, or contribute upstream via PR to the original package?

# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
Only `quantity` (max level) has been verified so far (OQ-13) — the actual `cash`/`coins` cost figures in `WORKSHOP_LEVELS` (from `tower-idle-toolkit`) haven't been individually spot-checked. An unverified stale cost would produce a wrong recommendation even with correct quantities, and matters more than the max-level task did. **Confirmed gap (via OQ-17):** for the 4 upgrades whose `quantity` was corrected upward past `tower-idle-toolkit`'s own belief (Health, Health Regen, Recovery Amount, Max Recovery — see OQ-13), `WORKSHOP_LEVELS` simply has no cost data past the toolkit's old, lower ceiling (its last entry there is a `coins: 0` "nothing more to buy" sentinel, not a real cost). `getPrioritizedNextUpgrades` (`src/utils/cheapestNextUpgrades.js`, OQ-2) treats that as unknown rather than a real 0-coin upgrade, but the underlying data gap itself is still unresolved. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — one entry per upgrade, to work through 1 by 1.
**Progress:** `scripts/verify-workshop-costs.mjs` (new) automates the checklist's own cost spot-check against mytower.app, an independently-hosted cost-table site — 47 of 48 upgrades now cross-checked clean this way. The 1 real discrepancy found is tracked separately as OQ-38 (Wall Health). Also confirmed mytower.app has real cost data for all 4 GAP upgrades past `tower-idle-toolkit`'s ceiling — not yet pulled into this project's own data (see OQ-1-Checklist.md's Health/Health Regen/Recovery Amount/Max Recovery entries). "Max level confirmed" is unaffected — still needs real in-game confirmation per upgrade.

**OQ-38. Resolve the Wall Health cost-data discrepancy between this project and mytower.app**
As a player, I want Wall Health's coin costs to be correct, so that the buy-order algorithm doesn't over- or under-value it relative to everything else.
Found via `scripts/verify-workshop-costs.mjs` (OQ-1): at the same 3 checklist levels, mytower.app shows a noticeably different, slower-growing cost curve than this project's own `WORKSHOP_LEVELS`-derived data — Lv1: 8.20M (ours: 8.4M), Lv899: 33.73B (ours: 127.62B, ~3.8× off), Lv1799: 23.48T (ours: 108.44T, ~4.6× off). The growing ratio across levels rules out a display-rounding artifact — this is a real curve-shape difference, not a rounding one.
**Resolved which source is right:** the user provided a real in-game data point (defense discount Lab level 21, Wall Health at level 700, next 10-level purchase cost 82.29B) — mytower.app's data matches almost exactly (≈82.29B computed); this project's own data implies ≈285.46B, ~3.46× too high. mytower.app is confirmed correct; `tower-idle-toolkit`'s Wall Health data is confirmed wrong. Superseded by OQ-39 (full migration) rather than a standalone fix — see there.

**OQ-39. Source Workshop, Enhancement, and Lab data from mytower.app instead of tower-idle-toolkit**
As a maintainer, I want this project's core cost/level data to come from a source that's actually held up under scrutiny, so that bugs like OQ-38's aren't found only when a player happens to report a mismatched number.
Prompted directly by OQ-38: `tower-idle-toolkit`'s Wall Health data was confirmed wrong against real in-game data, not just stale — the "trust it, override known-bad values" model isn't holding up. mytower.app has already proven itself as an independent, spot-checked-clean source for 47 of 48 Workshop upgrades (OQ-1) and the Enhancement discount Labs (OQ-37). **Full plan:** [`OQ-39-Data-Source-Migration.md`](OQ-39-Data-Source-Migration.md) — covers the current `tower-idle-toolkit` footprint (4 data categories), a real gap (no mytower.app source found yet for Workshop upgrade-unlock groups, OQ-5 — `tower-idle-toolkit` stays a dependency for just that piece unless a replacement source turns up), the accepted precision tradeoff (mytower.app only exposes ~3-significant-figure rounded values, not exact decimals), the ~39,500-data-point extraction volume/approach, and a phased Workshop-then-Enhancement rollout. **Status: planned, not started** — waiting on a possible alternative source for the unlock-groups gap before Phase 1 begins.

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

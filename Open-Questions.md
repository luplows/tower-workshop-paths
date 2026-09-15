# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
Only `quantity` (max level) has been verified so far (OQ-13) — the actual `cash`/`coins` cost figures in `WORKSHOP_LEVELS` (from `tower-idle-toolkit`) haven't been individually spot-checked. An unverified stale cost would produce a wrong recommendation even with correct quantities, and matters more than the max-level task did. **Confirmed gap (via OQ-17):** for the 4 upgrades whose `quantity` was corrected upward past `tower-idle-toolkit`'s own belief (Health, Health Regen, Recovery Amount, Max Recovery — see OQ-13), `WORKSHOP_LEVELS` simply has no cost data past the toolkit's old, lower ceiling (its last entry there is a `coins: 0` "nothing more to buy" sentinel, not a real cost). `getPrioritizedNextUpgrades` (`src/utils/cheapestNextUpgrades.js`, OQ-2) treats that as unknown rather than a real 0-coin upgrade, but the underlying data gap itself is still unresolved. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — one entry per upgrade, to work through 1 by 1.

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

**OQ-36. Stop the scrollwheel from changing a focused number input's value**
As a player scrolling through a long list of Workshop upgrades or Enhancements, I want the mouse wheel to just scroll the page, so that scrolling while the cursor happens to be over a number input doesn't silently bump its entered level up or down.
Native browser behavior for `<input type="number">` (`UpgradeLevelInput.jsx`, shared by both the Workshop and Enhancement screens): while focused, a wheel scroll increments/decrements the value instead of scrolling the page. Easy to trigger by accident since every upgrade row is one of these inputs. Likely fix: an `onWheel` handler that blurs the input (or calls `preventDefault`) so scrolling always just scrolls, never edits.

### Lowest priority

**OQ-21. Consider forking tower-idle-toolkit to contribute corrected Workshop data back**
As a maintainer, I want to consider publishing our corrected/verified Workshop cost and max-level data back to `tower-idle-toolkit` (or a maintained fork), so that other tools built on the package — and the community generally — benefit from the corrections instead of them living only in this repo's overrides.
Not urgent. Depends on OQ-1 and OQ-13's corrections actually being thorough and trustworthy first — no point publishing back data we haven't verified ourselves. Open question: fork and maintain independently, or contribute upstream via PR to the original package?

**OQ-37. Apply an Enhancement discount Lab's savings to Enhancement costs, once its data is sourced**
As a player who has leveled up an Enhancement discount Lab, I want the buy-order algorithm to reflect my actual discounted Enhancement costs, the same way OQ-4 now does for Workshop upgrades.
Blocked on missing data, not on design: confirmed via `tower-idle-toolkit`'s full `LabValues` key list that no Enhancement-related discount Lab exists there at all (only `Workshop Attack/Defense/Utility Discount`, which OQ-4 covers, and `Labs Coin Discount`, an unrelated Lab that discounts Lab costs themselves). Whether such a Lab exists in-game and, if so, its per-level values are unresearched — no data source this project currently uses has them. If/when sourced, the implementation should mirror OQ-4's shape closely (a per-tree or global input, a discount multiplier applied only to Enhancement costs, never Workshop ones) rather than reusing `workshopDiscountMultiplier` itself, per the same source-scoping discipline OQ-4 was built with.

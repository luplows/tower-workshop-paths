# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
Only `quantity` (max level) has been verified so far (OQ-13) — the actual `cash`/`coins` cost figures in `WORKSHOP_LEVELS` (from `tower-idle-toolkit`) haven't been individually spot-checked. An unverified stale cost would produce a wrong recommendation even with correct quantities, and matters more than the max-level task did. **Confirmed gap (via OQ-17):** for the 4 upgrades whose `quantity` was corrected upward past `tower-idle-toolkit`'s own belief (Health, Health Regen, Recovery Amount, Max Recovery — see OQ-13), `WORKSHOP_LEVELS` simply has no cost data past the toolkit's old, lower ceiling (its last entry there is a `coins: 0` "nothing more to buy" sentinel, not a real cost). `getCheapestNextUpgrades` (`src/utils/cheapestNextUpgrades.js`) treats that as unknown rather than a real 0-coin upgrade, but the underlying data gap itself is still unresolved. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — one entry per upgrade, to work through 1 by 1.

### Core feature

**OQ-2. Implement the core, priority-weighted buy-order algorithm**
As a player, I want the app to recommend which Workshop upgrade or Enhancement to buy next according to my priorities, so that I know how to spend my coins efficiently even when the cheapest option isn't what I value most.
The full scoring formula (ratio × relative cost) is designed and hand-verified (`Project-Outline.md`, "Core Feature: Recommended Buy Order"), and current-level input UI exists for both Workshop upgrades and Enhancements, but there's no code yet that weighs cost against a priority list — this is the tool's actual core feature and still unbuilt. **Decided: one combined ranked list across both systems, not two separate paths** — a deliberate broadening from the original Workshop-only framing, since covering a player's progress through both systems together is a core motivation for this project. Enhancement categories get their per-category ratio from OQ-3's community eHP set, anchored to Coin Bonus (Utility); every Workshop upgrade, plus the 12 Enhancement categories the eHP set doesn't rank, all share one single fixed fallback ratio of **1/128** (matching the eHP set's own lowest ranked ratio, Orb Size) against that same Coin Bonus anchor, rather than researching each individually. That approximation matters less than it sounds: most Workshop upgrades are expected to already be maxed out before Enhancements even unlock (behind the one-time "Workshop Enhancements" Lab plus the 50B+ cumulative-spend thresholds — see `Project-Outline.md`'s Workshop Enhancements section), so the two item sets rarely compete for the same buy decision in practice.

**Coin Bonus availability (the ratio base item is itself gated and capped):** Coin Bonus is Utility's 2nd category — locked until 50B cumulative Utility spend, and capped at level 300 — so the scorer needs a defined base for every pass where it isn't currently purchasable:
- **While locked:** Cash Bonus (Utility's free starter, the only category purchasable pre-unlock and the sole lever that advances cumulative Utility spend toward the 50B threshold) becomes a stand-in base — given ratio 1 (Coin Bonus's own ratio), with its cost in the formula set to the coins still needed to cross the threshold (the same `threshold - currentTreeSpend` figure `WorkshopCategoryPanel`'s locked-category note already shows, OQ-35). This makes Cash Bonus win every comparison until Coin Bonus unlocks, which is the intent — nothing else contributes to unlocking it.
- **Once maxed (level 300, no longer purchasable, a separate case from locked):** re-anchor to whichever ranked eHP item is currently purchasable, for that scoring pass only — recomputing which one that is each time, rather than a fixed substitute.

OQ-17 (extended to Enhancements by OQ-29) is a first, priority-free cut across both systems (cheapest cost only); OQ-4 (discounts) is a refinement on top of this one once it exists — unlock gating for both systems (OQ-5/OQ-6) is already done. Unblocked now that OQ-3 (priority data) is resolved; makes most sense once OQ-1 (trustworthy Workshop costs) is also in reasonable shape.

### Refinements on OQ-2

**OQ-4. Apply Workshop discount-lab savings to costs**
As a player who has leveled up my Workshop discount labs, I want the buy-order algorithm (and any displayed cost) to reflect my actual discounted price, so that recommendations aren't based on full price.
Confirmed in `tower-idle-toolkit`: three per-category Labs — `Workshop Attack Discount`, `Workshop Defense Discount`, `Workshop Utility Discount` — each level 0-99, giving 0.5% off that category's Workshop costs per level (up to 49.5% at max), via `LabValues['Workshop Attack Discount'](level)` etc. Needs: (1) a new input for the user's current level in each of the 3 discount labs, (2) applying the resulting discount everywhere a Workshop cost is used or shown. No equivalent "Enhancement Discount" lab exists in this data source (see OQ-6).

### Depends on the above being mature

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. Blocked on OQ-2; since a from-zero simulation can't defer decisions the way manual level entry currently does, it also forces resolution of OQ-4 first (OQ-5, OQ-6, and OQ-7 are already done).

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
Client-only, per `Project-Outline.md`'s no-backend scope: likely encode `workshopLevels`/`enhancementLevels` into the URL itself (query string or fragment, probably compressed given ~48 Workshop + 18 Enhancement values) rather than a server-hosted share. Open questions: does opening a shared link overwrite the recipient's own entered levels (interacting with OQ-22's Clear/confirmation pattern) or show a separate read-only view; how large the resulting link gets and whether that's practical to share (e.g. via text message); and whether this should wait until there's more worth sharing (a priority-weighted Path from OQ-2) or is useful today with just raw levels.

**OQ-36. Stop the scrollwheel from changing a focused number input's value**
As a player scrolling through a long list of Workshop upgrades or Enhancements, I want the mouse wheel to just scroll the page, so that scrolling while the cursor happens to be over a number input doesn't silently bump its entered level up or down.
Native browser behavior for `<input type="number">` (`UpgradeLevelInput.jsx`, shared by both the Workshop and Enhancement screens): while focused, a wheel scroll increments/decrements the value instead of scrolling the page. Easy to trigger by accident since every upgrade row is one of these inputs. Likely fix: an `onWheel` handler that blurs the input (or calls `preventDefault`) so scrolling always just scrolls, never edits.

### Lowest priority

**OQ-21. Consider forking tower-idle-toolkit to contribute corrected Workshop data back**
As a maintainer, I want to consider publishing our corrected/verified Workshop cost and max-level data back to `tower-idle-toolkit` (or a maintained fork), so that other tools built on the package — and the community generally — benefit from the corrections instead of them living only in this repo's overrides.
Not urgent. Depends on OQ-1 and OQ-13's corrections actually being thorough and trustworthy first — no point publishing back data we haven't verified ourselves. Open question: fork and maintain independently, or contribute upstream via PR to the original package?

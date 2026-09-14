# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story completes and moves to the Completed section below — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Do next

**OQ-20. Add Path test coverage for realistic, non-empty starting levels**
As a maintainer, I want test coverage that reflects an actual player's Workshop state, so that a bug specific to mid- or late-game levels doesn't slip through tests that only ever start from empty.
`cheapestNextUpgrades.test.js` currently only exercises two shapes: everything at level 0 (the default/tie-break tests), and single-upgrade isolation fixtures (every other upgrade maxed out) built for OQ-19's repeat/rowCap/mid-simulation-discovery tests. Nothing tests a realistic *mixed* state — many upgrades simultaneously at varied non-zero levels, the way `workshopLevels` would actually look for someone who's been playing a while. Useful scenarios: (1) a representative mid-game snapshot (a handful of upgrades noticeably ahead of the rest) confirming the ranked list stays cost-ascending and sane; (2) multiple upgrades simultaneously past their cost-data ceiling at once (today's tests only ever put one, Health, in that state) to make sure they don't interfere with each other's `unknownCost` reporting; (3) a late-game snapshot where most/all upgrades are already high-level, so remaining next-costs are all large, confirming no off-by-one or infinite-loop-style bug once the cheap early tiers are gone.

**OQ-7. Implement batch buying**
As a player, I want the recommended buy order to reflect how I actually purchase in-game (multiple levels at once), so that the steps match real button presses.
**Not just presentation — this changes the ranking math itself.** The Path list (OQ-17/OQ-19) currently ranks by single-level cost, but for upgrades with >1000 max levels you can't actually buy just one level in-game — the real minimum purchase is a 100-level batch (10 otherwise, see `Project-Outline.md`); Enhancements are always bought 1 level at a time, not batched. That means the Path list may currently be recommending purchases cheaper than what's actually purchasable, and once batch cost (the sum of N consecutive per-level costs) replaces single-level cost, the relative ordering of what's "cheapest next" can genuinely change, not just how many levels a recommended step covers. Unresolved: how to handle a partial batch when fewer than N levels remain before max level.

**OQ-18. Let the user buy directly from the Upgrade Path list**
As a player looking at the Path screen, I want a Buy button on each row, so that buying updates my entered Workshop level without switching back to the Upgrade screen and typing it in by hand.
Builds on OQ-17's ranked list (`UpgradePath`). Buying a row should increment that upgrade's level in the same `workshopLevels` `localStorage` state the Upgrade screen reads/writes, then the list should re-rank immediately (next cheapest becomes the new top row). Best sequenced after OQ-7 lands, so the button buys a correct batch rather than needing rework once batching changes what a valid purchase is.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
Only `quantity` (max level) has been verified so far (OQ-13) — the actual `cash`/`coins` cost figures in `WORKSHOP_LEVELS` (from `tower-idle-toolkit`) haven't been individually spot-checked. An unverified stale cost would produce a wrong recommendation even with correct quantities, and matters more than the max-level task did. **Confirmed gap (via OQ-17):** for the 4 upgrades whose `quantity` was corrected upward past `tower-idle-toolkit`'s own belief (Health, Health Regen, Recovery Amount, Max Recovery — see OQ-13), `WORKSHOP_LEVELS` simply has no cost data past the toolkit's old, lower ceiling (its last entry there is a `coins: 0` "nothing more to buy" sentinel, not a real cost). `getCheapestNextUpgrades` (`src/utils/cheapestNextUpgrades.js`) treats that as unknown rather than a real 0-coin upgrade, but the underlying data gap itself is still unresolved. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — one entry per upgrade, to work through 1 by 1.

**OQ-3. Source a predefined community-recommended priority order**
As a new player, I want a sensible default spend-priority list, so that I don't have to build one from scratch before the tool is useful.
Nothing researched yet; a goal noted in `Project-Outline.md`'s "Priorities" section. OQ-2 needs this to be usable at all, but it's pure research/no code dependency, so it can happen in parallel with anything else.

### Core feature

**OQ-2. Implement the core, priority-weighted buy-order algorithm**
As a player, I want the app to recommend which Workshop upgrade to buy next according to my priorities, so that I know how to spend my coins efficiently even when the cheapest option isn't what I value most.
The full scoring formula (ratio × relative cost) is designed and hand-verified (`Project-Outline.md`, "Core Feature: Recommended Buy Order"), and current-level input UI exists for both Workshop upgrades and Enhancements, but there's no code yet that weighs cost against a priority list — this is the tool's actual core feature and still unbuilt. OQ-17 is a first, priority-free cut (cheapest cost only); OQ-4/OQ-5/OQ-6 (discounts, unlock gates, Enhancement gating) are refinements on top of this one once it exists. Makes most sense once OQ-1 (trustworthy costs) and OQ-3 (a priority list to weigh against) are in reasonable shape.

### Refinements on OQ-2

**OQ-4. Apply Workshop discount-lab savings to costs**
As a player who has leveled up my Workshop discount labs, I want the buy-order algorithm (and any displayed cost) to reflect my actual discounted price, so that recommendations aren't based on full price.
Confirmed in `tower-idle-toolkit`: three per-category Labs — `Workshop Attack Discount`, `Workshop Defense Discount`, `Workshop Utility Discount` — each level 0-99, giving 0.5% off that category's Workshop costs per level (up to 49.5% at max), via `LabValues['Workshop Attack Discount'](level)` etc. Needs: (1) a new input for the user's current level in each of the 3 discount labs, (2) applying the resulting discount everywhere a Workshop cost is used or shown. No equivalent "Enhancement Discount" lab exists in this data source (see OQ-6).

**OQ-5. Respect Workshop upgrade-unlock gates**
As a player who hasn't unlocked every Workshop upgrade group yet, I want the buy-order algorithm to skip upgrades I can't buy, so that it never recommends something unavailable to me.
Confirmed in `tower-idle-toolkit`: `ATTACK_UNLOCKS` / `DEFENSE_UNLOCKS` / `UTILITY_UNLOCKS`, each an ordered list of `{ name, cost, upgrades[] }` groups (a free "Default" group, then paid groups that gate specific upgrades behind a one-time coin cost — e.g. Utility's "Upgrade Chances" group costs 800 coins to unlock the three "Free X Upgrade" upgrades). Needs: (1) a way for the user to mark which unlock groups they've already purchased, (2) excluding not-yet-unlocked upgrades from the algorithm. Open design question: should purchasing an unlock itself compete as a priced item in the buy order, or be a separate, manual, one-off step outside the algorithm?

**OQ-6. Implement Enhancement tree and Lab gating**
As a player, I want the buy-order algorithm to know which Enhancement categories I can currently afford to unlock, so that it doesn't recommend one I haven't reached yet.
Unlike Workshop's one-time unlock purchases, an Enhancement category unlocks once *cumulative coins spent on that tree's other enhancements* crosses a threshold (50B → 500B → 5T → 50T → 500T — see `Project-Outline.md`). Needs the algorithm to track running per-tree Enhancement spend, not just current levels. The whole Enhancement system must also be treated as locked until the one-time "Workshop Enhancements" Lab is completed — there's no input for that Lab yet, and its coin cost is still unknown (along with the per-level values of the parallel "Enhancements Discount" Lab), per the community sheet.

### Depends on the above being mature

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. Blocked on OQ-2; since a from-zero simulation can't defer decisions the way manual level entry currently does, it also forces resolution of OQ-4, OQ-5, OQ-6, and OQ-7 first.

### Anytime — no dependencies

**OQ-9. Verify the UI on a real mobile device**
As a player who checks this tool while actually playing on my phone, I want the phone-mimicking layout to work correctly on a real touch device, so that it's usable in the situation it's designed for.
Only checked in a desktop browser at a fixed width so far.

**OQ-12. Reduce production bundle size**
As a maintainer, I want the shipped JS bundle to only include what the app uses, so that load time doesn't suffer as real usage grows.
Currently ~2.4MB minified, mostly `tower-idle-toolkit`'s bundled game data (labs, cards, bots, etc. we don't use). Worth revisiting with code-splitting or a narrower import once the app has more real usage to justify the effort. Not currently blocking anything.

### Lowest priority

**OQ-21. Consider forking tower-idle-toolkit to contribute corrected Workshop data back**
As a maintainer, I want to consider publishing our corrected/verified Workshop cost and max-level data back to `tower-idle-toolkit` (or a maintained fork), so that other tools built on the package — and the community generally — benefit from the corrections instead of them living only in this repo's overrides.
Not urgent. Depends on OQ-1 and OQ-13's corrections actually being thorough and trustworthy first — no point publishing back data we haven't verified ourselves. Open question: fork and maintain independently, or contribute upstream via PR to the original package?

---

## Completed

**OQ-10. Add a title/header to the screen**
As a player, I want the app to show what it is, so that it doesn't open on an unlabeled screen.
`App.jsx` now renders a header above the mode tab bar with the app's title, "Workshop Input" (`.app__header`/`.app__title` in `App.css`).

**OQ-11. Color category tabs to match their in-game trees**
As a player familiar with the game's own color-coding, I want the Attack/Defense/Utility tabs colored the way they are in-game, so that I can navigate by color the way I already do in the game.
The active category tab (`BottomTabBar`, shared by both the Upgrade and Enhance screens) is colored per tree — Attack blue, Defense red, Utility a readable gold/yellow — via `--tree-attack`/`--tree-defense`/`--tree-utility` CSS variables (`index.css`) and a per-category `bottom-tab-bar__tab--<id>` class (`WorkshopInputs.css`). The active tab's screen (`category-panel--<id>`) and the active tab button itself both get a light background tint of the same color (`--tree-*-bg`), so the coloring carries from the tab down into the screen behind it. Inactive tabs stay neutral.

**OQ-13. Confirm Workshop upgrade max levels for the current patch**
As a player, I want the max level shown/enforced for each Workshop upgrade to match the current patch, so that `UpgradeLevelInput`'s hard cap never blocks a valid entry or accepts an invalid one.
`tower-idle-toolkit`'s `quantity` values for the ~40 Workshop upgrades are accepted as correct for the current patch. Five were confirmed to differ from the toolkit's shipped defaults and are corrected via `WORKSHOP_QUANTITY_OVERRIDES` (`src/data/workshopQuantityOverrides.js`) rather than editing the third-party package: Rend Armor Chance (299), Health (6000), Health Regen (6000), Recovery Amount (300), Max Recovery (500). A Vitest snapshot test (`workshopCategories.test.js`) guards against upstream structural drift — a `tower-idle-toolkit` update that silently adds/removes/reorders an upgrade or changes a quantity fails CI with a reviewable diff instead of passing unnoticed; updating the snapshot (`vitest -u`) should always be a deliberate, reviewed choice.

**OQ-14. Add the Workshop Enhancements input screen**
As a player, I want to enter my current level in every Workshop Enhancement category, the same way I do for base Workshop upgrades, so that Enhancements can eventually feed into the buy-order algorithm too.
A top-of-screen "Upgrade"/"Enhance" mode tab bar (matching the in-game button labels, `ModeTabBar`) switches between the existing Workshop upgrade screen and an Enhancements screen (`EnhancementInputs`, `src/data/enhancementCategories.js`), sharing the same three-tree tab layout (bottom tabs read just "Attack"/"Defense"/"Utility" on both screens) and per-item level input, persisted separately (`enhancementLevels` in `localStorage`, distinct from `workshopLevels` since several category names overlap, e.g. "Damage", "Health"). The 18 categories, their unlock-threshold values (`unlocksAt`, used by OQ-6), and their max level (`quantity`) are hard-coded in `enhancementCategories.js` from the community Google Sheet's Master Sheet tab (column W, "Max level") since `tower-idle-toolkit` has none of this data — these max levels are accepted as correct for the current patch, the same as OQ-13's Workshop values. Levels are hard-capped at `quantity` the same way Workshop upgrades are. Since there's no in-game way to see an Enhancement's current *level* (only its resulting value), the screen also shows a computed value (`src/utils/enhancementValue.js`, `value = (level × 0.01) + 1`, e.g. "1.40×") next to each level input, letting the user cross-check their entry against what they see in-game; Workshop upgrades intentionally show no such value, since too many other multipliers apply there for a raw computed value to be meaningful. A Vitest snapshot test (`enhancementCategories.test.js`, mirroring OQ-13's) guards this hand-transcribed data the same way.

**OQ-15. Fix spurious `.snap` file "modified" status on Windows**
As a maintainer, I want `git status` to only show real changes, so that a false positive doesn't get mistaken for actual snapshot drift or mask a real one.
`core.autocrlf=true` with no `.gitattributes` previously let `src/data/__snapshots__/workshopCategories.test.js.snap` show up as locally modified with zero actual content difference — a Windows line-ending stat-cache quirk. Fixed with a repo-root `.gitattributes` (`* text=auto eol=lf`), pinning line endings for all text files regardless of platform/`core.autocrlf`; confirmed via `git add --renormalize .` producing no changes and the snapshot file no longer showing as modified.

**OQ-16. Persist the selected category tab across mode switches**
As a player switching between Upgrade and Enhance, I want the app to remember which tree tab (Attack/Defense/Utility) I had open, so that I don't land back on Attack every time I switch modes.
Resolved as shared: one tree tab app-wide, not tracked independently per screen. `activeCategoryId` moved out of `CategoryLevelInputs`'s own state and up into `App.jsx`, persisted via `localStorage` (`activeCategoryId` key) the same way `workshopMode` already was, and passed down as a controlled prop through `WorkshopInputs`/`EnhancementInputs` to `CategoryLevelInputs`. Switching Upgrade → Enhance (or back) now keeps the same tree selected, and it survives a reload too.

**OQ-17. Show the cheapest next Workshop upgrade as a ranked list (Upgrade Path page)**
As a player, I want a page that tells me the single cheapest thing to buy next, so that I have a starting recommendation before the full priority-weighted algorithm (OQ-2) exists.
A new "Path" section renders `UpgradePath`, which ranks every not-yet-maxed Workshop upgrade purely by the coin cost of its next single level, cheapest first — no priority ratios, per the user's explicit "for now, just focus on lowest cost" scope. Deliberately **not** a third entry in `ModeTabBar` alongside Upgrade/Enhance: that toggle mirrors the game's own buttons, and there's no "Path" screen in-game, so Path lives behind its own top-level `AppSectionTabs` control ("Input" vs "Path") in the header, and `ModeTabBar`'s Upgrade/Enhance toggle only renders within the "Input" section. The pure ranking logic (`getCheapestNextUpgrades`, `src/utils/cheapestNextUpgrades.js`) reads current levels from the same `workshopLevels` `localStorage` key the Upgrade screen uses, and is unit-tested independently of the UI. Upgrades whose current level has no valid cost data (see OQ-1's new finding) are listed separately as "cost data unavailable" rather than silently omitted or mis-ranked. Enhancements are out of scope for this page — it's specifically the *Upgrade* path. Next per the user: OQ-18 (buy directly from this list), then folding in priorities (OQ-2).

**OQ-19. Let the Path list include the same upgrade multiple times**
As a player, I want the Path list to show an upgrade's 2nd, 3rd, etc. next levels too when they're still cheaper than other upgrades' first next level, so that the ranking reflects the true cheapest sequence of purchases, not just each upgrade's single next step.
`getCheapestNextUpgrades` (OQ-17) now simulates a full buy-out step by step — at each step, "buying" whichever not-yet-maxed upgrade currently has the cheapest next single level, then re-evaluating with that upgrade's level advanced by one (a simulation for ranking purposes only; it never touches the caller's actual entered levels) — rather than only ever considering each upgrade's first next level once. Capped at 50 total rows (`DEFAULT_ROW_CAP`, overridable via a `rowCap` option) since simulating every remaining level of every upgrade would be both enormous and not useful this far ahead; a firmer answer to "how many to buy at once" belongs to OQ-7 (batch buying), which this doesn't attempt. `unknownCost` (see OQ-1) now also catches an upgrade that starts out fine but hits its cost-data ceiling only after some simulated purchases, not just one whose *currently entered* level is already past it — reported once, at the level it got stuck. Caught by testing: `UpgradePath`'s list rows were keyed by upgrade name alone (`key={entry.name}`), which silently breaks once the same name can appear more than once — fixed to key by name + level.

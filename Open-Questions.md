# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story completes and moves to the Completed section below — so a number always points to the same story.

## Outstanding

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
Only `quantity` (max level) has been verified so far (OQ-13) — the actual `cash`/`coins` cost figures in `WORKSHOP_LEVELS` (from `tower-idle-toolkit`) haven't been individually spot-checked. An unverified stale cost would produce a wrong recommendation even with correct quantities, and matters more than the max-level task did.

**OQ-2. Implement the core buy-order algorithm**
As a player, I want the app to recommend which Workshop upgrade to buy next, so that I know how to spend my coins efficiently.
The scoring formula is designed and hand-verified (`Project-Outline.md`, "Core Feature: Recommended Buy Order"), and current-level input UI exists for both Workshop upgrades and Enhancements, but there's no code yet that actually computes a recommended buy order from those levels + costs + priorities. This is the tool's core feature and still unbuilt — OQ-4, OQ-5, OQ-6, and OQ-7 are really refinements of this one.

**OQ-3. Source a predefined community-recommended priority order**
As a new player, I want a sensible default spend-priority list, so that I don't have to build one from scratch before the tool is useful.
Nothing researched yet; a goal noted in `Project-Outline.md`'s "Priorities" section.

**OQ-4. Apply Workshop discount-lab savings to costs**
As a player who has leveled up my Workshop discount labs, I want the buy-order algorithm (and any displayed cost) to reflect my actual discounted price, so that recommendations aren't based on full price.
Confirmed in `tower-idle-toolkit`: three per-category Labs — `Workshop Attack Discount`, `Workshop Defense Discount`, `Workshop Utility Discount` — each level 0-99, giving 0.5% off that category's Workshop costs per level (up to 49.5% at max), via `LabValues['Workshop Attack Discount'](level)` etc. Needs: (1) a new input for the user's current level in each of the 3 discount labs, (2) applying the resulting discount everywhere a Workshop cost is used or shown. No equivalent "Enhancement Discount" lab exists in this data source (see OQ-6).

**OQ-5. Respect Workshop upgrade-unlock gates**
As a player who hasn't unlocked every Workshop upgrade group yet, I want the buy-order algorithm to skip upgrades I can't buy, so that it never recommends something unavailable to me.
Confirmed in `tower-idle-toolkit`: `ATTACK_UNLOCKS` / `DEFENSE_UNLOCKS` / `UTILITY_UNLOCKS`, each an ordered list of `{ name, cost, upgrades[] }` groups (a free "Default" group, then paid groups that gate specific upgrades behind a one-time coin cost — e.g. Utility's "Upgrade Chances" group costs 800 coins to unlock the three "Free X Upgrade" upgrades). Needs: (1) a way for the user to mark which unlock groups they've already purchased, (2) excluding not-yet-unlocked upgrades from the algorithm. Open design question: should purchasing an unlock itself compete as a priced item in the buy order, or be a separate, manual, one-off step outside the algorithm?

**OQ-6. Implement Enhancement tree and Lab gating**
As a player, I want the buy-order algorithm to know which Enhancement categories I can currently afford to unlock, so that it doesn't recommend one I haven't reached yet.
Unlike Workshop's one-time unlock purchases, an Enhancement category unlocks once *cumulative coins spent on that tree's other enhancements* crosses a threshold (50B → 500B → 5T → 50T → 500T — see `Project-Outline.md`). Needs the algorithm to track running per-tree Enhancement spend, not just current levels. The whole Enhancement system must also be treated as locked until the one-time "Workshop Enhancements" Lab is completed — there's no input for that Lab yet, and its coin cost is still unknown (along with the per-level values of the parallel "Enhancements Discount" Lab), per the community sheet.

**OQ-7. Implement batch buying**
As a player, I want the recommended buy order to reflect how I actually purchase in-game (multiple levels at once), so that the steps match real button presses.
The buy order should recommend Workshop upgrade purchases in batches (100 levels at a time for anything with >1000 max levels, 10 otherwise — see `Project-Outline.md`); Enhancements are always bought 1 level at a time, not batched. Unresolved: how the score formula's "next cost" should be computed for a batch (sum of N consecutive per-level costs rather than a single level's cost); how to handle a partial batch when fewer than N levels remain before max level.

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. Blocked on OQ-2; since a from-zero simulation can't defer decisions the way manual level entry currently does, it also forces resolution of OQ-4, OQ-5, OQ-6, and OQ-7 first.

**OQ-9. Verify the UI on a real mobile device**
As a player who checks this tool while actually playing on my phone, I want the phone-mimicking layout to work correctly on a real touch device, so that it's usable in the situation it's designed for.
Only checked in a desktop browser at a fixed width so far.

**OQ-12. Reduce production bundle size**
As a maintainer, I want the shipped JS bundle to only include what the app uses, so that load time doesn't suffer as real usage grows.
Currently ~2.4MB minified, mostly `tower-idle-toolkit`'s bundled game data (labs, cards, bots, etc. we don't use). Worth revisiting with code-splitting or a narrower import once the app has more real usage to justify the effort. Not currently blocking anything.

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

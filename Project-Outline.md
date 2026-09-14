# Project Outline

## Goal
A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense* — across both base Workshop upgrades and Workshop Enhancements. Given the player's current levels in each, it recommends a single combined buy order based on cost efficiency and spend priorities.

## Scope
- A feature of the existing React + Vite app in this repo (not a separate app/script).
- Client-only: no backend. All user data (current upgrade levels, custom priority lists) persists in browser `localStorage`.

## Inputs
- Current level of each Workshop upgrade, e.g. `Health: 5500 / max 6000`, `Thorn Damage: 99 / max 99`.
- Cost-per-level data for each upgrade, looked up from a table (not computed from a formula) — sourced from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package (ISC license), added as a dependency. It provides per-level `value`/`cash`/`coins` for every upgrade (`WORKSHOP_LEVELS`) plus per-upgrade metadata (`name`, `min`, `max`, `quantity`, total `cost`).
- The user's current level (0-99) in each of the three per-category **Workshop discount Labs** (Attack/Defense/Utility), each worth 0.5%/level off that category's Workshop costs (up to 49.5% at max level) — see `Open-Questions.md` OQ-4.
- Which **upgrade-unlock groups** the user has already purchased in each category — some upgrades are gated behind a one-time coin cost to unlock (e.g. Utility's "Upgrade Chances" group), and a tree's groups unlock in a fixed order (e.g. Defense's "Thorn Upgrades" can't be bought before "Defense Upgrades"), not independently. Implemented (`Open-Questions.md` OQ-5): a not-yet-purchased group's upgrades are excluded from the Path list and the Upgrade input screen alike, with only the earliest not-yet-purchased group in each tree ever offered as a candidate (its own unlock cost, as a Path candidate instead of a separate manual step) — every later group stays fully excluded until its own turn.

## Workshop Enhancements
A second spend track per tree (Attack/Defense/Utility), mechanically distinct from the base Workshop upgrades above — its own currency-threshold-gated unlocks, see below — though both feed into the same combined buy order (see "Core Feature: Recommended Buy Order"). Each tree has 6 Enhancement categories: one free from the start, and five more gated by **cumulative coins spent on that tree's own enhancements** (not a one-time unlock purchase) — the same threshold progression in every tree: 50B → 500B → 5T → 50T → 500T.

| Tree | Free starter | Unlocks at 50B | 500B | 5T | 50T | 500T |
|---|---|---|---|---|---|---|
| Attack | Damage | Rend Armor | Critical Factor | Damage/Meter | Super Crit Mult | Attack Speed |
| Defense | Health | Health Regen | Defense Absolute | Land Mine Damage | Wall Health | Orb Size |
| Utility | Cash Bonus | Coin Bonus | Cells/Kill Bonus | Free Upgrades | Recovery Package | Enemy Level Skip |

The whole Enhancement system is itself gated behind a one-time **"Workshop Enhancements" Lab** (binary, level 0 or 1, costing a flat **5B coins**) — until that Lab is completed, no Enhancement is purchasable at all. Modeled in the cost-only Path list as its own candidate (OQ-31) and enforced on the Enhance input screen itself as an unlock prompt in place of the usual tree tabs/inputs (OQ-32). The per-tree threshold gate above is implemented the same way in both places (`Open-Questions.md` OQ-6): computed from cumulative coins already spent in a tree (derivable from currently entered levels, via `enhancementTreeSpend.js`, since Enhancement per-level costs are exact), not tracked as a separate running total.

Every category, in every tree, uses the same value formula: `value = (level × 0.01) + 1` — e.g. level 40 gives a 1.40× multiplier. Confirmed via the community sheet's "Value" column formula (`=SUM((level_cell*0.01)+1)`) and identical across all 18 categories. Unlike Workshop upgrades, no other in-game modifier stacks with it (as of the current patch), so the app computes and displays it directly from the entered level rather than requiring a separate value input.

Data source: a community Google Sheet (see `README.md` for credit), specifically its "Workshop Enhancement Prices" tab — a full per-level cost table for all 18 categories, transcribed into `src/data/enhancementLevels.js` (OQ-29) — and its "Master Sheet" tab, which lists the per-tree unlock thresholds above, the value formula, and each category's max level (column W). `tower-idle-toolkit` has none of this data. The Prices tab only has its own condensed display values (e.g. "5.04 B"), not exact backend numbers, so transcribed costs carry roughly 3 significant figures rather than Workshop's exact-to-the-coin precision. One value is still unknown (see `Open-Questions.md`): the per-level values of the parallel "Enhancements Discount" Lab. (The "Workshop Enhancements" Lab's own cost, 5B coins, is now confirmed — see above.)

## Core Feature: Recommended Buy Order
One ranked buy order spans both Workshop upgrades and Enhancements, not two separate recommendations. Each item in the priority list has a **ratio** relative to a base item (e.g. Coins = 1, Cells = 1/1, Regen = 1/2, Health = 1/4): the 6 Enhancement categories in the shipped default set are individually ratio'd (`Open-Questions.md` OQ-3's eHP set, anchored to Coin Bonus), while every Workshop upgrade, plus the 12 Enhancement categories that set doesn't rank, all share one single fixed fallback ratio of 1/128 against that same base (see `Open-Questions.md` OQ-2 for the base item's own availability edge cases — it's itself gated and eventually caps out). At each step, every not-yet-maxed, unlocked item gets a score, using its discount-adjusted cost:

```
score = ratio × (base item's next cost ÷ this item's next cost)
```

Buy whichever available item has the highest score. Ties are broken by priority order (the higher-priority item wins). Recompute after every purchase, since costs and availability change. Maxed-out and not-yet-unlocked items drop out of consideration.

Workshop upgrades are bought in batches, not single levels — the game doesn't require this, but the buy order is always expressed this way for practicality: **100 levels at a time** for an upgrade with more than 1000 max levels, **10 at a time** for one with at least 10, or **1 at a time** for one with fewer max levels than that (Multishot Targets, Bounce Shot Targets, Orbs). A batch shrinks to whatever's left when fewer than a full batch remain before max level; if cost data is missing anywhere within a batch, the whole batch is refused rather than priced partially (see `Open-Questions.md` OQ-1). Implemented for the cost-only Path list (OQ-7); not yet applied to this priority-weighted algorithm. Enhancements are always bought **1 level at a time** — implemented the same way, in the same Path list (OQ-29).

Worked example — priority list Coins (base) > Cells (1/1) > Regen (1/2) > Health (1/4), with next-level costs Coins: 1000/2000/3000, Cells: 1000/1500/2000, Regen: 250/500/750/1000, Health: 250/500/750/1000 (millions) — produces the buy order: **Regen, Coins, Cells, Regen, Health, Cells**.

## Priorities
- **Predefined**: ship with a community-recommended default priority order to start.
- **User-defined**: let users define, edit, and save their own custom priority lists (longer-term goal).

## Non-Goals (for now)
- No backend or server component.
- No cross-device sync — data lives in a single browser's `localStorage`.

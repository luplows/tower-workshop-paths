# Project Outline

## Goal
A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it recommends a buy order based on cost efficiency and spend priorities.

## Scope
- A feature of the existing React + Vite app in this repo (not a separate app/script).
- Client-only: no backend. All user data (current upgrade levels, custom priority lists) persists in browser `localStorage`.

## Inputs
- Current level of each Workshop upgrade, e.g. `Health: 5500 / max 6000`, `Thorn Damage: 99 / max 99`.
- Cost-per-level data for each upgrade, looked up from a table (not computed from a formula) — sourced from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package (ISC license), added as a dependency. It provides per-level `value`/`cash`/`coins` for every upgrade (`WORKSHOP_LEVELS`) plus per-upgrade metadata (`name`, `min`, `max`, `quantity`, total `cost`).
- The user's current level (0-99) in each of the three per-category **Workshop discount Labs** (Attack/Defense/Utility), each worth 0.5%/level off that category's Workshop costs (up to 49.5% at max level). Design/implementation not yet started — see `Open-Questions.md`.
- Which **upgrade-unlock groups** the user has already purchased in each category — some upgrades are gated behind a one-time coin cost to unlock (e.g. Utility's "Upgrade Chances" group). Design/implementation not yet started — see `Open-Questions.md`.

## Workshop Enhancements
A second spend track per tree (Attack/Defense/Utility), distinct from the base Workshop upgrades above in mechanics (its own currency-threshold-gated unlocks — see below). The recommended buy order (OQ-2) is intended to combine both into one ranked path rather than keeping them as separate recommendations, since covering a player's progress through both systems together is a core goal of this project. Each tree has 6 Enhancement categories: one free from the start, and five more gated by **cumulative coins spent on that tree's own enhancements** (not a one-time unlock purchase) — the same threshold progression in every tree: 50B → 500B → 5T → 50T → 500T.

| Tree | Free starter | Unlocks at 50B | 500B | 5T | 50T | 500T |
|---|---|---|---|---|---|---|
| Attack | Damage | Rend Armor | Critical Factor | Damage/Meter | Super Crit Mult | Attack Speed |
| Defense | Health | Health Regen | Defense Absolute | Land Mine Damage | Wall Health | Orb Size |
| Utility | Cash Bonus | Coin Bonus | Cells/Kill Bonus | Free Upgrades | Recovery Package | Enemy Level Skip |

The whole Enhancement system is itself gated behind a one-time **"Workshop Enhancements" Lab** (binary, level 0 or 1) — until that Lab is completed, no Enhancement is purchasable at all.

Every category, in every tree, uses the same value formula: `value = (level × 0.01) + 1` — e.g. level 40 gives a 1.40× multiplier. Confirmed via the community sheet's "Value" column formula (`=SUM((level_cell*0.01)+1)`) and identical across all 18 categories. Unlike Workshop upgrades, no other in-game modifier stacks with it (as of the current patch), so the app computes and displays it directly from the entered level rather than requiring a separate value input.

Data source: a community Google Sheet (a personal "IDS" working copy, shared by the user), specifically its "Workshop Enhancement Prices" tab — a full per-level cost table for all 18 categories — and its "Master Sheet" tab, which lists the per-tree unlock thresholds above, the value formula, and each category's max level (column W). `tower-idle-toolkit` has none of this data. Two values are still unknown (see `Open-Questions.md`): the cost of the "Workshop Enhancements" Lab, and the per-level values of the parallel "Enhancements Discount" Lab.

## Core Feature: Recommended Buy Order
Each item in the priority list has a **ratio** relative to a base upgrade (e.g. Coins = 1, Cells = 1/1, Regen = 1/2, Health = 1/4). At each step, every not-yet-maxed, unlocked upgrade gets a score, using its discount-adjusted cost:

```
score = ratio × (base upgrade's next cost ÷ this item's next cost)
```

Buy whichever available upgrade has the highest score. Ties are broken by priority order (the higher-priority item wins). Recompute after every purchase, since costs and availability change. Maxed-out and not-yet-unlocked upgrades drop out of consideration.

The game lets you buy multiple levels of a Workshop upgrade in one purchase, and the buy order should be based on these batches rather than single levels: **100 levels at a time** for anything with more than 1000 max levels, **10 at a time** otherwise. This applies to Workshop upgrades only — Enhancements are always bought **1 level at a time** for the purposes of the buy algorithm. Design details (batch cost lookup, partial batches near max level, exact algorithm changes) not yet worked out — see `Open-Questions.md`.

Worked example — priority list Coins (base) > Cells (1/1) > Regen (1/2) > Health (1/4), with next-level costs Coins: 1000/2000/3000, Cells: 1000/1500/2000, Regen: 250/500/750/1000, Health: 250/500/750/1000 (millions) — produces the buy order: **Regen, Coins, Cells, Regen, Health, Cells**.

## Priorities
- **Predefined**: ship with a community-recommended default priority order to start.
- **User-defined**: let users define, edit, and save their own custom priority lists (longer-term goal).

## Non-Goals (for now)
- No backend or server component.
- No cross-device sync — data lives in a single browser's `localStorage`.

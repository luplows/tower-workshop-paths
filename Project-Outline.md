# Project Outline

## Goal
A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it recommends a buy order based on cost efficiency and spend priorities.

## Scope
- A feature of the existing React + Vite app in this repo (not a separate app/script).
- Client-only: no backend. All user data (current upgrade levels, custom priority lists) persists in browser `localStorage`.

## Inputs
- Current level of each Workshop upgrade, e.g. `Health: 5500 / max 6000`, `Thorn Damage: 99 / max 99`.
- Cost-per-level data for each upgrade, looked up from a table (not computed from a formula) — sourced from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package (ISC license), added as a dependency. It provides per-level `value`/`cash`/`coins` for every upgrade (`WORKSHOP_LEVELS`) plus per-upgrade metadata (`name`, `min`, `max`, `quantity`, total `cost`). **Caveat:** the package hasn't been updated since Nov 2023, so costs may be stale relative to current game balance — using it as a starting point, to be corrected against the live game/community calculator as discrepancies are found.

## Core Feature: Recommended Buy Order
Each item in the priority list has a **ratio** relative to a base upgrade (e.g. Coins = 1, Cells = 1/1, Regen = 1/2, Health = 1/4). At each step, every not-yet-maxed upgrade gets a score:

```
score = ratio × (base upgrade's next cost ÷ this item's next cost)
```

Buy whichever available upgrade has the highest score. Ties are broken by priority order (the higher-priority item wins). Recompute after every purchase, since costs and availability change. Maxed-out upgrades drop out of consideration.

Worked example — priority list Coins (base) > Cells (1/1) > Regen (1/2) > Health (1/4), with next-level costs Coins: 1000/2000/3000, Cells: 1000/1500/2000, Regen: 250/500/750/1000, Health: 250/500/750/1000 (millions) — produces the buy order: **Regen, Coins, Cells, Regen, Health, Cells**.

## Priorities
- **Predefined**: ship with a community-recommended default priority order to start.
- **User-defined**: let users define, edit, and save their own custom priority lists (longer-term goal).

## Open Questions / In Progress
- Accuracy of `tower-idle-toolkit`'s cost data against the current game version (package is ~3 years stale) — spot-check and correct as needed.
- **Task:** refresh each upgrade's `quantity` (max level) against actual in-game values. Current-level inputs are now hard-capped at `tower-idle-toolkit`'s `quantity` (`UpgradeLevelInput`, via `clampLevel`), so a stale-too-low quantity (e.g. Health is 5000 there vs. 6000 in-game) will incorrectly block valid entries until corrected.

## Non-Goals (for now)
- No backend or server component.
- No cross-device sync — data lives in a single browser's `localStorage`.

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
- Which **upgrade-unlock groups** the user has already purchased in each category — some Workshop upgrades are gated behind a one-time coin cost to unlock, and a tree's groups unlock in a fixed order rather than independently. Implemented; see `Completed-Questions.md` OQ-5 for the gating mechanics.
- Current level of each **Workshop Enhancement** category — a second, mechanically distinct spend track per tree, gated behind a one-time Lab and per-tree cumulative-spend thresholds, feeding into the same combined buy order below. Implemented; see `Completed-Questions.md` (OQ-6, OQ-14, OQ-29, OQ-31, OQ-32) for the gating mechanics and data sourcing, and `README.md` for data credit.

## Core Feature: Recommended Buy Order
One ranked buy order spans both Workshop upgrades and Enhancements, not two separate recommendations. Each item has a **ratio** relative to a base item — the shipped default priority list and its fallback value are documented in `Completed-Questions.md` (OQ-2/OQ-3). At each step, every not-yet-maxed, unlocked item gets a score, using its discount-adjusted cost:

```
score = ratio × (base item's next cost ÷ this item's next cost)
```

Buy whichever available item has the highest score. Ties are broken by priority order. Recompute after every purchase, since costs and availability change. Maxed-out and not-yet-unlocked items drop out of consideration.

Workshop upgrades are bought in batches, not single levels — the game doesn't require this, but the buy order is always expressed this way for practicality: **100 at a time** above 1000 max levels, **10 at a time** above 10, or **1 at a time** below that. A batch shrinks to whatever's left near max level; if cost data is missing anywhere within it, the whole batch is refused rather than priced partially (see `Open-Questions.md` OQ-1). Enhancements are always bought **1 level at a time**.

## Priorities
- **Predefined**: ship with a community-recommended default priority order to start.
- **User-defined**: let users define, edit, and save their own custom priority lists (longer-term goal).

## Non-Goals (for now)
- No backend or server component.
- No cross-device sync — data lives in a single browser's `localStorage`.

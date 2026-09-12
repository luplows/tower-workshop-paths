# Project Outline

## Goal
A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it recommends a buy order based on cost efficiency and spend priorities.

## Scope
- A feature of the existing React + Vite app in this repo (not a separate app/script).
- Client-only: no backend. All user data (current upgrade levels, custom priority lists) persists in browser `localStorage`.

## Inputs
- Current level of each Workshop upgrade, e.g. `Health: 5500 / max 6000`, `Thorn Damage: 99 / max 99`.
- Cost-per-level data for each upgrade, looked up from a table (not computed from a formula) — sourced from community-maintained data (wiki/spreadsheet). Source still to be identified.

## Core Feature: Recommended Buy Order
Given current levels and a priority ordering of upgrades, compute a recommended next purchase (or ordered list of purchases):
- Priority-based buying with a cost-ratio override rule — the general idea is to normally buy toward the top-priority upgrade, but skip to a cheaper, lower-priority upgrade when the top choice is disproportionately expensive (e.g. involving a "cost > 4x next priority" style threshold). **Exact algorithm still being defined.**
- Maxed-out upgrades drop out of consideration.

## Priorities
- **Predefined**: ship with a community-recommended default priority order to start.
- **User-defined**: let users define, edit, and save their own custom priority lists (longer-term goal).

## Open Questions / In Progress
- Exact buy-order algorithm and cost-ratio rule logic.
- Source for Workshop upgrade cost-per-level tables (searching for a community-maintained source).
- Full list of Workshop upgrades and their max levels.

## Non-Goals (for now)
- No backend or server component.
- No cross-device sync — data lives in a single browser's `localStorage`.

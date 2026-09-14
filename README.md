# tower-workshop-paths

A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it will recommend a buy order based on cost efficiency and spend priorities.

See [Project-Outline.md](Project-Outline.md) for the full goal, scope, and the buy-order scoring design, and [Open-Questions.md](Open-Questions.md) for what's unresolved or still in progress.

## Current status

This is early-stage and under active development. What exists today:

- A phone-mimicking React UI with two levels of navigation:
  - A top-level "Input" / "Path" toggle in the header. "Input" is this tool's own concept; "Path" has no in-game equivalent, so it's deliberately kept off the game-mirroring toggle below. The header (and, within "Input", the Upgrade/Enhance mode tab bar) stays visible while scrolling a long list, so switching sections/modes never requires scrolling back to the top first.
  - Within "Input", an "Upgrade" / "Enhance" mode tab bar matching the game's own buttons, switching between:
    - **Upgrade**: enter your current level in every Workshop upgrade, backed by per-level cost data from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package.
    - **Enhance**: enter your current level in every Workshop Enhancement category, shown as "{name} +" (e.g. "Damage +"), the game's own naming convention, with its computed current value (e.g. `1.40×`) shown alongside — there's no in-game way to see an Enhancement's level directly, only its resulting value. Locked behind an "Unlock (5B coins)" prompt until the one-time Workshop Enhancements Lab is bought, matching the game — the Path list's own Lab row (below) unlocks this screen too, and vice versa.
    - Both share the same three-tree tab layout, labeled just Attack / Defense / Utility.
  - **Path** (the other top-level section): a simulated cheapest-first buy order spanning both Workshop upgrades and Workshop Enhancements in one combined ranked list — an Enhancement row is shown as "{name} +" (e.g. "Damage +"), the game's own naming convention, to tell it apart from a same-named Workshop upgrade (e.g. both have a "Damage"). No Enhancement is purchasable at all until the one-time "Workshop Enhancements" Lab is bought (5B coins) — while it's still locked, the Lab itself is the only Enhancement-related row shown, in place of every Enhancement category. Workshop purchases are always shown in fixed batches rather than single levels, for practicality (not because the game requires it): 100 levels at once for an upgrade with over 1000 max levels, 10 for one with at least 10, or 1 for one with fewer max levels than that; a batch shrinks to whatever's left if fewer remain before max level. Enhancements are always bought 1 level at a time — that one is a real game rule, not this tool's choice. The same item can appear several rows in a row if its next few batches stay cheaper than everything else, capped at 50 rows — a placeholder for the full priority-weighted buy-order recommendation, see below. Each row's Buy button doubles as its cost display (e.g. "Buy" / "2.98k coins"), and adds its batch to your entered level, re-ranking immediately — unless the same item also appears earlier in the list, in which case it first asks whether to buy just this batch or every occurrence up to this row, since buying only this one would otherwise silently skip the earlier ones. Costs are shown the way the game itself displays large numbers — condensed with a suffix (e.g. `2.98k`, `137.45M`, `2.5B`, up to `O` for octillion) and truncated (not rounded) to 2 decimal places, since the underlying per-level cost data is frequently fractional.
  - A "⋯" overflow menu in the header, next to the Input/Path toggle, holding secondary actions — currently just "Clear all levels" (with a confirmation step), which resets every entered Workshop upgrade and Enhancement level back to zero and re-locks the Workshop Enhancements Lab.
- Entered levels persist in browser `localStorage` — nothing is sent to a server.

Not built yet: the full priority-weighted buy-order algorithm (the tool's core feature — the Path screen above is a cost-only first cut), discount-lab and unlock-gate handling, and Enhancement/unlock gating. See [Open-Questions.md](Open-Questions.md) for details on each.

## Data sources

- Workshop upgrade cost data comes from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package.
- Workshop Enhancement data — category list, max levels, unlock thresholds, the value formula, and per-level coin costs — isn't available in any package; it's transcribed from a community-maintained Google Sheet for *The Tower - Idle Tower Defense* ("Workshop v3.3"). Main contributor: Discord user **@Mattew**. This project didn't create that data and claims no credit for it — full credit belongs to @Mattew and the sheet's other contributors for researching and maintaining it.

## Development

This is a React app scaffolded with [Vite](https://vitejs.dev/).

```
npm install
npm run dev
```

## Testing

Correctness is a high priority for this tool, especially the buy-order scoring algorithm once it exists. CI (`.github/workflows/ci.yml`) runs lint, unit/component tests, the build, and E2E tests on every pull request against `main`.

```
npm run lint       # oxlint
npm test           # unit/component tests (Vitest)
npm run build      # production build
npx playwright install chromium   # one-time browser install
npm run test:e2e   # functional/E2E tests (Playwright, in e2e/)
```

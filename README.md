# tower-workshop-paths

A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it will recommend a buy order based on cost efficiency and spend priorities.

See [Project-Outline.md](Project-Outline.md) for the full goal, scope, and the buy-order scoring design, and [Open-Questions.md](Open-Questions.md) for what's unresolved or still in progress.

## Current status

This is early-stage and under active development. What exists today:

- A phone-mimicking React UI with two levels of navigation:
  - A top-level "Input" / "Path" toggle in the header. "Input" is this tool's own concept; "Path" has no in-game equivalent, so it's deliberately kept off the game-mirroring toggle below.
  - Within "Input", an "Upgrade" / "Enhance" mode tab bar matching the game's own buttons, switching between:
    - **Upgrade**: enter your current level in every Workshop upgrade, backed by per-level cost data from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package.
    - **Enhance**: enter your current level in every Workshop Enhancement category, with its computed current value (e.g. `1.40×`) shown alongside — there's no in-game way to see an Enhancement's level directly, only its resulting value.
    - Both share the same three-tree tab layout, labeled just Attack / Defense / Utility.
  - **Path** (the other top-level section): a simulated cheapest-first buy order, batched the way the game actually sells Workshop upgrades (100 levels at once for upgrades with over 1000 max levels, 10 otherwise; a batch shrinks to whatever's left if fewer remain before max level) — the same upgrade can appear several rows in a row if its next few batches stay cheaper than everything else, capped at 50 rows — a placeholder for the full priority-weighted buy-order recommendation, see below.
- Entered levels persist in browser `localStorage` — nothing is sent to a server.

Not built yet: the full priority-weighted buy-order algorithm (the tool's core feature — the Path screen above is a cost-only first cut), discount-lab and unlock-gate handling, and Enhancement/unlock gating. See [Open-Questions.md](Open-Questions.md) for details on each.

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

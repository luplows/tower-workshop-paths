# tower-workshop-paths

A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given the player's current upgrade levels, it will recommend a buy order based on cost efficiency and spend priorities.

See [Project-Outline.md](Project-Outline.md) for the full goal, scope, and the buy-order scoring design, and [Open-Questions.md](Open-Questions.md) for what's unresolved or still in progress.

## Current status

This is early-stage and under active development. What exists today:

- A phone-mimicking React UI with three tabs (Attack / Defense / Utility) for entering your current level in every Workshop upgrade, backed by per-level cost data from the [`tower-idle-toolkit`](https://www.npmjs.com/package/tower-idle-toolkit) npm package.
- Entered levels persist in browser `localStorage` — nothing is sent to a server.

Not built yet: the recommended buy-order algorithm itself (the tool's core feature), discount-lab and unlock-gate handling, Workshop Enhancements, and batch buying. See [Open-Questions.md](Open-Questions.md) for details on each.

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

# tower-workshop-paths

A tool to help decide how to spend coins in the **Workshop** tab of the mobile game *The Tower - Idle Tower Defense*. Given your current Workshop upgrade and Enhancement levels, it recommends what to buy next — weighted by a community-sourced priority list, not just raw cost.

**[Live demo](https://luplows.github.io/tower-workshop-paths/)** — deployed to GitHub Pages on every push to `main`.

See [Project-Outline.md](Project-Outline.md) for the full design, and [Open-Questions.md](Open-Questions.md) / [Completed-Questions.md](Completed-Questions.md) for what's built, in progress, or still open.

## Built With

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) — unit/component tests
- [Playwright](https://playwright.dev/) — end-to-end tests
- [oxlint](https://oxc.rs/docs/guide/usage/linter.html) — linting

## Getting Started

### Prerequisites

- Node.js and npm

### Installation

```sh
git clone https://github.com/luplows/tower-workshop-paths.git
cd tower-workshop-paths
npm install
```

### Running

```sh
npm run dev
```

Everything you enter is stored in your browser's `localStorage` — no backend, no account, nothing leaves your machine.

### Testing

```sh
npm run lint       # oxlint
npm test           # unit/component tests (Vitest)
npm run build      # production build
npx playwright install chromium   # one-time browser install
npm run test:e2e   # end-to-end tests (Playwright)
```

## Roadmap

- [x] Priority-weighted buy-order algorithm spanning Workshop upgrades and Enhancements
- [x] Apply Workshop discount-lab savings to costs
- [x] Apply Enhancement discount-lab savings to costs
- [x] Source Workshop and Enhancement cost/max-level data from an independently-verified source, dropping the last third-party game-data dependency entirely (OQ-39, ~78% smaller production bundle)
- [ ] Confirm Workshop upgrade max levels against the current patch, in-game (OQ-1)
- [ ] Full buy-out simulation from lifetime coins (OQ-8)
- [ ] Verify the UI on a real mobile device (OQ-9)

See [Open-Questions.md](Open-Questions.md) for the full backlog.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Contact

Steve Luplow — [@luplows](https://github.com/luplows)

Project Link: [https://github.com/luplows/tower-workshop-paths](https://github.com/luplows/tower-workshop-paths)

## Acknowledgments

- Discord user **@Mattew** and contributors to the community *The Tower - Idle Tower Defense* Workshop Google Sheet, the source for Workshop Enhancement category list and thresholds
- Discord user **@QuietFanta** for the eHP priority ratios (shipped as this tool's default) and the reserved-for-later GC ratios, from the same sheet's "Desired Ratios" tab
- [mytower.app](https://mytower.app) for Workshop upgrade and Enhancement cost/max-level data, and the Enhancement discount Lab per-level values — linkback per [their terms](https://mytower.app)

This project claims no credit for any of that data or those ratios — only for using them.

---
id: OQ-152
title: Use the selected recommendation profile in Respec plans
tier: normal
kind: product
depends_on: [OQ-150, OQ-151, OQ-145]
model: sonnet
blocked: null
---

## Intent

As a player rebuilding after a respec, I want the generated coin buy-out to follow my selected strategy, so that my fresh Workshop purchases support the build I chose.

## Acceptance criteria

- [ ] **AC-1** — `simulateBuyOut` accepts the selected curated profile and uses the same eligibility and scoring rules as Buy order on each purchase step. With no supplied profile it uses `ehp`; its existing lifetime-coins-minus-Lab-coins budget calculation is unchanged.

- [ ] **AC-2** — The Respec view identifies the profile used for a plan. Changing the selected profile invalidates a previously generated plan until the player recalculates; a stale plan cannot be applied by OQ-145's Apply plan action.

- [ ] **AC-3** — A generated eHP plan omits unprioritized Enhancements except the existing necessary Coin Bonus prerequisite path. A test with a fixture alternative profile produces a differing plan under the same budget and discount Labs.

- [ ] **AC-4** — Planning remains read-only until the player explicitly confirms Apply plan under OQ-145. Applying targets the currently active tower configuration only; switching recommendation strategy alone never changes stored levels or Labs.

- [ ] **AC-5** — Vitest covers both profile choices and budget/termination outcomes; Playwright covers switching profiles before recalculation, the obsolete plan being unavailable for apply, and a fresh plan being displayed with the selected profile.

## Out of scope

- Changing the Respec summary's game-tab ordering or debug-only purchase list (OQ-144).
- Changing the budget stop rule to spend leftover coins on cheaper, lower-ranked purchases.
- Saving or switching multiple Workshop configurations (OQ-153) or implementing target-configuration rebuilds (OQ-154).

## Constraints

*(none)*

## Context

- `src/utils/buyOutPlan.js` and `src/components/BuyOutPlan.jsx` — existing full buy-out from zero.
- `stories/OQ-145-apply-respec-plan.md` — pending Apply plan behavior; this story must not independently invent a second apply action.
- `stories/OQ-144-respec-summary-game-order.md` — separately planned summary presentation.
- `stories/OQ-150-curated-recommendation-profile-foundation.md` and `stories/OQ-151-recommendation-profile-selection.md`.

## Open questions

*(none)*

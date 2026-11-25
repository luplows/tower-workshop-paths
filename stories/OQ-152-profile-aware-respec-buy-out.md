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

As a player rebuilding after a respec, I want the buy-out to follow the curated profile associated with the Workshop configuration I'm rebuilding, so that the purchases support that configuration's strategy.

## Acceptance criteria

- [ ] **AC-1** — `simulateBuyOut` accepts the curated profile associated with the active Workshop configuration and uses the same eligibility and scoring as Buy order at every purchase step. If no profile is supplied it uses `ehp`; the lifetime-coins-minus-Lab-coins budget calculation is unchanged.

- [ ] **AC-2** — Respec identifies the active configuration's associated profile used for a plan. Changing that association immediately invalidates the previously calculated plan until it is recomputed, and a stale plan cannot be applied through OQ-145's Apply plan action. When OQ-153 introduces configuration switching, a switch likewise invalidates the plan.

- [ ] **AC-3** — A generated eHP plan omits unprioritized Enhancements except the existing necessary Coin Bonus prerequisite path. A test with a fixture alternative profile produces a differing plan under the same budget and discount Labs.

- [ ] **AC-4** — Planning remains read-only until the player explicitly confirms Apply plan under OQ-145. Applying affects only the active Workshop configuration; editing its associated recommendation profile does not change its levels, unlocks, or Labs. A plan for another configuration must not be applied after switching.

- [ ] **AC-5** — Vitest covers different fixture profiles and budget/termination outcomes. Playwright covers editing the associated profile, obsolete plans becoming unavailable for Apply, and a newly calculated plan reflecting the changed profile.

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
- `stories/OQ-150-curated-recommendation-profile-foundation.md` and `stories/OQ-151-recommendation-profile-selection.md` — define the profile registry and its association with the active configuration.
- `stories/OQ-153-saved-workshop-configurations.md` — adds configuration switching and must invalidate plans created for a different configuration.

## Open questions

*(none)*

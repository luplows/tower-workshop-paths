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

- [ ] **AC-1** — `simulateBuyOut` accepts the curated profile associated with the active Workshop configuration and uses the same **core curated eligibility and scoring as Buy order's default profile-based path** at every purchase step. If no profile is supplied it uses `ehp`; the lifetime-coins-minus-Lab-coins budget calculation is unchanged. A future, explicitly selected **Buy order-only prerequisite unlock route** (OQ-155) is not a Respec input and does not modify these calculations.

- [ ] **AC-2** — Respec identifies the profile associated with the current Workshop configuration used for a plan. Editing that association invalidates the old generated plan immediately until recalculation; the stale plan cannot be applied by OQ-145's Apply plan action.

- [ ] **AC-3** — A generated eHP plan omits unprioritized Enhancements except the existing necessary Coin Bonus prerequisite path. A test with a fixture alternative profile produces a differing plan under the same budget and discount Labs.

- [ ] **AC-4** — Planning remains read-only until the player explicitly confirms Apply plan under OQ-145. Applying affects the current Workshop configuration only; changing its associated recommendation profile never changes stored Workshop/Enhancement levels, unlocks, or Labs.

- [ ] **AC-5** — Vitest covers different fixture profiles and budget/termination outcomes. Playwright covers editing the associated profile, obsolete plans becoming unavailable for Apply, and a newly calculated plan reflecting the changed profile.

## Out of scope

- Changing the Respec summary's game-tab ordering or debug-only purchase list (OQ-144).
- Changing the budget stop rule to spend leftover coins on cheaper, lower-ranked purchases.
- Letting a player-selected alternative unlock route in Buy order change Respec purchases; future route choices are scoped to Buy order (OQ-155).
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

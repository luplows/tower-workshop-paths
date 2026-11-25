---
id: OQ-154
title: Generate a purchase checklist to rebuild a saved configuration
tier: later
kind: product
depends_on: [OQ-153, OQ-144, OQ-145]
model: sonnet
blocked: null
---

## Intent

As a player who just respecced, I want a practical purchase checklist for a saved Workshop setup, so that I can recreate that known configuration in the game without guessing which levels to buy.

## Acceptance criteria

- [ ] **AC-1** — A player selects a saved target configuration and can request a **from-zero** reconstruction plan, assuming zero coin-purchased base Workshop levels, zero Enhancement levels, and no purchased preset-specific Workshop unlock groups. The plan uses the target's saved levels and unlock-group state, ignores the active configuration's existing purchase levels as a starting point, and does not mutate the saved target or current configuration.

- [ ] **AC-2** — Starting from the zero state in AC-1, the plan itemizes all base Workshop and Enhancement purchases plus the preset-specific Workshop unlock-group purchases needed to recreate the target, using the app's cost data and global applicable discount Labs. It does not reprioritize a known target using the eHP scoring heuristic. Tests verify the from-zero purchase costs are not reduced by levels or unlock groups recorded in other presets.

- [ ] **AC-3** — The UI presents a game-ordered grouped checklist covering Workshop and Enhancement tabs, with target level, purchase cost, and total cost visible. It reuses the established Respec summary ordering from OQ-144 rather than generating a competing presentation.

- [ ] **AC-4** — The plan reports when the target cannot be fully reconstructed under the chosen available-coin budget, without silently substituting a different optimized build.

- [ ] **AC-5** — Only a separate explicit confirmation may update a local saved current configuration to the reconstructed result; merely viewing/checking steps is non-destructive.

## Out of scope

- Reconstruction from a partially purchased or nonzero current Workshop/Enhancement state, including detecting purchases that would require another respec to undo.
- Choosing a new strategy-based target automatically; OQ-152 already provides the prioritized from-zero buy-out.
- Automatically buying in the game, adding a backend, or triggering a respec from this app.
- Rewriting the existing OQ-145 Apply plan action or skipping its confirmation rules.

## Constraints

- Reconstruction assumes a post-respec, from-zero preset purchase state while retaining the player's global Lab levels and Respec budget inputs; it must not derive starting purchases from any other saved configuration.

## Context

- `src/utils/buyOutPlan.js` — current from-zero prioritized simulation, distinct from exact-target reconstruction.
- `stories/OQ-144-respec-summary-game-order.md` — game-ordered summary.
- `stories/OQ-145-apply-respec-plan.md` — confirmed state updates; `stories/OQ-153-saved-workshop-configurations.md` — stored targets.
- Owner confirmations, 2026-11-25 — Workshop upgrades, Enhancements, and purchased Workshop unlock groups are all preset-specific, so exact-target rebuilding covers all three. Lifetime coins and coins spent on Labs are global Respec inputs, not properties of a saved target. Initial exact-target reconstruction begins from zero, not from a partially purchased preset.

## Open questions

1. Should this workflow generate a single static checklist or support progress checkoffs and persistence across sessions?
2. Do we offer a budget estimate only or a strict budget constraint, and how should an underfunded target be presented?

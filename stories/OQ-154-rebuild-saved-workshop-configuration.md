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

- [ ] **AC-1** — A player selects a saved target configuration and can request a reconstruction plan without changing that saved target or the active current configuration.

- [ ] **AC-2** — The plan itemizes base Workshop and Enhancement purchases plus the preset-specific Workshop unlock-group purchases needed to recreate the saved target, using the app's cost data and shared applicable discount Labs. It does not reprioritize a known target using the eHP scoring heuristic. Tests verify that unlock groups owned by a different preset do not satisfy the target's unlock requirements.

- [ ] **AC-3** — The UI presents a game-ordered grouped checklist covering Workshop and Enhancement tabs, with target level, purchase cost, and total cost visible. It reuses the established Respec summary ordering from OQ-144 rather than generating a competing presentation.

- [ ] **AC-4** — The plan reports when the target cannot be fully reconstructed under the chosen available-coin budget, without silently substituting a different optimized build.

- [ ] **AC-5** — Only a separate explicit confirmation may update a local saved current configuration to the reconstructed result; merely viewing/checking steps is non-destructive.

## Out of scope

- Choosing a new strategy-based target automatically; OQ-152 already provides the prioritized from-zero buy-out.
- Automatically buying in the game, adding a backend, or triggering a respec from this app.
- Rewriting the existing OQ-145 Apply plan action or skipping its confirmation rules.

## Constraints

*(none)*

## Context

- `src/utils/buyOutPlan.js` — current from-zero prioritized simulation, distinct from exact-target reconstruction.
- `stories/OQ-144-respec-summary-game-order.md` — game-ordered summary.
- `stories/OQ-145-apply-respec-plan.md` — confirmed state updates; `stories/OQ-153-saved-workshop-configurations.md` — stored targets.
- Owner confirmations, 2026-11-25 — Workshop upgrades, Enhancements, and purchased Workshop unlock groups are all preset-specific, so exact-target rebuilding covers all three.

## Open questions

1. Does rebuilding always start from all-zero Workshop levels after respec, or should it support a nonzero currently selected configuration and detect purchases that cannot be undone without another respec?
2. Should this workflow generate a single static checklist or support progress checkoffs and persistence across sessions?
3. Do we offer a budget estimate only or a strict budget constraint, and how should an underfunded target be presented?

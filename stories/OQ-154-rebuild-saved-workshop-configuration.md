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

- [ ] **AC-2** — The plan itemizes the Workshop purchases and applicable unlock costs needed to reach the target levels, using the app's cost data and applicable discount Labs rather than reprioritizing the target by the general eHP scoring heuristic.

- [ ] **AC-3** — The UI presents a game-ordered grouped checklist suitable for following while buying in-game, with target level, purchase cost, and total cost visible; it reuses the established Respec summary ordering from OQ-144 rather than generating a competing presentation.

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

## Open questions

1. Does rebuilding always start from all-zero Workshop levels after respec, or should it support a nonzero currently selected configuration and detect purchases that cannot be undone without another respec?
2. Does a reconstruction plan target only base Workshop upgrades, or Enhancements and unlock groups too? Confirm what the saved-config story captures.
3. Should this workflow generate a single static checklist or support progress checkoffs and persistence across sessions?
4. Do we offer a budget estimate only or a strict budget constraint, and how should an underfunded target be presented?

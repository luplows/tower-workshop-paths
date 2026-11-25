---
id: OQ-151
title: Select a curated recommendation profile when alternatives exist
tier: normal
kind: product
depends_on: [OQ-150]
model: sonnet
blocked: null
---

## Intent

As a player, I want each Workshop configuration to remember its curated recommendation strategy, so that its buy recommendations match that configuration without changing its purchased levels.

## Acceptance criteria

- [ ] **AC-1** — The existing single Workshop configuration has exactly one associated recommendation profile, initially `ehp`. With only `ehp` shipped, Path identifies its strategy but does not show a meaningless single-option selector or imply GC/Hybrid profiles already ship.

- [ ] **AC-2** — When the registry has at least two curated profiles, a labelled Recommendation profile control offers only registered profiles and edits the active Workshop configuration's associated profile. Changing it immediately recalculates the displayed Buy order without a reload. Component tests inject a second fixture profile rather than shipping invented GC/Hybrid ratios.

- [ ] **AC-3** — The profile id persists as data associated with the current Workshop configuration, not as a global interface preference. Before OQ-153 the app has one implicit configuration; its profile survives reload and is preserved when OQ-153 migrates to named configurations. Missing or unregistered ids fall back to `ehp` without modifying Workshop levels.

- [ ] **AC-4** — Changing the associated profile does not modify Workshop or Enhancement levels, unlocked groups, discount Labs, Enhancement Lab level, or Respec coin inputs. Playwright or component tests assert these values remain unchanged.

- [ ] **AC-5** — On narrow mobile screens the active configuration's associated profile name and, when available, selector are distinguishable from the Workshop-configuration selector introduced in OQ-153. Switching configurations in OQ-153 must restore the selected configuration's profile rather than applying a global choice.

## Out of scope

- Shipping unsupported GC, Hybrid, or Dissonance ratios (OQ-155).
- Per-player ratio editing or manual Enhancement exclusions (OQ-96).
- Creating or switching stored Workshop configurations (OQ-153), switching actual in-game presets, or altering purchased levels.

## Constraints

*(none)*

## Context

- `src/App.jsx` — section/tab selection and currently persisted UI settings.
- `src/storageKeys.js` and `src/hooks/useLocalStorageState.js` — registered keys and persistence. The configuration-associated profile is not a global interface setting; respect OQ-141's tower-data boundary.
- `src/components/UpgradePath.jsx` — current ranked Path.
- `stories/OQ-150-curated-recommendation-profile-foundation.md` — provides profile registry for the selector.
- `stories/OQ-153-saved-workshop-configurations.md` — later introduces multiple named configurations and preserves the current configuration's profile association.

## Open questions

*(none)*

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

As a player, I want to choose which built-in strategy guides my recommendations, so that I can change the advice without re-entering my tower.

## Acceptance criteria

- [ ] **AC-1** — With only the shipped `ehp` profile, the Path identifies the active strategy as eHP but does not show a pointless single-option selector or imply that GC/Hybrid profiles already ship.

- [ ] **AC-2** — When the curated profile registry contains at least two profiles, a labelled Recommendation profile control offers only those registered profiles. Selecting one updates subsequent Buy order calculations. Component tests use an injected fixture profile rather than shipping invented GC/Hybrid ratios.

- [ ] **AC-3** — The active profile id is stored as an interface preference, survives reload, defaults to `ehp` for a new user, and falls back to `ehp` if a previously stored id is no longer registered.

- [ ] **AC-4** — Changing the profile does not change Workshop/Enhancement levels, unlocked groups, discount Labs, Enhancement Lab level, or Respec coin inputs. Playwright or component tests assert those stored tower values remain unchanged.

- [ ] **AC-5** — On narrow mobile screens the active profile name and, when relevant, its selector remain distinguishable from Workshop preset/configuration selection; the Path visibly reflects the active profile.

## Out of scope

- Shipping unsupported GC, Hybrid, or Dissonance ratios (OQ-155).
- Per-player ratio editing or manual Enhancement exclusions (OQ-96).
- Switching actual in-game presets or altering levels.

## Constraints

*(none)*

## Context

- `src/App.jsx` — section/tab selection and currently persisted UI settings.
- `src/storageKeys.js` and `src/hooks/useLocalStorageState.js` — registered storage keys and persisted preferences.
- `src/components/UpgradePath.jsx` — current ranked Path.
- `stories/OQ-150-curated-recommendation-profile-foundation.md` — provides profile registry for the selector.

## Open questions

*(none)*

---
id: OQ-150
title: Represent curated recommendation profiles as reusable data
tier: next
kind: product
depends_on: [OQ-149]
model: sonnet
blocked: null
---

## Intent

As a player, I want buy orders to be driven by a defined strategy profile, so that new curated strategies can use one trusted recommendation engine without duplicating the algorithm.

## Acceptance criteria

- [ ] **AC-1** — Provide a built-in, stable-id `ehp` recommendation profile with a display name, source/attribution, and an explicit set of eligible Enhancement names with their existing QuietFanta ratios; do not change those six numbers.

- [ ] **AC-2** — The prioritised buy-order computation accepts a profile (defaulting to `ehp` when none is provided) and uses that profile for Enhancement eligibility and relative priority. Base Workshop upgrades and unlock offers remain governed by the existing general fallback behavior, not by absent Enhancement entries.

- [ ] **AC-3** — Preserve the existing Coin Bonus prerequisite and Lab handling under `ehp`. The mechanism for representing a required prerequisite is separate from an ordinary eligible Enhancement ratio; omission from a profile never silently becomes a fallback Enhancement purchase.

- [ ] **AC-4** — Tests supply a second, in-test curated profile with a deliberately different Enhancement selection/ratio and show that the same engine produces different eligible candidates and ordering. The shipped registry contains only the sourced `ehp` profile.

- [ ] **AC-5** — The normal Path and the Respec simulator consume the common profile-aware engine rather than duplicating a per-screen inclusion list. Tests confirm default-profile behavior is the same as OQ-149 after this refactor.

## Out of scope

- A profile editor, user-created ratios, GC/Hybrid/Dissonance priority data, or additional shipped selectable profiles.
- Separating recommendation profiles into independent stored Workshop configurations; that is OQ-153.
- Changing Workshop batching, cost tables, or the buy-out budget algorithm.

## Constraints

*(none)*

## Context

- `src/data/enhancementPriority.js` — current eHP priorities and their provenance.
- `src/utils/cheapestNextUpgrades.js`, `src/utils/buyOutPlan.js` — consumers of the scoring logic.
- `stories/OQ-149-strict-ehp-enhancement-eligibility.md` — the default behavior this abstraction must preserve.

## Open questions

*(none)*

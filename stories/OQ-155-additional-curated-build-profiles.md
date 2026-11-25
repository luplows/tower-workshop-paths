---
id: OQ-155
title: Research and add additional curated build and Dissonance profiles
tier: later
kind: product
depends_on: [OQ-150, OQ-151, OQ-152]
model: sonnet
blocked: null
---

## Intent

As a player whose strategy evolves beyond eHP, I want reliable curated GC, Hybrid, and Dissonance-aware recommendation profiles, so that I can select advice appropriate to the run without inventing weights myself.

## Acceptance criteria

- [ ] **AC-1** — Before any additional shipped profile is enabled, document its verified source, exact prioritized Enhancement names/ratios, and exclusions; missing or ambiguous values are not filled with the generic fallback as if they were curated advice.

- [ ] **AC-2** — Ship separately identified GC and Hybrid profiles only after their priority sets have been sourced and validated; their behavior uses the same engine and eligibility boundaries as eHP.

- [ ] **AC-3** — Determine whether Dissonance is a distinct profile or an overlay on a build strategy before adding Dissonance choices, and define which run variants have supported curated data.

- [ ] **AC-4** — Tests show that switching a newly added profile changes both Buy order and Respec calculations for a fixture tower while preserving its stored levels and configuration.

## Out of scope

- A full stat-benefit calculator, automated profile derivation from a player's tower, or player-authored ratio editing.
- Automatically disabling Workshop tabs inside The Tower or providing unsupported Dissonance strategy claims.

## Constraints

*(none)*

## Context

- `src/data/enhancementPriority.js` — current QuietFanta eHP ratios and the reserved-for-later GC-source reference in repository README.
- `stories/OQ-150-curated-recommendation-profile-foundation.md`, `stories/OQ-151-recommendation-profile-selection.md`, `stories/OQ-152-profile-aware-respec-buy-out.md`.
- Game mechanics and run-specific claims need current verification against official notes, not unsourced community assumptions.

## Open questions

1. Which authoritative or cross-checked ratios/eligibility lists should define GC and Hybrid? Are the existing community GC ratios still current?
2. For each Dissonance run type, should it modify an eHP/GC/Hybrid profile or become a separate preset of priorities?
3. Which strategically useful prerequisite Enhancements, if any, should be allowed when absent from curated priorities?
4. Should additional profiles be delivered together or as separately reviewable OQ stories once their data is known?

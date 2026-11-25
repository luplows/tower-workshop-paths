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

- [ ] **AC-2** — GC and Hybrid are **separate, independently deliverable profile increments**. Each is enabled only after its own priorities and eligibility have been sourced and validated, using the same recommendation engine and eligibility contract as eHP. Shipping one never requires waiting for the other or for Dissonance support.

- [ ] **AC-3** — Determine whether Dissonance is a distinct profile or an overlay on a build strategy before adding Dissonance choices, and define which run variants have supported curated data. Each supported Dissonance increment is separately deliverable when its own mechanics and source data are validated; none must delay GC, Hybrid, or another supported increment.

- [ ] **AC-4** — For **each independently shipped** profile or supported Dissonance variant, tests show its recommendations change Buy order and Respec for an appropriate fixture tower while preserving the saved Workshop/Enhancement levels, unlock groups, and configuration association. An increment is reviewable and releasable without needing tests or data for still-unimplemented profiles.

## Out of scope

- A full stat-benefit calculator, automated profile derivation from a player's tower, or player-authored ratio editing.
- Automatically disabling Workshop tabs inside The Tower or providing unsupported Dissonance strategy claims.

## Constraints

- OQ-155 is a draft discovery/coordination story for potential future profiles, **not** permission to implement and release GC, Hybrid, and all Dissonance choices as one indivisible feature. Once a profile's verified data and boundaries are understood, refine it into its own independently reviewable OQ-numbered implementation story, checking existing story records and branches before assigning an ID; do not dispatch OQ-155 as a bundled multi-profile implementation task.
- Do not gate a validated profile's release on source data or design decisions for unrelated profiles.

## Context

- `src/data/enhancementPriority.js` — current QuietFanta eHP ratios and the reserved-for-later GC-source reference in repository README.
- `stories/OQ-150-curated-recommendation-profile-foundation.md`, `stories/OQ-151-recommendation-profile-selection.md`, `stories/OQ-152-profile-aware-respec-buy-out.md`.
- Game mechanics and run-specific claims need current verification against official notes, not unsourced community assumptions.
- Owner decision, 2026-11-25 — release each validated profile independently; neither GC nor Hybrid nor a Dissonance variant should wait for other profiles to be completed.

## Open questions

1. Which authoritative or cross-checked ratios/eligibility lists should define GC and Hybrid? Are the existing community GC ratios still current?
2. For each Dissonance run type, should it modify an eHP/GC/Hybrid profile or become a separate preset of priorities?
3. Which strategically useful prerequisite Enhancements, if any, should be allowed when absent from curated priorities?

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

- [ ] **AC-3** — Investigate **separately selectable Dissonance recommendation profiles** as the owner's preferred direction, rather than assuming a universal overlay on eHP/GC/Hybrid. Before any Dissonance profile ships, specify its disabled Workshop category (Attack, Defense, Utility, or Ultimate Weapons), the **target tier or verified tier applicability**, and the build capabilities or prerequisites required by its sourced advice. Confirm whether applicability needs exact tiers or meaningful tier ranges; do not imply that the same strategy is viable at every tier. Each supported Dissonance increment can ship independently once its priorities, eligibility, and evidence are verified; none must delay GC, Hybrid, or another increment.

- [ ] **AC-4** — For **each independently shipped** profile or supported Dissonance variant, tests show its recommendations change Buy order and Respec for an appropriate fixture tower while preserving the saved Workshop/Enhancement levels, unlock groups, and configuration association. An increment is reviewable and releasable without needing tests or data for still-unimplemented profiles.

## Out of scope

- A full stat-benefit calculator, automated profile derivation from a player's tower, or player-authored ratio editing.
- Automatically disabling Workshop tabs inside The Tower or providing unsupported Dissonance strategy claims.
- Asserting hard tier/build impossibility rules, such as "eHP cannot complete T17+ Utility Dissonance," before independently validating them. Do not create a full tier × run-type × build-style profile grid by default.

## Constraints

- OQ-155 is a draft discovery/coordination story for potential future profiles, **not** permission to implement and release GC, Hybrid, and all Dissonance choices as one indivisible feature. Once a profile's verified data and boundaries are understood, refine it into its own independently reviewable OQ-numbered implementation story, checking existing story records and branches before assigning an ID; do not dispatch OQ-155 as a bundled multi-profile implementation task.
- Do not gate a validated profile's release on source data or design decisions for unrelated profiles.

## Context

- `src/data/enhancementPriority.js` — current QuietFanta eHP ratios and the reserved-for-later GC-source reference in repository README.
- `stories/OQ-150-curated-recommendation-profile-foundation.md`, `stories/OQ-151-recommendation-profile-selection.md`, `stories/OQ-152-profile-aware-respec-buy-out.md`.
- Game mechanics and run-specific claims need current verification against official notes, not unsourced community assumptions.
- Tech Tree Games, v28.0.0 patch notes (2026-04-07): Dissonance is selected **per tier** and disables one of four Workshop categories; the tier specificity and category restriction are verified mechanics, not evidence that a particular eHP/GC build is viable or impossible at a given tier: https://techtreegames.zendesk.com/hc/en-us/articles/50090926690715-v28-0-0-Patch-Notes-2026-04-07
- Community Dissonance guide (reviewed 2026-11-25) discusses both eHP and GC Utility Dissonance approaches, but is anecdotal strategy guidance, not a validated target-tier rule: https://www.reddit.com/r/TheTowerGame/comments/1v5kx3e/my_dissonant_run_guide_use_it_if_you_will_write/
- Owner decision, 2026-11-25 — release each validated profile independently; neither GC nor Hybrid nor a Dissonance variant should wait for other profiles to be completed.
- Owner's **provisional design preference**, 2026-11-25 — Dissonance should likely be a distinct profile, potentially tied to the tier being targeted. The example claim that eHP cannot handle T17+ Utility Dissonance needs confirmation and must not be implemented as a verified restriction.

## Open questions

1. Which authoritative or cross-checked ratios/eligibility lists should define GC and Hybrid? Are the existing community GC ratios still current?
2. **Dissonance tier applicability and strategy evidence:** Confirm the working preference for separately selectable Dissonance profiles. Which disabled Workshop category and exact tier or tier range would each profile address, and which build prerequisites actually affect viability? Validate or reject the proposed T17+ Utility/eHP limitation before any eligibility rule is encoded. Should the player's target tier be explicit input or metadata on a selected profile? Do not choose a complete tier × category × base-build matrix without sourced priority differences.
3. Which strategically useful prerequisite Enhancements, if any, should be allowed when absent from curated priorities?

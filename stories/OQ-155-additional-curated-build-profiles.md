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

- [ ] **AC-3** — Investigate **separately selectable Dissonance recommendation profiles named by disabled category + build style** (for example, **Utility eHP** and, if validated, **Utility GC**), as the owner's preferred direction. Do not use a target-tier number as the primary profile name or assume a universal overlay on eHP/GC/Hybrid. Before any Dissonance profile ships, specify its disabled Workshop category (Attack, Defense, Utility, or Ultimate Weapons), the **target tier or verified tier applicability**, and the build capabilities or prerequisites required by its sourced advice. Show any **verified tier or tier-range applicability** and relevant caveats as **informational metadata** alongside the profile; when tier applicability is not established, say that it is unverified instead of inventing a range. For the first version there is **no target-tier input** and profile choices are **not hidden, disabled, or filtered** based on tier. Do not imply the same strategy is viable at every tier. Each supported Dissonance increment can ship independently once its priorities, eligibility, and evidence are verified; none must delay GC, Hybrid, or another increment.

- [ ] **AC-4** — For **each independently shipped** profile or supported Dissonance variant, tests show its recommendations change Buy order and Respec for an appropriate fixture tower while preserving the saved Workshop/Enhancement levels, unlock groups, and configuration association. An increment is reviewable and releasable without needing tests or data for still-unimplemented profiles.

- [ ] **AC-5** — For each future GC, Hybrid, or Dissonance profile, Enhancements excluded from the curated priority list are **not ordinary recommended purchases**. When unlocking a curated Enhancement requires a prerequisite or cumulative-spend threshold, identify a route using eligible, accessible **approved-list Enhancement levels** wherever possible. An alternative route involving explicitly identified off-list purchases may also be evaluated even when the approved route is possible, but it must remain visibly separate from the curated recommendation. Do not alter OQ-149's existing Coin Bonus exception or broaden OQ-150's shipped behavior without a separately reviewed implementation decision.

- [ ] **AC-6** — Where both an approved-list route and an off-list route can reach the same Enhancement unlock, **surface both options with estimated required coin spending** rather than suppressing either solely because one costs more. Clearly mark the off-list route with a disclaimer that its purchases are *not favored by the selected strategy* and may be less valuable for the player's build, even if the route spends fewer coins. Do not describe off-list purchases as curated priorities or silently substitute that route into the ordinary ranked Buy order. Tests cover a fixture where approved-list unlock spending costs more than an off-list alternative (for example, 10T versus 1T), verify both amounts/routes and the unfavorable-strategy notice, and cover cases where only one feasible route exists. Both routes appear together as **informational alternatives in Buy order** (AC-7); neither is selectable and neither changes Respec.

- [ ] **AC-7** — In the **Buy order screen only**, show the approved-list unlock route and any feasible off-list route **side by side** for the same Enhancement unlock, with each route's purchase steps and estimated coin cost visible and the off-list route explicitly labeled strategically unfavorable. The comparison is **read-only and ephemeral**: no route selector, Apply action, route-choice state, or localStorage persistence. Viewing these alternatives cannot change the ordinary ranked Buy order, saved levels or profile, global inputs, or the Respec simulation. Tests verify that both routes are displayed together for the same unlock, that no route can be selected or persisted, and that opening the comparison leaves Buy order calculations and Respec results unchanged. This comparison is separate from OQ-149's established Coin Bonus prerequisite behavior.

## Out of scope

- A full stat-benefit calculator, automated profile derivation from a player's tower, or player-authored ratio editing.
- Treating every cheap unprioritized Enhancement as an approved purchase, or automatically choosing a cheapest unlock route without presenting its strategy trade-off.
- Interactive route selection, saved route preferences, or modifying normal Buy order/Respec recommendations based on a displayed unlock-route comparison.
- Automatically disabling Workshop tabs inside The Tower or providing unsupported Dissonance strategy claims.
- Asserting hard tier/build impossibility rules, such as "eHP cannot complete T17+ Utility Dissonance," before independently validating them. Do not create a full tier × run-type × build-style profile grid by default.
- Required target-tier entry, automatic tier-based hiding/filtering/disabling of profiles, or automatically selecting a strategy from a player's tier in the first version.

## Constraints

- OQ-155 is a draft discovery/coordination story for potential future profiles, **not** permission to implement and release GC, Hybrid, and all Dissonance choices as one indivisible feature. Once a profile's verified data and boundaries are understood, refine it into its own independently reviewable OQ-numbered implementation story, checking existing story records and branches before assigning an ID; do not dispatch OQ-155 as a bundled multi-profile implementation task.
- Do not gate a validated profile's release on source data or design decisions for unrelated profiles.

## Context

- `src/data/enhancementPriority.js` — current QuietFanta eHP ratios and the reserved-for-later GC-source reference in repository README.
- `stories/OQ-149-strict-ehp-enhancement-eligibility.md`, `stories/OQ-150-curated-recommendation-profile-foundation.md`, `stories/OQ-151-recommendation-profile-selection.md`, `stories/OQ-152-profile-aware-respec-buy-out.md`. OQ-149 intentionally preserves only the already established Coin Bonus prerequisite route; any broader unlock-path support needs independent story refinement.
- Game mechanics and run-specific claims need current verification against official notes, not unsourced community assumptions.
- Tech Tree Games, v28.0.0 patch notes (2026-04-07): Dissonance is selected **per tier** and disables one of four Workshop categories; the tier specificity and category restriction are verified mechanics, not evidence that a particular eHP/GC build is viable or impossible at a given tier: https://techtreegames.zendesk.com/hc/en-us/articles/50090926690715-v28-0-0-Patch-Notes-2026-04-07
- Community Dissonance guide (reviewed 2026-11-25) discusses both eHP and GC Utility Dissonance approaches, but is anecdotal strategy guidance, not a validated target-tier rule: https://www.reddit.com/r/TheTowerGame/comments/1v5kx3e/my_dissonant_run_guide_use_it_if_you_will_write/
- Owner decisions, 2026-11-25 — release each validated profile independently; **research Hybrid first, then GC**, with Dissonance variants considered as supporting evidence becomes available. These are research priorities, not a delivery dependency: neither GC nor Hybrid nor a Dissonance variant must wait for the others to ship. Prefer approved-list Enhancements for cumulative-spend unlock progress, **but show both an approved-list path and a cheaper off-list path when both exist**, labeling the off-list route as unfavorable to the curated strategy instead of hiding it or silently substituting it. The routes appear together as **temporary, informational side-by-side comparisons on the Buy order screen**, with no selection, persistence, or effect on Buy order ranking or Respec calculations.
- Owner's **provisional design preference**, 2026-11-25 — Dissonance should be represented by separate, human-readable **category + build-style** profile names (example: `Utility eHP`); any verified supported tier/range should be shown as **informational profile guidance**, not baked into the primary label. Tier selection/filtering is not part of the initial version. The owner's `Utility GF` example was confirmed to mean **Utility GC** (Glass Cannon); `GF` was a typo, not another build style. The example claim that eHP cannot handle T17+ Utility Dissonance needs confirmation and must not be implemented as a verified restriction.

## Open questions

1. Which authoritative or cross-checked ratios/eligibility lists should define GC and Hybrid? Are the existing community GC ratios still current?
2. **Dissonance tier applicability and strategy evidence:** Confirm the working preference for separately selectable Dissonance profiles. Which disabled Workshop category and exact tier or tier range would each profile address, and which build prerequisites actually affect viability? Validate or reject the proposed T17+ Utility/eHP limitation before any eligibility rule is encoded. Tier applicability is **informational only** for v1, not a filter or input. Determine what reliable tier ranges or caveats can actually be shown, and do not choose a complete tier × category × base-build matrix without sourced priority differences.
3. **Unlock routing details:** Side-by-side comparisons are **temporary and informational only**, with no route selection, persistence, or effect on ranked Buy order/Respec (AC-6/AC-7). Define how to construct, compare, and validate feasible approved-list and off-list unlock paths and estimate their costs without converting excluded Enhancements into generic fallback candidates; resolve the exact comparison method in each independently reviewed implementation story.

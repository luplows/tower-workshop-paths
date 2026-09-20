---
id: OQ-45
title: Detect patch drift in Enhancement cost data
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want Enhancement costs to get the same patch-drift protection
Workshop costs already have, so that a stale `src/data/enhancementLevels.js` does
not silently skew the buy-order the way a stale Workshop table would.

## Acceptance criteria

- [ ] **AC-1** — `scripts/verify-enhancement-costs.mjs` exists and is exposed as
      `npm run verify:enhancement-costs`, matching the invocation shape of
      `verify:workshop-costs` (`node --import
      ./scripts/lib/resolve-extensionless.mjs …`).
- [ ] **AC-2** — It compares `src/data/enhancementLevels.js` against
      mytower.app's live Enhancement tables and reports, per upgrade and level,
      whether the two agree.
- [ ] **AC-3** — Its exit code distinguishes the three outcomes
      `verify-workshop-costs.mjs` distinguishes, because `detect-drift.yml`'s
      retry-and-report logic is built on that distinction: clean, confirmed
      discrepancy, and could-not-complete (a fetch or layout failure). A
      could-not-complete must not be reported as drift.
- [ ] **AC-4** — The comparison, parsing and exit-code logic are pure exported
      functions with unit tests, as `verify-workshop-costs.mjs` has for
      `parseAbbreviated`, `classify` and `exitCodeForResults` in
      `scripts/verify-workshop-costs.test.mjs`. Tests must not reach the network.
- [ ] **AC-5** — Any comparison helper that already exists in
      `verify-workshop-costs.mjs` and applies unchanged to Enhancement data is
      **shared rather than copied**. Two independently-drifting copies of a
      rounding tolerance or an abbreviated-number parser is the defect this
      project already has a story about (OQ-71); name in the PR body which
      helpers were shared and which genuinely differ, with the reason.
- [ ] **AC-6** — Drift detection runs on a schedule for Enhancement data,
      producing the same outcome as the Workshop check: a confirmed discrepancy
      files an issue, a could-not-complete does not. Whether that is a second job
      in `.github/workflows/detect-drift.yml` or a separate workflow is the
      implementer's call — state which and why in the PR body.
- [ ] **AC-7** — A confirmed Enhancement discrepancy is distinguishable from a
      Workshop one in whatever it reports, so the issue says which dataset
      drifted.

## Out of scope

- **Re-syncing the data.** `npm run extract:enhancement-data` already does a full
  re-sync; this story adds a lightweight check, not a fix. A detected drift is
  reported, not corrected.
- **Changing `src/data/enhancementLevels.js`.** If the check finds real drift, the
  correction is separate work.
- **Workshop drift detection.** Already delivered by OQ-43. This story may share
  its helpers (AC-5) but does not change its behaviour.
- **Renaming `detect-drift.yml`** or restructuring the Workshop job beyond what
  AC-6 requires.

## Constraints

- Node, ESM, no new runtime dependencies. Playwright is already a dev dependency
  and is what the Workshop check drives.

## Context

Refined out of `Open-Questions.md` on 2026-09-19. OQ-43 scoped this out
deliberately rather than leaving it implicit: Enhancement data has no verify
script today, only `extract:enhancement-data`, which is a full re-sync tool
rather than a spot-check.

- `scripts/verify-workshop-costs.mjs` — the counterpart to mirror. Note its
  exported pure functions and the `ROUNDING_TOLERANCE` / `SUFFIX_SCALE` constants
  that AC-5 asks about.
- `scripts/verify-workshop-costs.test.mjs` — the house style for testing it
- `.github/workflows/detect-drift.yml` — the weekly schedule, the retry-once
  logic, and the issue-filing step AC-6 mirrors. Its header comment explains why
  a failed fetch and detected drift must not be conflated.
- `src/data/enhancementLevels.js`, `src/data/enhancementCategories.js` — the data
  under test
- OQ-43, in `Completed-Questions.md` — the Workshop half, and why it excluded this

## Open questions

*(none)*

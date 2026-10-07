---
id: OQ-45
title: Detect patch drift in Enhancement cost data
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: "On hold while the owner decides when drift checks run and how far to automate them. See Open questions. Session A clears this."
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
- `scripts/lib/mytower-scrape.mjs` — the shared scrape module. It exports
  `dismissConsent`, `readMaxLevelOnPage` and `extractFullCostCurve`, and
  `extract-enhancement-data.mjs` and `extract-workshop-data.mjs` already import
  `extractFullCostCurve` from it. `verify-workshop-costs.mjs` still defines its
  own `dismissConsent` and `readMaxLevelOnPage`.
- `scripts/extract-enhancement-data.mjs`, `ENHANCEMENT_NAME_ALIASES` — how this
  project's Enhancement names map to mytower.app's. It is a module-level
  constant, not exported.
- What the Workshop check costs mytower.app, from the scheduled run on
  2026-10-05: one headless-browser page load per upgrade (48), each waited on
  to `networkidle`, 350 ms apart (`NAV_DELAY_MS`), reading the max level and the
  three `checklistLevels` costs. That job took 2 min 36 s, and the four runs
  since 2026-09-16 took between 2 min 4 s and 2 min 56 s. Enhancement adds 18
  upgrades (`ENHANCEMENT_CATEGORIES`).

## Open questions

Recorded with the owner on 2026-10-07. The owner wants to hit mytower.app as
little as possible, and is still deciding how far to automate checking and
updating the data. Until that is settled the story is `blocked:`, and its ACs
may change.

1. **When a check runs.** Proposed: a daily job reads the game's current
   version from its Google Play listing (`com.TechTreeGames.TheTower`, which
   gets updates before the App Store) and runs the cost checks only when the
   major or minor number changes. A hotfix (the third number) does not trigger
   one (decided by the owner). Google Play has no documented interface for the
   version: it sits in data embedded in the page (`29.0.6` on 2026-10-07, while
   Apple's lookup service gave `29.0.5`). Failing to read it must fail the job
   visibly, as an exit-1 could-not-complete does today, and count as neither a
   change nor no change. Patch notes were considered as a trigger and judged
   unreliable.
2. **What records the last version checked, and who advances it.** Proposed: a
   file in the repository holding major.minor, changed only by a pull request.
   While Google Play is ahead of it, each scheduled run checks again, which
   covers mytower.app updating some days after the game. Open: whether that
   window is checked daily, weekly, or once with an issue opened. Proposed
   starting value: `29.0`, since the check on 2026-10-05 passed while Google
   Play was on 29.0.x.
3. **How far to automate.** In order: (a) detect and open an issue, as OQ-43
   does today; (b) the same, gated on the version as in 1; (c) on confirmed
   drift, re-extract and open a **draft** pull request with the new data, which
   only the owner can let land; (d) let that pull request land on a passing
   review. OQ-43 decided against automatic fixes because a misread page could
   overwrite good data. A draft pull request answers most of that, while (d)
   does not.
4. **How the work splits.** Proposed: a new story adds the version gate and
   runs the existing Workshop check behind it, replacing OQ-43's weekly
   schedule and updating `README.md`'s "Data drift" section. This story then
   shrinks to the Enhancement check, run behind the same gate, with
   `depends_on` on the new story.
5. **AC-2 levels.** "Per upgrade and level" could be read as every level. The
   Workshop check reads the max level and the three `checklistLevels` (level 1,
   the midpoint, the max). Proposed: the same for Enhancement, said explicitly.
6. **AC-5 sharing.** AC-5 names only helpers in `verify-workshop-costs.mjs`.
   Proposed: also name `scripts/lib/mytower-scrape.mjs` and
   `ENHANCEMENT_NAME_ALIASES`, so the new check reuses the existing Enhancement
   scraping rather than writing a third copy.

---
id: OQ-132
title: Remove the workflow code that moved to steward, keeping the tests of this repository's own CI
tier: next
kind: workflow
depends_on: [OQ-115]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the workflow's code gone from this repository once it runs
on steward (OQ-115), so that there is one copy of the engine and this repository
stays about the product. The tests that check this repository's own CI files are
kept, since steward does not have those files (decided 2026-10-08 by the owner:
only tests of files that move go to steward).

## Acceptance criteria

- [ ] **AC-1** — These paths are removed: `scripts/dispatch/`, `scripts/land/`,
      `scripts/report/`, `scripts/lint-stories.mjs`,
      `scripts/lint-stories.test.mjs`, `test/fixtures/`, and
      `.claude/prompts/coder.md` and `reviewer.md`.
- [ ] **AC-2** — A new `scripts/ci-workflows.test.mjs` holds the tests of this
      repository's workflow files that were in `scripts/dispatch/ci.test.mjs`:
      OQ-117's, OQ-118/AC-3's check that `ci.yml` names its setup steps with the
      `Setup: ` prefix, and OQ-124's. Their test names and assertions are
      unchanged. It holds its own copies of the text-scanning helpers they use.
- [ ] **AC-3** — `scripts/ci-workflows.test.mjs` takes the setup-step prefix
      from the pinned `steward` package, not from a string of its own, so a
      change of prefix in steward fails this repository's test when the pin
      moves.
- [ ] **AC-4** — Nothing outside `docs/`, `stories/` and `Completed-Questions.md`
      refers to a removed path, shown by a `git grep` in the pull request body.
      `npm run lint`, `npm test`, the build and steward's story lint pass.
- [ ] **AC-5** — `OQ-132` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "Portability", "Decided so far", as that
      document's "Reading this document" note says.

## Out of scope

- **`CLAUDE.md`, `REVIEW.md`, `stories/README.md` and `stories/_TEMPLATE.md`**
  (OQ-133), and **the moved documents** (OQ-134).
- **The four built stories that are steward's test fixtures** (OQ-51, OQ-68,
  OQ-69, OQ-70). Their originals stay in `stories/done/` here, as history.
- **`.github/pull_request_template.md`, `.oxlintrc.json` and `.gitignore`.**
  Steward took copies; the originals stay.
- **The workflow files.** OQ-115 already made them call steward.

## Constraints

- No new dependency beyond the `steward` package OQ-115 pins.

## Context

- Decided 2026-10-08 by the owner, refining OQ-115: the cut-over first, by hand,
  then this as an ordinary story run on steward's engine.
- On `main` at `c97aa50`, `scripts/dispatch/ci.test.mjs` holds OQ-117's tests
  (`describe` blocks from line 394), OQ-118/AC-3 (line 353), and the helpers
  `testJobStepBlocks`, `runTextOf` and `fieldsOfStep` (lines 311–351).
  `SETUP_STEP_PREFIX` comes from `ci.mjs`. OQ-124's tests are added later; their
  file is that story's choice.
- `scripts/verify-workshop-costs.test.mjs` is the one existing test this project
  keeps under `scripts/`, the precedent for the new file's place.

## Open questions

- The name steward's package exports the setup-step prefix under (AC-3): a
  steward-side requirement, listed in the design doc ("What adopting steward
  needs from it").
- Re-derive AC-2's list when this is refined to `ready`: OQ-124's tests, and
  any other test in a moved file that reads a file staying here (the
  bootstrap's B7a finds the same set).

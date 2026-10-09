---
id: OQ-137
title: Count the first clean-up in the install step's 5-minute budget, and check its allowance
tier: normal
kind: workflow
depends_on: [OQ-132]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the install step's worst case to count everything that
runs before the second try, so that "it fits in 5 minutes" is checked rather
than assumed.

## Acceptance criteria

- [ ] **AC-1** — OQ-136's AC-3 test in `scripts/ci-workflows.test.mjs` counts
      the clean-up after the first try in the step's worst case, with an
      allowance of 5 seconds that the test names: two tries, that clean-up,
      the wait and the repair, 2 × 120 + 5 + 30 + 20 = 295 seconds, below the
      step's 300. The test still reads every other number from the step's
      text, as it does today, and its name says it counts the clean-up.
- [ ] **AC-2** — OQ-136's AC-4 behavioural test in
      `scripts/install-cleanup.alone.test.mjs` fails, reporting the
      step's output, if the clean-up after the first try takes 5 seconds or
      more. The clean-up is the part of the step from the first try's
      `failed or timed out` log line to the end of the loop that kills the
      leftover processes. How it is timed is the coder's choice, but the
      step's own text does not change for it.
- [ ] **AC-3** — No file under `.github/workflows/` changes.
- [ ] **AC-4** — The **Planned (OQ-137)** passage in
      `docs/agent-workflow-design.md`, "What CI runs", is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Changing any of the step's limits** (`timeout 2m`, the 30-second wait,
  the 20-second repair, `timeout-minutes: 5` or `20`). If AC-2's test shows
  the clean-up needs more than 5 seconds, that is a finding for Session A,
  not a reason to move a limit.
- **The clean-up after the second try.** After the second try the step
  fails whatever happens, so the 5-minute limit ending it during that
  clean-up changes nothing; it is not counted.
- **Bounding the clean-up itself** (a `timeout` round it in the step): AC-3.

## Constraints

*(none)*

## Context

- From #243's review (2026-10-09, item 21, an observation the owner chose to
  act on): AC-3's worst case named the tries, the wait and the repair, but
  left out AC-1's clean-up while asserting there was "time left for the
  clean-up", so the 10 seconds of slack were accepted on judgement.
- The step, on `main` at `e2aa772`: `.github/workflows/ci.yml` lines 59–109,
  the same loop in `update-screenshots.yml` from line 70. The clean-up runs
  from line 73 (`echo "Playwright install attempt $attempt failed or timed
  out"`) to line 90: one `ps`, one `awk` and a `kill` per leftover process,
  falling back to `sudo kill`.
- **After OQ-132** (owner, 2026-10-09): OQ-132 moves both test files this
  story changes out of `scripts/dispatch/`, to the paths the ACs name. The
  line numbers below are from `main` at `e2aa772`, before that move.
- OQ-136's AC-3 test: `scripts/dispatch/ci.test.mjs` line 485; its worst case
  is computed at line 501 and asserted to be 290 at line 502.
- OQ-136's AC-4 behavioural test: `scripts/dispatch/install-cleanup.alone.test.mjs`
  line 67, run by CI's `Run the install clean-up test alone (OQ-136)` step
  with `VITEST_ALONE=1`, not by `npm test`. It runs the step's own text with
  a 2-second try limit; `runStep` and `report` are defined above it.
- OQ-136 (`stories/done/`): the clean-up, the wait and the repair.

## Open questions

*(none)*

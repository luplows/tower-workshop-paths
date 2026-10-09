---
id: OQ-136
title: Stop a timed-out Playwright install try before the next one, so the retry can recover from an apt hang
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: "ci-round-bound: CI has failed on 3 commits, the bound; failing jobs: test"
---

## Intent

As the owner, I want a CI install try that fails or reaches its time limit to
leave nothing running, so that the second try can do its job instead of failing
at once on the package lock the first try's `apt-get` still holds. OQ-117 added
the retry for exactly this kind of hang, and on 2026-10-09 it could not recover
from one, which stopped the queue.

## Acceptance criteria

- [x] **AC-1** — In the `Setup: Playwright browsers` step of both
      `.github/workflows/ci.yml` and `.github/workflows/update-screenshots.yml`,
      when a try fails or reaches its limit, every process it started is
      stopped before the next try begins, including an `apt-get` or `dpkg`
      started under `sudo`. The log says that leftover processes were stopped,
      or that none were found.
- [x] **AC-2** — Before the second try, the step waits until no process holds
      `/var/lib/dpkg/lock-frontend`, for at most 30 seconds, and then runs
      `sudo dpkg --configure -a`, so a package the first try left half
      installed is finished. The log says how long it waited.
- [x] **AC-3** — The step's limits are unchanged: at most two tries, each
      bounded by `timeout 2m`, a step `timeout-minutes: 5` and a job
      `timeout-minutes: 20`. The two tries, the wait and the clean-up fit
      within the step's 5 minutes. OQ-117's tests in
      `scripts/dispatch/ci.test.mjs` change only as far as the new step text
      requires, and keep their names and what they assert.
- [x] **AC-4** — Tests in `scripts/dispatch/ci.test.mjs` read both files'
      install steps and fail if either lacks AC-1's clean-up or AC-2's wait
      and repair. A test shows the clean-up working for real: a stand-in for
      the install command starts a child in a session of its own that holds a
      lock file and outlives its parent; after the first try's limit, the
      clean-up leaves that child stopped, and the next try takes the lock. It
      runs on Linux and is skipped elsewhere, with the skip named in the
      test's title. How the step's logic is made runnable from the test is the
      coder's choice.
- [x] **AC-5** — OQ-118's AC-3 test still passes unchanged: the step keeps its
      name and its `Setup: ` prefix, and no step the change adds is named with
      that prefix unless OQ-118's test requires it.
- [x] **AC-6** — The **Planned (OQ-136)** passage in
      `docs/agent-workflow-design.md`, "What CI runs", is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **`.github/workflows/detect-drift.yml`**, whose install OQ-117 left as it
  is: it gates no pull request.
- **Raising any limit**, a different apt mirror, or caching apt packages
  (OQ-117's Out of scope).
- **Clearing OQ-130's block** (#238). Session A does that, with the owner's
  agreement, once this lands.

## Constraints

- No new dependency.

## Context

- Found by the dispatcher session on 2026-10-09; confirmed from the logs.
  Main's run 37894111812 (on `210610a`, after OQ-127): try 1,
  `npx playwright install-deps chromium`, was fetching fonts from
  `azure.archive.ubuntu.com` at about 30 seconds a package when `timeout 2m`
  ended it; try 2 printed `E: Could not get lock /var/lib/dpkg/lock-frontend.
  It is held by process 13021 (apt-get)` within 3 seconds, and the step
  failed. #238's run 37904701752 (OQ-130, on `46728ed`) did the same with
  process 12924, and its log shows that `apt-get` still downloading after try
  2 had failed. OQ-130 stopped as `ci-setup-failed` (OQ-118).
- Why `timeout` missed `apt-get` is not established. One possibility is that
  `sudo` starts it in a session of its own (Ubuntu's `use_pty` default), out
  of reach of a signal to `timeout`'s process group. AC-1 asks for the outcome
  whatever the cause.
- The step today: `ci.yml` lines 55–70 and `update-screenshots.yml` lines
  70–85, on `main` at `a70ff83`, the same loop in both.
- `scripts/dispatch/ci.test.mjs`: `OQ117_WORKFLOWS` (line 381) and
  `installStepOf` (line 386); OQ-117's AC-3 and AC-4 tests at lines 425–451,
  which assert `timeout 2m` once and `timeout-minutes: 5`; OQ-118's AC-3 test
  at line 353.
- OQ-117 (`stories/done/`): the cache, the retry and the limits.

## Open questions

*(none)*

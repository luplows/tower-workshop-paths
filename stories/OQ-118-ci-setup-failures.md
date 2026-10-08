---
id: OQ-118
title: Stop, rather than retry the coder, when CI fails in a setup step
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a CI run that fails while setting up (checking out,
installing Node or dependencies, installing the browser) to stop the story
rather than send it back to a coder, so that an outage outside this repository
does not spend a coder session and one of the three red-round allowances on
something no coder can fix. Today `decideCi` (`scripts/dispatch/story.mjs`)
retries the coder on every run that concluded `failure`, and
`countRedCiRounds` (`scripts/dispatch/ci.mjs`) counts every one of them as a
red round.

## Acceptance criteria

- [ ] **AC-1** — In `.github/workflows/ci.yml`, job `test`, each setup step
      has an explicit `name:` that starts with `Setup: `: the
      `actions/checkout` step, the `actions/setup-node` step, the `npm ci`
      step and the Playwright browser install step. No other step's name
      starts with `Setup: `. Nothing else in a step changes: its `uses:`,
      `with:` and `run:` stay as they are.
- [ ] **AC-2** — `scripts/dispatch/ci.mjs` exports the prefix (`'Setup: '`)
      and the name GitHub gives a job's own first step (`'Set up job'`), and
      a function that says whether a step name is a setup step: it starts
      with the prefix, or is exactly `'Set up job'`. A cleanup step GitHub
      reports as `Post Setup: …` is not a setup step.
- [ ] **AC-3** — A Vitest test reads `.github/workflows/ci.yml` as text and
      checks it against AC-2's prefix, as `scripts/dispatch/github.test.mjs`
      checks its transcription against `review-gate.yml`. Every step of the
      `test` job whose `uses:` is `actions/checkout`, `actions/setup-node` or
      `actions/cache`, or whose `run:` contains `npm ci` or
      `playwright install`, has a name starting with the prefix, and no other
      step does. The test fails naming the offending step, and fails if it
      finds no setup step, so it cannot pass by reading nothing.
- [ ] **AC-4** — `waitForCi`'s `red` result says whether the run is a
      **setup failure**, and names the failed setup steps. A run is a setup
      failure when its failed jobs report at least one failed step, and every
      failed step of every failed job is a setup step (AC-2). A failed step
      is one whose `conclusion` is neither `success` nor `skipped`. This
      changes `failedJobsOf`: its step filter (`ci.mjs` line 222) is
      `s.conclusion === 'failure'` today, and becomes that rule, the same one
      its job filter (line 211) already uses, so the findings of every red
      run also name a step that was cancelled or timed out. A test shows a
      step with each of the conclusions `failure`, `cancelled` and
      `timed_out` named in `failedJobs` and the findings, and `success` and
      `skipped` steps left out. A failed job that reports no failed step
      makes the run not a setup failure.
- [ ] **AC-5** — `decideCi` returns a stop for a `red` result that concluded
      `failure` and is a setup failure: status `ci-setup-failed`, and a reason
      that names each failed setup step and says a coder retry cannot fix
      it. That is checked before the red-round bound, and `story.mjs` does
      not call `countRedCiRounds` for such a result. A test of the story run,
      with fakes, shows that a setup failure spawns no coder retry, makes the
      pull request a draft, and records `blocked:` with that status and
      reason on the story's branch, as every other stop does.
- [ ] **AC-6** — `countRedCiRounds` does not count a commit whose latest
      `ci.yml` run concluded `failure` as a setup failure (AC-4). It reads
      that run's jobs with the existing `buildListRunJobs` request, and only
      for commits whose latest run concluded `failure`. `assertAllowedCiRequest`'s
      four request shapes are unchanged.
- [ ] **AC-7** — The **Planned (OQ-118)** row in
      `docs/agent-workflow-design.md`'s "Failure paths" table is resolved as
      that document's "Reading this document" note says.

## Out of scope

- **Re-running CI.** Decided 2026-10-07 by the owner: a setup failure stops
  the story. `ci.mjs` stays read-only. Whoever runs the loop re-runs CI and
  resumes the story with `story.mjs OQ-n --pr <number>`.
- **Caching the browser, and timeouts on the install step and the job.** That
  is OQ-117, which depends on this story.
- **`.github/workflows/update-screenshots.yml`.** `ci.mjs` reads only
  `ci.yml` runs (`CI_WORKFLOW_PATH`), so its step names do not matter here.
- **`Post …` cleanup steps** and GitHub's `Complete job`. A failure there is
  not a setup failure under AC-2, and is left as it is.
- **The CI wait** (`CI_WAIT_TIMEOUT_MS`) and the `ci-wait-timed-out` stop.
- **The round bound itself** (`MAX_ROUNDS`).

## Constraints

- Read `ci.yml` as text in the test. Do not add a YAML parser (as OQ-94's
  Constraints say for its own test of `ci.yml`).

## Context

- What happened, 2026-10-07: CI runs 37666166945 and 37670027948 (#203,
  OQ-80) and 37666393802 attempt 1 and 37670802076 (#199) hung in
  `npx playwright install --with-deps chromium`, in the apt part, and were
  cancelled. Run 37666393802 attempt 2 failed in that step in about a minute:
  `cdn.playwright.dev` returned 403 AccessDenied ("this service is not
  available in your location") to five attempts, and the run concluded
  `failure`. Under `decideCi`, a `failure` like that is a coder retry.
- `scripts/dispatch/ci.mjs`: `failedJobsOf` keeps jobs whose conclusion is
  neither `success` nor `skipped` (line 211), and collects their steps whose
  conclusion is `failure` (line 222, which AC-4 changes);
  `waitForCi` returns `{ result: 'red', conclusion, failedJobs, jobNames,
  findings }`; `countRedCiRounds` counts commits whose latest run concluded
  `failure`; `buildListRunJobs` and `assertAllowedCiRequest`.
- `scripts/dispatch/story.mjs`: `decideCi`, which stops on any conclusion but
  `failure` (`ci-concluded-<conclusion>`, OQ-48's AC-5) and retries a
  `failure` under `MAX_ROUNDS`; the run loop's `ci` phase, which calls
  `countRedCiRounds` only for a `failure`.
- Step names as the Actions jobs API reports them: a step with no `name:`
  is `Run <command>` (for example `Run npm ci`, `Run actions/checkout@v4`);
  a named step is its name; GitHub's own steps are `Set up job` and
  `Complete job`; cleanup steps are `Post <name>`. Seen on run 37675969621.
- `scripts/dispatch/github.test.mjs`, "Guard the transcription above against
  drifting from the workflow itself": the house pattern for a test that
  reads a workflow file.
- OQ-94 (`stories/OQ-94-name-lint-command.md`) reads `ci.yml`'s `run:` lines
  that start with `npm `. AC-1 adds `name:` keys and changes no `run:` line.
- OQ-102 (`stories/OQ-102-usage-threshold.md`) derives a paused story from a
  `failure` with no `blocked:` at the head. A setup-failure stop records
  `blocked:`, so it is never read as paused.

## Open questions

*(none)*

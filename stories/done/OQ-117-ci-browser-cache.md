---
id: OQ-117
title: Cache CI's Playwright browser, and give the install step and the job time limits
tier: fix
kind: workflow
depends_on: [OQ-118]
model: sonnet
blocked: null
---

## Intent

As the owner, I want CI to skip downloading the browser when it already has the
right one, and to give up quickly when installing hangs, so that an outage
outside this repository fails a run in minutes, not hours, and fails it less
often. On 2026-10-07 four runs hung in
`npx playwright install --with-deps chromium` until they were cancelled, and
one failed there when `cdn.playwright.dev` refused the download. Neither
`ci.yml` nor `update-screenshots.yml` sets a time limit, so a hung run would
have held CI for GitHub's default of 360 minutes.

## Acceptance criteria

- [x] **AC-1** — In `.github/workflows/ci.yml`, job `test`, an
      `actions/cache` step restores and saves `~/.cache/ms-playwright`. Its
      key contains the runner's OS and the `@playwright/test` version that
      `npm ci` installed (the version resolved in `package-lock.json`, not the
      `^1.63.0` range in `package.json`), so a new Playwright version misses
      the cache and installs its own browser.
- [x] **AC-2** — On a cache hit, the install step runs only
      `npx playwright install-deps chromium`. On a miss, it runs
      `npx playwright install --with-deps chromium`, as today.
- [x] **AC-3** — The install step tries at most twice. Each try has its own
      time limit, and the two limits together fit inside the step's
      `timeout-minutes` (AC-4). It tries a second time only if the first
      failed or reached its limit, and the log says which try is running.
- [x] **AC-4** — The install step sets `timeout-minutes: 5`, and job `test`
      sets `timeout-minutes: 20`.
- [x] **AC-5** — `.github/workflows/update-screenshots.yml`, job
      `baselines`, gets AC-1 to AC-4 too, with the same cache key, so that it
      mints baselines with the same browser that `ci.yml` compares them
      against.
- [x] **AC-6** — Every step this story adds to or changes in `ci.yml` passes
      OQ-118's AC-3 test: the cache step and the install step are named with
      the `Setup: ` prefix, and no other step it adds is.
- [x] **AC-7** — The screenshot baselines do not change. The diff touches
      nothing under `e2e/__screenshots__/`, and `npm run test:e2e` passes in
      CI against the existing baselines on both a cache miss and a cache hit
      (AC-8).
- [ ] **AC-8** — The pull request body links two green `ci.yml` runs on the
      same `package-lock.json`, and quotes their install step's log:
      - the first misses the cache, and its log has
        `Downloading Chrome for Testing`;
      - the second, on a later commit of the same branch, hits the cache,
        runs `install-deps` only, and its log has no
        `Downloading Chrome for Testing` line.
- [x] **AC-9** — The **Planned (OQ-117)** passage in
      `docs/agent-workflow-design.md`, "What CI runs", is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **What the dispatcher does with a run that fails in setup.** That is
  OQ-118, which this story depends on, so that a timed-out install stops the
  story rather than costing a coder retry.
- **A refused browser download on a cache miss**, such as the 403 seen on
  2026-10-07. The cache makes it rarer. It does not prevent it.
- **Caching apt packages**, or running the job in Playwright's container
  image. The image would change the rendering environment, and with it the
  baselines.
- **Playwright's own test retries** (`retries` in `playwright.config.js`).
- **Upgrading Playwright.**
- **`.github/workflows/detect-drift.yml`**, whose line 60 runs the same
  `npx playwright install --with-deps chromium` with no time limit. It runs
  once a week on a schedule and gates no pull request, so a hang there costs
  only Actions minutes and a failure email (decided 2026-10-08 by the owner).

## Constraints

- Generating screenshot baselines locally is not allowed (`CLAUDE.md`,
  "Testing"). AC-7 is shown on CI.

## Context

- What happened, 2026-10-07, from the Actions API and the job logs:
  - Runs 37666166945 and 37670027948 (#203) and 37666393802 attempt 1 and
    37670802076 (#199) hung in the install step. In each, apt fell back from
    `azure.archive.ubuntu.com` to `archive.ubuntu.com`, logged `Get:5 …
    noble-security InRelease`, and printed nothing more until it was
    cancelled. The browser download had not started.
  - Run 37666393802 attempt 2 failed in the install step in about a minute.
    apt worked. `cdn.playwright.dev` returned `403 AccessDenied` ("this
    service is not available in your location") to five download attempts,
    and the run concluded `failure`.
  - #203's hang outlasted `story.mjs`'s 30-minute CI wait
    (`CI_WAIT_TIMEOUT_MS`, `scripts/dispatch/ci.mjs`), so OQ-80 stopped
    with `ci-wait-timed-out` (commit `1dc706a` in #203,
    which later landed as `a0361cb`).
- How long things take, over the last 40 green `ci.yml` runs: the job took
  60 to 171 s (median 82 s), and the install step 16 to 111 s (median 22 s).
  Over the last 5 green `update-screenshots.yml` runs: the job took 51 to
  55 s, and the install step 21 to 23 s.
- The installed version: `@playwright/test`, `playwright` and
  `playwright-core` are 1.63.0 in `package-lock.json`. Its `browsers.json`
  gives chromium revision 1243, Chrome for Testing 153.0.8010.12, the build
  the failed log names.
- `.github/workflows/ci.yml` line 34 and
  `.github/workflows/update-screenshots.yml` line 58: the install step today.
- GitHub's workflow syntax reference: a job's `timeout-minutes` defaults to
  360; a step's `timeout-minutes` has a maximum of 360.
- `playwright.config.js`: why the baselines are tied to CI's chromium build.
- OQ-94 (`stories/OQ-94-name-lint-command.md`) reads `ci.yml`'s `run:` steps
  that start with `npm `. The install step starts with neither `npm ` nor
  `npm ci`.

## Open questions

*(none)*

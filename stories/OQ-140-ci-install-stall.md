---
id: OQ-140
title: Stop a slow Ubuntu mirror failing CI's Playwright install
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want CI's Playwright install to stop failing when the Azure
Ubuntu mirror is slow, so that a pull request, or `main`, is not stopped by a
download that has nothing to do with its change.

## Acceptance criteria

The step is `Setup: Playwright browsers`, in `.github/workflows/ci.yml` and in
`.github/workflows/update-screenshots.yml`. Every AC applies to both files.

- [ ] **AC-1** — Before the install step, a step restores a cache of apt
      package files with `actions/cache/restore@v4`. Its path is a directory
      the runner user owns, and its key is built from `runner.os`, the
      `ImageOS` and `ImageVersion` environment variables, and the Playwright
      version from `steps.playwright-version`. When the cache is restored, the
      install step copies its `.deb` files into `/var/cache/apt/archives/`
      with `sudo` before the first try, and logs how many it copied.
- [ ] **AC-2** — When the install succeeds and AC-1's cache was not
      restored, a step copies `/var/cache/apt/archives/*.deb` into that
      directory and saves it with `actions/cache/save@v4` under the same key.
      A failed install saves nothing.
- [ ] **AC-3** — Before the second try, after the wait and the repair, the
      step points apt at `http://archive.ubuntu.com/ubuntu/` in place of the
      runner's mirror list, `/etc/apt/apt-mirrors.txt`. The switch:
      - runs under `sudo timeout 10s`;
      - logs the mirror list before and after;
      - if it fails or times out, is logged and does not stop the second try,
        as the repair does today.
- [ ] **AC-4** — The step's `timeout-minutes` goes from 5 to 6. The per-try
      `timeout 2m`, the 30-second wait, the 20-second repair and the job's
      `timeout-minutes: 20` do not change.
- [ ] **AC-5** — The worst-case test, today OQ-136/AC-3's in
      `scripts/dispatch/ci.test.mjs`, counts everything that runs before the
      second try ends:
      - two tries;
      - the clean-up after the first try, with a 5-second allowance that the
        test names as a constant;
      - the wait, the repair and the mirror switch's limit.

      That is 2 × 120 + 5 + 30 + 20 + 10 = 305 seconds, below the step's 360.
      Every number except the allowance is read from the step's text, as
      today, and the test's name says what it counts.
- [ ] **AC-6** — The behavioural test, `install-cleanup.alone.test.mjs`
      (OQ-136/AC-4), fails if the clean-up after the first try takes 5
      seconds or more, and reports the step's output. The clean-up is the
      part of the step from the first try's `failed or timed out` log line to
      the end of the loop that kills leftover processes. The mirror switch is
      replaced in the test's substitutions, as the try's command is, so that
      running the test never changes the machine's apt configuration.
- [ ] **AC-7** — Tests named `OQ-140/AC-1` to `OQ-140/AC-4`, in
      `scripts/dispatch/ci.test.mjs`, read both workflow files. Each asserts
      its AC's text: the restore step and its key, the copy into
      `/var/cache/apt/archives/`, the save step and the condition it runs
      under, the mirror switch and its bound, and `timeout-minutes: 6`.
      Existing tests that pin `timeout-minutes: 5` or the 290-second worst
      case are updated to the new numbers. This story authorises that, and
      the pull request names each one.
- [ ] **AC-8** — The pull request's Verification quotes the install step's
      log from a CI run on its own branch in which AC-1's cache was restored.
      It shows the count of copied `.deb` files and apt's `Need to get` line.
- [ ] **AC-9** — The **Planned (OQ-140)** passage in
      `docs/agent-workflow-design.md`, "What CI runs", is resolved as that
      document's "Reading this document" note says.

## Out of scope

- Running the job in Playwright's Docker image. It would avoid apt
  altogether, but it changes the machine the screenshot baselines are drawn
  on, so every baseline would be regenerated. Session A advised against it,
  and the owner chose AC-1 to AC-3 instead (2026-10-26).
- The clean-up after the second try. The step fails then whatever happens,
  so it is not counted (as OQ-137 had it).
- Moving the tests out of `scripts/dispatch/`. That is OQ-132's, which
  carries these tests to their new paths.
- Steward's copies of these workflows. A matching steward story is the
  owner's to raise there.

## Constraints

- This is a `fix` story under the frozen-engine rule
  (`docs/agent-workflow-design.md`, "Until it adopts steward, this repository
  runs its own engine, frozen"): the stall stops this repository's loop.

## Context

- **What fails.** On 2026-10-26 the step failed in five CI runs: #260 at
  de40305, #263 at 89531aa, #264 at 5e3a2b5, and `main` at 103e45a and at
  69db298. The `Screenshot baselines` run at 497aedf failed the same way.
  The log of #264's run (40365636125), from 17:08 to 17:12:
  - Fetching the package lists took 1 second: `Fetched 12.6 MB in 1s
    (9703 kB/s)`.
  - Then `8 upgraded, 9 newly installed`, and `Need to get 25.9 MB of
    archives`, all from `http://azure.archive.ubuntu.com/ubuntu`.
  - Try 1 spent about 110 seconds on `fonts-ipafont-gothic` (3513 kB) and
    timed out at 2 minutes.
  - OQ-136's clean-up stopped the leftover process, and try 2 started at
    once.
  - Try 2 stalled on `libglib2.0-0t64` (1548 kB) and `fonts-freefont-ttf`
    (5641 kB), and timed out.

  The dispatcher session reported the same mirror, packages and stall in
  each of the other runs it read. The CI runs between 16:15 and 16:43 the
  same day passed this step.
- **The cache (AC-1, AC-2).** The step already caches the browsers
  (`Setup: cache Playwright browsers`, `~/.cache/ms-playwright`). On a hit it
  runs `npx playwright install-deps chromium`, which still downloads every
  system package. apt uses a `.deb` already in `/var/cache/apt/archives/`
  when its version matches, so a restored cache leaves only packages updated
  since it was saved to download. That directory is root's, which is why
  the cache is kept in a directory of the runner user's.
- **The mirror (AC-3).** The log's `Get:1 file:/etc/apt/apt-mirrors.txt
  Mirrorlist` shows that the runner reads its mirrors from that file. Its
  contents are not recorded here. AC-3 logs them, and the switch must keep
  the security and updates pockets working.
- **The budget (AC-4, AC-5).** Today's step: two tries × 120 + 30 + 20 = 290
  of 300 seconds, asserted at `scripts/dispatch/ci.test.mjs` line 516 (on
  `main` at 69db298, in the test at line 501). Adding OQ-137's 5-second
  clean-up allowance and the 10-second switch makes 305. So the step's limit
  goes to 6 minutes, rather than any per-part limit shrinking.
- **The step**, on `main` at 69db298: `ci.yml` lines 59–109, and
  `update-screenshots.yml` lines 70–125. CI runs the behavioural test in
  `ci.yml`'s `Run the install clean-up test alone (OQ-136)` step, lines
  36–37.
- **OQ-137 is retired into this story** (owner, 2026-10-26). Its two ACs,
  counting the clean-up and checking its allowance, are AC-5 and AC-6 here.
  It forbade changing any workflow file or limit, and its sum, 295 of 300,
  no longer holds once AC-3 adds a step. It waited on OQ-132; this cannot
  wait.
- OQ-136 and OQ-117, in `stories/done/`: the retry, the clean-up, the wait
  and the repair, and the 5- and 20-minute limits.

## Open questions

*(none)*

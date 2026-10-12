---
id: OQ-138
title: Run CI again after update-screenshots.yml commits baselines, instead of retrying the coder
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a story that changes the app's appearance to get through
the loop without stopping, so that a product story is not halted by the
baseline step `CLAUDE.md` tells its coder to follow. A coder that deletes
stale screenshot baselines makes CI fail on the missing images, while
`update-screenshots.yml` commits new ones to the branch. `story.mjs` reads the
red CI as the coder's failure and retries it. The retried coder rightly
changes nothing, and the story stops with `ci-retry-no-commit`. The bot's
commit gets no CI run that can pass, because a push made with `GITHUB_TOKEN`
starts none that runs. This stopped OQ-8 on #252.

## Acceptance criteria

- [ ] **AC-1** — When `waitForCi` reports a red `failure` on head S, other
      than a setup failure, `runStory` first waits for
      `update-screenshots.yml`'s `pull_request` run on S to finish, if there
      is one. It finds that run through the commit's workflow runs, by
      workflow path, as `ci.mjs` finds CI's. It then reads the branch's head
      H from `origin`.
- [ ] **AC-2** — A baseline commit is recognised when H differs from S, and
      every commit after S up to H is authored by `github-actions[bot]` and
      changes only files under `e2e/__screenshots__/`. The test is a pure,
      exported function, unit-tested for these cases:
      - one such commit, which is recognised;
      - H equal to S, which is not;
      - a commit after S by any other author, which is not;
      - a bot commit that also changes a file outside
        `e2e/__screenshots__/`, which is not.
- [ ] **AC-3** — On a recognised baseline commit, `runStory` does not retry
      the coder. It commits an empty commit on H, with a message naming
      `update-screenshots.yml`, and pushes it with `pushBranch`, as
      `recordBlocked` pushes its commit. It then waits for CI on the new head
      and carries on from that result as from any CI result.
- [ ] **AC-4** — `runStory` does AC-3 at most once per run. A second red CI
      after it is decided as today, by `decideCi`.
- [ ] **AC-5** — When no baseline commit is recognised, the run goes on as
      at `f5cb7b1`: `decideCi`'s retry, with the same round count and the
      same findings.
- [ ] **AC-6** — If the empty commit's push fails, the run stops through
      `runStory`'s `stop`, as any other stop does, with a status naming the
      push failure.
- [ ] **AC-7** — `scripts/dispatch/story.test.mjs` adds tests named
      `OQ-138/AC-…`, through `runStory`'s injected dependencies, for:
      - a red CI, a recognised baseline commit, then green CI on the empty
        commit, which goes on to review, with no `retryStory` call;
      - a red CI with no baseline commit, which calls `retryStory` as before;
      - a red CI, a recognised baseline commit, then red CI again, which
        retries the coder and does not push a second empty commit.

      The existing tests in that file still pass, unmodified.
- [ ] **AC-8** — The `**Planned (OQ-138)**` marker in
      `docs/agent-workflow-design.md` is resolved, as that document's "Reading
      this document" note says.

## Out of scope

- **The red round on S.** `countRedCiRounds` still counts it as one of
  `MAX_ROUNDS`, although the coder was not at fault. Leaving it in keeps the
  count derived from GitHub, not remembered.
- **`update-screenshots.yml` and `ci.yml`.** Neither changes. Starting CI from
  the baseline job would need a token other than `GITHUB_TOKEN`, or a
  `workflow_dispatch` run of CI, which skips the containment step, since that
  step runs only on `pull_request`.
- **Approving the bot commit's `action_required` runs.** The empty commit
  starts a new run instead.
- **`decideRetry`'s reason for `ci-retry-no-commit`**, "the head is unchanged".
  AC-1 to AC-3 stop this case from reaching it.
- **Steward's copy of `story.mjs`.** It has the same gap. Under the frozen
  engine's rule (`docs/agent-workflow-design.md`, "Portability", "Decided so
  far"), it gets a matching steward story, written in steward.

## Constraints

*(none)*

## Context

- What happened on #252 (OQ-8), from GitHub's runs and commits API, read on
  2026-10-12:
  - the coder's `0ccdef3` (18 files) deleted the 7 stale baselines, as
    `CLAUDE.md`'s Testing section says to;
  - `update-screenshots.yml` ran on `0ccdef3` from 06:36:27 to 06:37:24
    (success), and committed the 7 images as `b9fa40f`, authored by
    `github-actions[bot]`, touching only `e2e/__screenshots__/`;
  - `ci.yml` on `0ccdef3` concluded `failure` at 06:38:09, after `b9fa40f`
    was already on the branch;
  - `b9fa40f`'s runs of `ci.yml`, `review-gate.yml` and
    `update-screenshots.yml` all concluded `action_required` at once;
  - the retried coder pushed nothing, so `decideRetry` stopped the story with
    `ci-retry-no-commit`, and `recordBlocked` pushed `2280e4f`. That push
    started a normal `ci.yml` run, which passed. AC-3's empty commit is that
    push, made on purpose.
- `update-screenshots.yml`'s header: "a push made with GITHUB_TOKEN does not
  trigger further workflow runs, so the CI run that compares against a
  freshly-committed baseline is the one started by the *next* push to the
  branch". It runs on `pull_request` for changes under `e2e/**`, so it runs
  alongside `ci.yml` on the same head.
- `scripts/dispatch/story.mjs`:
  - `decideCi` returns `retry` for a non-setup `failure` under the bound;
  - `decideRetry` turns a `body-replaced` retry with source `ci` into
    `ci-retry-no-commit`;
  - `recordBlocked` makes and pushes a commit on the story branch from a
    scratch worktree, with `pushBranch` from `coder.mjs`;
  - `runStory`'s dependencies are injectable (`deps`).
- `scripts/dispatch/ci.mjs`: `buildListRunsForCommit` lists a commit's
  workflow runs, and `latestCiRun` picks CI's by `CI_WORKFLOW_PATH`.
  `createCiContext`'s allowlist already permits that request.
- `scripts/dispatch/coder.mjs` line 128: `SCREENSHOT_DIR =
  'e2e/__screenshots__/'`.
- Written 2026-10-12 by Session A, at the owner's request, after the
  dispatcher session's report. It is a `fix` story under the frozen engine,
  since it stops this repository's loop on every story that changes
  appearance.

## Open questions

*(none)*

---
id: OQ-124
title: Run CI and the Pages deploy on main after the sweep lands a pull request
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want CI and the Pages deploy to run on `main` after the landing
sweep merges a pull request, and to do nothing after a sweep that merged
nothing, so that `main` is checked and deployed again without spending runner
minutes on runs that change nothing. Today neither runs: the sweep merges with
`github.token`, and a push made with that token starts no workflow, so the last
`push` runs of `ci.yml` and `deploy-pages.yml` were on 2026-09-28.

## Acceptance criteria

- [ ] **AC-1** — `.github/workflows/ci.yml` is also triggered by `workflow_run`
      on the workflow named `Land approved PRs`, with `types: [completed]`. Its
      `pull_request` and `push` triggers are unchanged.
- [ ] **AC-2** — `.github/workflows/deploy-pages.yml` is also triggered by the
      same `workflow_run`. Its `push` and `workflow_dispatch` triggers are
      unchanged.
- [ ] **AC-3** — In both files, every job with no `needs:` has this condition,
      exactly:
      `if: github.event_name != 'workflow_run' || github.event.workflow_run.head_sha != github.sha`.
      So a run started by any other event behaves as it does today, and a run
      started by a sweep that left `main` where it was is skipped at the job,
      before any runner starts. A job with `needs:` (`deploy-pages.yml`'s
      `deploy`) is left without one, since it is skipped when the job it needs
      is.
- [ ] **AC-4** — No checkout step in either file is given a `ref:`. On a
      `workflow_run` event the checkout takes `github.sha`, the latest commit
      on `main`, not the commit the sweep started from.
- [ ] **AC-5** — Tests read both workflow files as text and fail when AC-1, AC-2,
      AC-3 or AC-4 does not hold. The workflow name the trigger must match is
      read from `land-approved.yml`'s own `name:` line, so renaming the sweep
      without updating the trigger fails the test.
- [ ] **AC-6** — Both **Planned (OQ-124)** markers in
      `docs/agent-workflow-design.md`, in "Platform constraints", "GitHub
      mechanics", and in "Portability", "Decided so far", are resolved as that
      document's "Reading this document" note says.

## Out of scope

- **`land-approved.yml`.** It is not changed: no new permission, no token and
  no secret. The sweep does not start the other workflows itself (decided
  2026-10-08 by the owner).
- **OQ-117's AC-8 evidence** (a cache hit on a pull request after a run on
  `main` has saved the cache). It can only be seen on runs after this story
  lands. Session A records it then, in OQ-117's story file.
- **`update-screenshots.yml` and `detect-drift.yml`.**
- **Steward's `ci.yml`**, written at the bootstrap (`docs/steward-bootstrap.md`,
  B6), and the second project's workflow files, written by `init` (design doc,
  "Portability", R2).
- **Proving the trigger on GitHub.** A `workflow_run` trigger takes effect only
  from the default branch, so it cannot run on this story's pull request.
  Session A checks the first sweeps after it lands, one that merges and one
  that does not.

## Constraints

- No new dependency. The tests scan the workflow files as text, as
  `ci.test.mjs` does for OQ-117 and OQ-118, rather than parsing YAML.

## Context

- The sweep: `.github/workflows/land-approved.yml`, `name: Land approved PRs`
  (line 1), triggered by `workflow_dispatch` only (line 28), merging with
  `GH_TOKEN: ${{ github.token }}` (line 54).
- GitHub's documentation ("Triggering a workflow", read 2026-10-08): events
  caused by `GITHUB_TOKEN` create no workflow run, except `workflow_dispatch`
  and `repository_dispatch`. ("Events that trigger workflows", `workflow_run`,
  read 2026-10-08): `GITHUB_SHA` is the last commit on the default branch,
  `GITHUB_REF` the default branch, and the event fires only if the workflow
  file is on the default branch.
- `github.event.workflow_run.head_sha` is the commit the sweep run started
  from. For the last four sweep runs (2026-10-08, `gh run list --workflow
  land-approved.yml`) it was `main`'s tip just before that run's merge: runs on
  `8ce57c4`, `a242854`, `94475a0` and `c0b579a`, which merged as `a242854`,
  `94475a0`, `c0b579a` and `0a9254b`.
- Why there is no `conclusion == 'success'` test in AC-3: a sweep that merged
  and then failed in a later step (`delete-merged-heads.mjs`) still moved
  `main`, and the SHA comparison alone runs CI for it.
- The last `push` runs of `ci.yml` and `deploy-pages.yml` were on `75588f7`, on
  2026-09-28 (`gh run list --event push --branch main`). The Playwright browser
  cache (OQ-117) has been saved only from pull request refs since:
  `Linux-playwright-1.63.0` on `refs/pull/218/merge`, `219` and `220`, none on
  `main` (`gh api …/actions/caches`, 2026-10-08).
- The Pages environment `github-pages` allows deployments from the branch
  `main` only (`gh api …/environments/github-pages/deployment-branch-policies`,
  2026-10-08). A `workflow_run` run's ref is the default branch.
- `ci.yml`'s story containment step already runs only on `pull_request`
  (line 31). `ci.mjs` reads `ci.yml` runs by a pull request's head SHA
  (line 169), and a squash merge on `main` is no pull request's head, so these
  runs do not change what the loop reads as a story's CI.
- How a skipped job is billed is not stated in GitHub's billing documentation
  ("GitHub Actions billing", read 2026-10-08). A job skipped by its `if:` never
  starts a runner. This repository is public, where standard runners are free;
  the condition matters for the owner's private repository.
- House style for text-scanning workflow files: `scripts/dispatch/ci.test.mjs`,
  `testJobStepBlocks` and the OQ-117 tests.

## Open questions

*(none)*

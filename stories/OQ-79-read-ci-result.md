---
id: OQ-79
title: Read a pull request's CI result, and turn a failure into findings for a retry
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the dispatch loop, I need to know whether CI passed on a pull request's
head, and if it failed, what failed in words a coder can act on. Then a red
CI can be retried like a blocking review, instead of leaving a PR that can
never land and that nothing reports.

## Acceptance criteria

- [ ] **AC-1** — A new module, `scripts/dispatch/ci.mjs`, has an entry point
      that takes a head SHA. It waits for the CI workflow's run on that commit
      to finish, then returns one of: `green`; `red`, with each failed job's
      name; or `timed-out`. The wait is bounded, and the bound is a constant
      named in the module. A test covers each result.
- [ ] **AC-2** — CI means the runs of `.github/workflows/ci.yml` for that head
      SHA, identified by the workflow file, not by job or check name. The
      check runs on a PR head also include `review-gate.yml`'s `pending` and
      `verdict` jobs, and they are not CI. A test gives a head whose
      `review-gate.yml` jobs failed but whose `ci.yml` run passed, and asserts
      `green`. If the head has more than one `ci.yml` run (a re-run), the
      latest attempt decides.
- [ ] **AC-3** — For `red`, the result also carries **findings text** a retry
      can use as-is. It says that CI failed rather than review, and names each
      failed job and step. It includes an excerpt of each failed job's log,
      taken from the log's end and capped at a length named as a constant in
      the module. The text is handed on as data, and bounding it is the retry
      prompt's job (OQ-48's AC-4). A test uses a log excerpt that quotes
      marker and heading syntax, renders it as a retry's findings through
      `invocation.mjs`, and asserts exactly one begin and one end marker.
- [ ] **AC-4** — A function derives the number of **red CI rounds** on a pull
      request from GitHub alone: the number of distinct commits on the PR
      whose latest `ci.yml` run concluded `failure`. Nothing is stored. A test
      asserts the count is the same when computed by a fresh process with no
      memory of earlier calls.
- [ ] **AC-5** — `ci.mjs` only reads. It has its own allowlist, checked before
      any network call, as `github.mjs`'s `send` does. It permits only the `GET`
      requests this story needs: the workflow runs for a commit, a run's jobs, a
      job's log, and a PR's commits. A test asserts that every write is
      refused before the network. `github.mjs`'s allowlist and its OQ-68/AC-3
      tests are unchanged.
- [ ] **AC-6** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-79 is resolved as that
      document's "Reading this document" note says. OQ-79 comes out of the
      marker (the whole marker, if it names no other story), and the passage is
      corrected wherever what was built differs from what it describes.

## Out of scope

- **Retrying.** OQ-48's loop decides whether a red run is retried and applies
  the bound. This module reports and counts.
- **Landing.** OQ-50.
- **Re-running a failed job, or deciding a failure was flaky.** A red run
  counts as a round even if a re-run would have passed. If flakes turn out to
  cost real rounds, that is a separate story, with the evidence.
- **CI on anything other than a pull request head.**

## Constraints

- Node, ESM, no new runtime dependencies.
- A job's log is untrusted text: the PR's code wrote it.

## Context

- `.github/workflows/ci.yml`: one job, `test` (lint, Vitest, build,
  Playwright). The check runs on #142's head
  (0a2b94555ea7c35f42ba60a7757ddd422bedbf68) were `test`, `pending` and
  `verdict`, all from `github-actions`. That is why AC-2 filters by workflow.
- `scripts/dispatch/github.mjs`: the allowlisted `send` that AC-5 copies the
  shape of, and the OQ-68/AC-3 tests that must stay as they are.
- `scripts/dispatch/invocation.mjs`: the retry block, which already bounds
  `{{FINDINGS}}` with `wrapInjectedBlock`.
- The owner decided on 2026-09-25 that a red CI is retried like a blocking
  review. OQ-48 holds the rule and the bound; this story supplies what it
  needs.
- The known local flake (`review.test.mjs`'s fixture hook, OQ-78's AC-7) has
  not been seen on CI, where that file runs in about 3 s. It is the kind of
  failure the out-of-scope re-run would address.

## Open questions

*(none)*

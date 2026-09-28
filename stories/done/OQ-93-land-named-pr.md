---
id: OQ-93
title: Have land.mjs name its pull request to the sweep, and the sweep land only that one
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want `land.mjs` to land the pull request it was called for
and nothing else, so that what reaches `main` is what the loop decided to
land. Today it triggers a sweep that lands the **oldest** landable pull
request, which may be a different one. When that happens, `land.mjs` spends
its triggers on other pull requests, and `story.mjs` can stop a story that
passed. It also lands pull requests nobody asked it to, including any that
the owner is holding back.

## Acceptance criteria

- [x] **AC-1** — `land-approved.yml`'s `workflow_dispatch` takes an optional
      string input, `pr`. **Given** a number, the sweep considers only that
      pull request:
      - If it is not open, is a draft, or does not target `main`, the run
        lands nothing.
      - Otherwise every check the sweep makes today applies to it, unchanged:
        the `review-blocked` skip, the circuit breaker with its two
        exemptions, `mergeable_state` `clean`, `review/agent` re-checked
        directly, and `--match-head-commit`.
      - A run given a pull request never goes on to another one. If the named
        pull request does not land, the run lands nothing.

      **Not given**, or given as an empty string, the sweep behaves exactly
      as today: the oldest landable non-draft pull request against `main`,
      one per run. That is the owner's `gh workflow run land-approved.yml`,
      and the form the `land.mjs` on `main` sends until this story lands.
- [x] **AC-2** — Choosing the candidates moves out of the workflow's shell
      into a module, `scripts/land/select-candidates.mjs`. The workflow
      calls it, as it calls `delete-merged-heads.mjs` (OQ-52). It takes the
      open pull requests as the sweep lists them (created, ascending) and
      the `pr` input, and returns the numbers to try, in order. A `pr` value
      that is neither empty nor matched by `^[1-9][0-9]*$` makes it exit
      non-zero, so the run fails having merged nothing. Tests cover:
      - no input: drafts and pull requests against another base are left
        out, and the order is kept;
      - a named pull request that is eligible: exactly that number;
      - a named pull request that is a draft, targets another base, or is not
        in the list: no candidates;
      - invalid values `0`, `-1`, `7 8`, `7;x` and `07`: each is refused.
- [x] **AC-3** — The input reaches the module only through `env:`. No `run:`
      block in `land-approved.yml` contains `${{ inputs.` or
      `${{ github.event.inputs.`. A test reads the workflow and asserts both
      that and that the landing step runs `select-candidates.mjs`, as
      `delete-merged-heads.test.mjs` reads the workflow for OQ-52.
- [x] **AC-4** — `land.mjs` names its pull request on every trigger.
      `buildDispatchSweep(repo, number)` builds
      `{ ref: 'main', inputs: { pr: '<number>' } }`, and `landPullRequest`
      passes its own `number`. `assertAllowedRequest` admits the dispatch
      only in that shape: `ref` `main`, and `inputs` with the one key `pr`,
      matching `^[1-9][0-9]*$`. A dispatch with no `inputs` is refused, as
      are extra keys, another input name and a non-numeric `pr`. Tests
      assert those refusals before the network, and that a run of
      `landPullRequest({ number: 7 })` sends only dispatches naming `'7'`.
      Four existing OQ-50 tests in `land.test.mjs` build or expect the old
      dispatch, and change to the new signature and shape:
      - "waits through a pending review, triggers once it is landable, then
        reports the merge", which expects `body: { ref: 'main' }`;
      - "never builds a merge request: …", "permits the three requests it
        builds" and "github.mjs is unchanged in what it refuses: …", which
        call `buildDispatchSweep(REPO)`.

      "refuses any other workflow, any other ref or inputs, and any other
      write, before the network" may gain entries for the new refusals. This
      criterion authorises those changes and no others to OQ-50's tests; each
      test still asserts what it asserted before.
- [x] **AC-5** — The documents say what was built:
      - Every `**Planned (…)**` marker in `docs/agent-workflow-design.md`
        that names OQ-93 is resolved as that document's "Reading this
        document" note says.
      - `CLAUDE.md`'s rule that the dispatcher session checks for an older
        landable pull request before running `land.mjs` is removed. So is
        the matching bullet in the design doc's "The dispatcher session".
        #157 added both.
      - `CLAUDE.md`'s description of the sweep ("It lands one eligible pull
        request per run…") says that a run given a pull request considers
        only that one.

## Out of scope

- **A "hold" label, or any other way to keep a passed pull request from
  landing.** Once `land.mjs` names its pull request, nothing automated lands
  one it was not told to. The owner's untargeted runs still land
  oldest-first, as today.
- **Requiring a branch to be up to date before it lands, or a merge queue.** A
  pull request can still land on a `main` its CI did not see, if something
  else landed in between. Updating the branch would change its head and
  discard its review. The design doc's "Merge queue" is the answer, and it is
  needed before parallel dispatch (OQ-66).
- **Who may land (OQ-81).** OQ-81 adds an author check to the sweep, in a
  module under `scripts/land/`. It may share `select-candidates.mjs`, but this
  story does not add that check.
- **Landing latency (OQ-89).** No change to the latency log.
- **`story.mjs`, `github.mjs` and `ci.mjs`.** `story.mjs` already passes the
  pull request number to `landPullRequest`. `github.mjs` goes on refusing
  every workflow dispatch.

## Constraints

- Node, ESM, no new runtime dependencies.
- The input is optional (AC-1), so a dispatch that sends none works as
  today. This story's own pull request is landed by the `land.mjs` on `main`
  before it, which sends none, and the owner's `gh workflow run` sends none.

## Context

- `.github/workflows/land-approved.yml`, line 14: "One PR per run, oldest
  first". The candidate list is
  `gh api "repos/${REPO}/pulls?state=open&sort=created&direction=asc&per_page=100" --jq '.[] | select(.draft | not) | select(.base.ref == "main") | .number'`
  (lines 73-74). The loop after it applies the per-PR checks and merges the
  first that passes. `on:` is `workflow_dispatch:` with no inputs.
- `scripts/dispatch/land.mjs`:
  - `buildDispatchSweep(repo)` sends `body: { ref: 'main' }`.
  - `assertAllowedRequest` admits a `POST` whose body has exactly one key,
    `ref`, equal to `main`.
  - `landPullRequest` re-triggers every `SWEEP_RUN_BOUND_MS` (3 min) while
    its pull request is still open and landable, up to `MAX_TRIGGERS` (5),
    then returns `trigger-limit`. A pull request reading `unknown` for
    longer than `UNKNOWN_BOUND_MS` (5 min) returns `unknown`.

  `decideLand` in `scripts/dispatch/story.mjs` stops the story on any status
  but `merged`. So `land.mjs` for one pull request, with older landable ones
  open, lands those first. After each merge its own pull request reads
  `unknown` for a while (design doc, "GitHub mechanics"). Enough older pull
  requests, or a long enough `unknown`, end in `trigger-limit` or `unknown`,
  and a story that passed is stopped.
- `workflow_dispatch` runs the workflow from the default branch, so a
  change to it cannot run on the pull request that makes it (design doc,
  "GitHub mechanics"). That is why AC-2 puts the logic in a tested module.
  The first targeted run is the first `land.mjs` call after this story
  lands. The owner can confirm it from that run's log.
- The workflow and `land.mjs` change in one squash commit, so `main` never
  has a `land.mjs` that sends `pr` with a workflow that does not declare it.
  What GitHub does with an undeclared input was not checked, since checking
  means triggering the sweep. Nothing here depends on it.
- `scripts/land/delete-merged-heads.mjs` and its test: the precedent for
  sweep logic kept in a tested module, and for a test that reads the
  workflow.
- Decided by the owner on 2026-09-28, while making the dispatcher session's
  landing rule (#157). That rule added a prose check for older landable pull
  requests. This story replaces it with the mechanism, and must be
  dispatched after #157 has landed (AC-5 edits text #157 adds). It
  comes before OQ-86, which lists it in `depends_on`, because an unattended
  loop is where a sweep landing the wrong pull request would go unnoticed.

## Open questions

*(none)*

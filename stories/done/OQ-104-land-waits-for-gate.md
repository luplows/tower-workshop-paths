---
id: OQ-104
title: Let a pass on the head land even when the gate has not yet replaced an earlier block's failure
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a story that passed review to land, not to be stopped
because `land.mjs` looked at the head's `review/agent` status a few seconds
before the gate had updated it. When a block on the pull request's
description is fixed without a commit, the same head is reviewed again. The
new pass is posted as a comment, and `review-gate.yml` turns it into a
`success` status only once its own run gets there. Until then the status
still reads the earlier block's `failure`, which `land.mjs` treats as final.
That stopped OQ-81 (#176) on 2026-09-29, after its code had passed.

## Acceptance criteria

- [x] **AC-1** — `landPullRequest` in `scripts/dispatch/land.mjs` accepts an
      optional `passedAt`: a head SHA at which the caller holds an honoured
      `pass` or `pass-with-observations` verdict.
      - When the pull request's head equals `passedAt` and `review/agent`
        reads `failure` or `error`, it keeps polling instead of stopping, for
        at most a new exported bound, `GATE_LAG_BOUND_MS`, of 2 minutes.
      - If `review/agent` becomes `success` within the bound, landing goes on
        exactly as it does today.
      - If it is still `failure` or `error` at the bound, it returns a new
        status, `gate-lag`, not `review-failed`.
      - When the head differs from `passedAt`, or `passedAt` is not given,
        `failure` and `error` stay final (`review-failed`), as today.
- [x] **AC-2** — `scripts/dispatch/story.mjs` passes `passedAt: run.headSha`
      whenever it lands after a passing verdict. `decideLand` treats
      `gate-lag` like every other status that is not `merged`: the story
      stops, as `land-gate-lag`, and the stop is recorded as usual.
- [x] **AC-3** — Tests, with `land.test.mjs`'s fake GitHub and clock (`now`,
      `sleep`), cover:
      - `passedAt` equal to the head, `failure` for two polls, then `success`:
        the sweep is triggered and the result is `merged`;
      - `passedAt` equal to the head and `failure` throughout: `gate-lag`,
        returned once `GATE_LAG_BOUND_MS` has passed on the fake clock;
      - `passedAt` given but different from the head, with `failure`:
        `review-failed` at once;
      - in `story.mjs`, the `passedAt` passed to `landPullRequest` is the
        head that passed.

      The existing test "review/agent failure", which calls without
      `passedAt`, still expects `review-failed` unchanged.

## Out of scope

- **`review-gate.yml`.** The gate is right to take a few seconds. It runs as
  a workflow triggered by the comment.
- **`land.mjs` run without `passedAt`**, as the owner or the dispatcher
  session runs it by hand. `failure` stays final there, so whoever runs
  it by hand after a same-head re-review should wait for `success` first.
- **Any change to `land.mjs`'s request allowlist.** It already reads the
  statuses this needs.

## Constraints

- Node, ESM, no new runtime dependencies.

## Context

- #176 (OQ-81), on 2026-09-29, UTC:
  - 04:10:31, a `block` on head 0811895, about the PR description only.
    `review/agent` was set to `failure` at 04:10:38.
  - The retried coder replaced the description with no commit. The same
    head was reviewed again, and a `pass-with-observations` marker was
    posted at 04:15:49.
  - `story.mjs` called `landPullRequest` at once. It read `failure`, and
    returned `review-failed` with 0 triggers. The story stopped, and
    `blocked:` was pushed as e1d81ce.
  - The gate's run for the pass, 36520851398, found the head had moved to
    e1d81ce and left the status as it was: "Marker targets 0811895… but head
    is e1d81ce…; status left as it is."
- `scripts/dispatch/land.mjs`, `assess`: `if (review === 'failure' || review
  === 'error') return { final: 'review-failed' }`, and anything not `success`
  is waited through as `review-pending`. `POLL_INTERVAL_MS` is 15 seconds.
- `scripts/dispatch/story.mjs`: after a passing verdict,
  `phase = { next: 'land' }`, then `landPullRequest({ number: run.pr, ctx:
  landCtx })`. `decideLand` maps every status but `merged` to a stop named
  `land-<status>`.
- A description-only fix with a fresh review of the same head is what
  `REVIEW.md` expects for such a block ("What the workflow enforces", item
  3), so this will recur.

## Open questions

*(none)*

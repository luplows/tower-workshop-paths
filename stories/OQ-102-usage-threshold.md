---
id: OQ-102
title: Stop starting coder sessions once a usage threshold is reached, and let reviews finish
tier: next
kind: workflow
depends_on: [OQ-86]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the loop to stop starting coder sessions once my usage
passes a threshold I set, so that an unattended loop cannot run through my
allowance. Work already in flight should still end with a review posted,
nothing should be left half-done, and a story that had to wait should pick
up again once usage is back under the threshold.

## Acceptance criteria

- [ ] **AC-1** — **Past the threshold, no coder session starts.** Before
      starting any coder session, whether a story's first dispatch or a
      retry, the loop checks usage against the threshold. At or over it,
      the loop starts none:
      - a ready story that has not been dispatched is not dispatched;
      - a story in flight whose next step is a retry is **paused**. Its pull
        request stays open and ready, gets no `blocked:`, and is not turned
        into a draft. The run log (OQ-101) records it with status `paused`.

      A coder session that is already running is not stopped.
- [ ] **AC-2** — **Past the threshold, everything else carries on.** Waiting
      for CI, reviews and landing continue. So a run past the threshold still
      reviews every pull request that is waiting for one: an in-flight
      story's new head, and every ready pull request from a trusted author
      (OQ-83). A pull request whose review passes still lands. The run log
      records that the threshold was reached.
- [ ] **AC-3** — **A paused story resumes.** On a run under the threshold,
      before it dispatches a new story, the loop resumes each paused story
      through OQ-48's entry point (`story.mjs OQ-<n> --pr <number>`), which
      retries it from its latest block. A paused story is derived, not
      stored: an open, non-draft pull request on a `story/OQ-<n>-*` branch
      whose head has an honoured `block` verdict, with fewer blocking verdicts
      than the bound (`MAX_ROUNDS` in `scripts/dispatch/story.mjs`), and no
      `blocked:` in its story file at the head.
- [ ] **AC-4** — Tests cover:
      - over the threshold: no first dispatch and no retry, and a review and
        a landing still happen;
      - a story paused, then resumed on a later run under the threshold;
      - a running coder session left to finish.
- [ ] **AC-5** — `docs/agent-workflow-design.md`, "Running unattended": every
      `**Planned (…)**` marker that names OQ-102 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **GitHub's API rate limit.** The loop uses a few calls a run, far under
  5,000 an hour.
- **Stopping a session that is running**, which would leave a branch, a
  worktree or a pull request with no verdict half-done.
- **Notifications.** The run log is the record (OQ-101).

## Constraints

- Node, ESM, no new runtime dependencies.

## Context

- Decided by the owner on 2026-09-28, in the dispatcher session: past the
  threshold, no new coder session starts, retries included, and reviews carry
  on, "I'd like the end state to be everything has a review posted".
- What the loop can measure today: every coder and reviewer session's JSON
  output carries `total_cost_usd`, which `scripts/dispatch/coder.mjs` already
  reads as `costUsd`. `claude --help` (Claude Code 2.1.281) has no command
  that reports a plan's usage, and a coder session's transcript holds only
  per-message token `usage`. Whether a plan's usage window can be read by a
  script is unknown.
- `story.mjs --pr` refuses a draft pull request, or one with `blocked:` at
  its head (`already-stopped`). That is why AC-1 pauses without either.
  Resumed on a pull request whose head has a block verdict, it retries
  (`decideVerdict`).

## Open questions

1. **What is measured?** Spend summed from each session's `costUsd`; a count
   of sessions; the plan's usage window, if a script can read it; or
   something else. The owner is researching this.
2. **Over what window, and where is the threshold set?** For example per day,
   or a rolling window matching the plan's, set in a config file or passed as
   a flag. Any running total is state the loop would keep, which the design
   otherwise avoids ("Status is derived, not stored"), so the answer should
   say where it lives.

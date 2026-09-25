---
id: OQ-86
title: Run the story queue unattended, one story at a time, from the latest main
tier: next
kind: workflow
depends_on: [OQ-48]
model: sonnet
blocked: null
---

## Intent

As the owner, I want to add ready stories to `stories/` and have one command
work through them without me: each story run to merged or stopped by OQ-48,
then the next, each starting from a `main` that includes everything landed
before it, until nothing is ready.

## Acceptance criteria

- [ ] **AC-1** — Each story is dispatched from the latest `origin/main`,
      including the loop's own code, prompts and queue. **Between stories**,
      meaning before it starts one and while it is not running one itself,
      the loop fetches and fast-forwards its own checkout to `origin/main`
      (`git merge --ff-only`). If that is not a fast-forward (a local edit or a
      diverged branch), the loop stops with its own status and dispatches
      nothing. It never updates while it is running a story, so every round of
      one story runs the same dispatcher code. Stories that are `in-progress`
      (AC-4), such as one stopped with its pull request open, do not prevent
      the update: the loop is not running them. Tests cover a fast-forward, a
      refusal, no update while a story is running, and an update that still
      happens while another story's branch is on `origin`.
- [ ] **AC-2** — Stories run one at a time, each through OQ-48's entry point.
      The next story starts only after the previous one is merged or stopped,
      so every story starts from a `main` that includes everything the loop
      landed before it. The loop runs until the queue has no ready story, then
      stops with `nothing-ready`. A test runs two stories and asserts the
      second's worktree base includes the first's merge.
- [ ] **AC-3** — **What a stopped story does to the loop depends on whether
      its pull request exists.**
      - **Stopped after its pull request was opened.** OQ-48 has recorded the
        stop on the story's branch, AC-4 skips the story from then on, and the
        loop reports it and goes on to the next story.
      - **Stopped before a pull request exists**, when the coder dispatch
        returns anything other than `opened`. `dispatchCoder` in
        `scripts/dispatch/coder.mjs` returns `install-failed`,
        `session-failed`, `nothing-committed`, `uncommitted-changes`,
        `push-failed`, `pr-block-invalid`, `story-unreadable`,
        `branch-exists` and `not-ready` today. This **stops the loop**, which reports the
        story and its status. OQ-48 records nothing for such a stop (its AC-8
        needs a pull request), and in most of these cases `coder.mjs`'s
        clean-up leaves no branch on `origin`, or none at all. So nothing
        would keep the story from being picked again, and each pick would be
        another coder session with no bound. Restarting the loop is the
        owner's decision.

      Tests: a story stopped after its pull request was opened is followed by
      the next story, and a story stopped before one exists stops the loop
      with no second coder session spawned.
- [ ] **AC-4** — **A story that is `in-progress` is skipped, never dispatched
      again.** The loop chooses the story itself and passes its id to OQ-48's
      entry point. It takes the first story `dispatchable()` returns whose
      `story/OQ-<n>-*` branch does not exist on `origin`. That is
      `stories/README.md`'s `in-progress` status, derived from the branch and
      never stored. A skipped story appears in the loop's report with its
      branch. Without this, a story OQ-48 stopped still reads `ready` on
      `main`, `coder.mjs` returns `branch-exists` for it when called without
      an id, and the loop halts or re-picks it rather than reaching AC-2's
      `nothing-ready`. Tests: a ready story with a branch on `origin` is
      skipped and the next ready story is dispatched, and a queue whose only
      ready stories all have branches stops with `nothing-ready`.
- [ ] **AC-5** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-86 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Running one story**: dispatch, CI, review, retries, bounds, landing, and
  recording a stop. That is OQ-48's.
- **Ordering the queue.** `queue.mjs`, read from `origin/main` by `coder.mjs`
  (OQ-78's AC-10). The loop only skips stories that are `in-progress` (AC-4).
- **Running stories in parallel.** Sequential is deliberate for now. Parallel
  dispatch needs a merge queue first (`docs/agent-workflow-design.md`, "Merge
  queue") and is OQ-66's.
- **Pull requests the loop did not open**, story-writing PRs among them. OQ-83
  adds those to this loop, for authors with write access only (OQ-81).
- **Running on a schedule, or surviving the machine being off.** The watchdog
  (`docs/agent-workflow-design.md`, "Watchdog") covers the second.
- **A starvation valve for stories that wait too long.** OQ-59.

## Constraints

- Node, ESM, no new runtime dependencies.
- **Keep the way open to running stories in parallel.** The loop keeps no
  state that spans stories other than its checkout, and AC-1 updates that
  only between stories. Whether a story is `in-progress` is derived from its
  branch (AC-4), and is a different thing from the loop running it: a story
  stopped with its pull request open stays `in-progress` indefinitely. So
  running several stories at once later changes how many are started, not
  how any one of them is tracked.

## Context

Split out of OQ-48 on 2026-09-25, before dispatch, where AC-1, AC-2 and AC-4
were AC-9, AC-10 and AC-12. The owner split OQ-48 because it had grown to
sixteen criteria. See OQ-48's Context for the loop's goal, decided the same day: take
any ready story to merged without anyone in between.

AC-1 came out of #142's review. `coder.mjs` read its queue from a possibly
stale local checkout, and the queue is only one of the things the loop's own
checkout supplies: prompts, `render.mjs` and the dispatch modules come from it
too, and each landing leaves it further behind.

AC-4 came from the dispatch of OQ-79 (#149). `dispatchable()` in
`scripts/dispatch/queue.mjs` filters on status alone, and the queue is read
from `origin/main`, where a story OQ-48 stopped still reads `ready`, since
OQ-48 records `blocked:` on the story's branch, not on `main`. The
`in-progress` status in `stories/README.md` was designed for this: "a
`story/OQ-49-*` branch exists". Nothing derived it until now.

AC-3 came from the first review of #151, which split this story out. As
first written, the loop went on after any stopped story, and AC-4 skipped only
stories with a branch on `origin`. But `coder.mjs` stops some stories before
anything is pushed, and its clean-up then deletes the local branch unless it
holds unpushed commits. Such a story still read `ready` on `main` with no
branch to skip it by, so the loop would have dispatched it again, one coder
session after another. When it kept unpushed commits, `dispatchCoder` returned
`branch-exists` on every pick instead, and the loop never reached
`nothing-ready`. Stopping the loop bounds both at no further spend.

## Open questions

*(none)*

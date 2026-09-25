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

- [ ] **AC-1** — Each story runs on the latest `origin/main`: the dispatcher
      code that runs it, its prompts and the queue. **Between stories**,
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
- [ ] **AC-2** — Stories run one at a time. Each runs as **its own child
      process** of OQ-48's entry point, started after AC-1's fast-forward, so
      it loads the dispatch modules and prompts as they are on `origin/main`
      at that moment. A module the loop's own process has already loaded does
      not change when the files on disk do. The loop's own code is therefore
      what it started with, and changes only when the loop is restarted. The
      next story starts only after the previous one's process has finished,
      so every story starts from a `main` that includes everything the loop
      landed before it. The loop runs until no ready story is left without a
      branch on `origin` (AC-4), then stops with `nothing-ready`. Tests: two
      stories run, and the second's worktree base includes the first's merge;
      each story's process starts after that story's fast-forward.
- [ ] **AC-3** — **The loop goes on only after a story merged, or stopped
      with its stop fully recorded.** Fully recorded means OQ-48's AC-8
      reported `recorded`: the pull request is a draft, and `blocked:` is on
      the story's branch. Such a story is also skipped from then on (AC-4).
      Anything else **stops the loop**, which reports the story and its
      status:
      - a stop before a pull request exists, when the coder dispatch returns
        anything other than `opened`. `dispatchCoder` in
        `scripts/dispatch/coder.mjs` returns `install-failed`,
        `session-failed`, `nothing-committed`, `uncommitted-changes`,
        `push-failed`, `pr-block-invalid`, `story-unreadable`, `branch-exists`
        and `not-ready` today;
      - a stop whose recording failed, so the pull request may still be
        ready;
      - a story process that exits without a result, or with an error.

      OQ-48 records nothing for a stop before a pull request exists (its AC-8
      needs one), and in most of these cases `coder.mjs`'s clean-up leaves no
      branch on `origin`, or none at all. So nothing would keep the story from
      being picked again, and each pick would be another coder session with no
      bound. Restarting the loop is the owner's decision. Tests: a merged
      story and a fully recorded stop are each followed by the next story,
      while a stop before a pull request, a stop whose recording failed and a
      process that exits with an error each stop the loop, with no further
      coder session spawned.
- [ ] **AC-4** — **A story that is `in-progress` is skipped, never dispatched
      again.** The loop chooses the story itself and passes its id to OQ-48's
      entry point. It takes the first story `dispatchable()` returns whose
      `story/OQ-<n>-*` branch does not exist on `origin`. That is
      `stories/README.md`'s `in-progress` status, derived from the branch and
      never stored. A skipped story appears in the loop's report with its
      branch. Without this, a story OQ-48 stopped still reads `ready` on
      `main`, `coder.mjs` returns `branch-exists` for it when called without
      an id, and the loop halts or re-picks it rather than reaching AC-2's
      `nothing-ready`. A story whose run was interrupted (the loop's process
      was killed) is `in-progress` too, and is skipped. The loop never resumes
      a story; resuming one is OQ-48's AC-9, run by the owner. Tests: a ready
      story with a branch on `origin` is skipped and the next ready story is
      dispatched, and a queue whose only ready stories all have branches stops
      with `nothing-ready`.
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
sixteen criteria. See OQ-48's Context for the loop's goal, decided the same
day: take any ready story to merged without anyone in between.

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

The third review of #151 added two things. First, AC-3 goes on only after a
stop that was fully recorded, so the loop never walks away from a stopped
story whose pull request might still be ready to land (OQ-48's AC-8 makes it a
draft). Second, AC-2 runs each story in its own process. As first written,
AC-1 promised the loop's own code was current, but a Node process keeps the
modules it has already loaded. `coder.mjs` reads its prompt from disk on each
dispatch, so prompts would have updated while code would not.

## Open questions

*(none)*

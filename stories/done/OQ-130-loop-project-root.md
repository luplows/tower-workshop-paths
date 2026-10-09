---
id: OQ-130
title: Run the loop on the project in the working directory, starting each story from the engine
tier: next
kind: workflow
depends_on: [OQ-125]
model: sonnet
blocked: "ci-setup-failed: CI failed in setup step(s) Setup: Playwright browsers, outside the repository; a coder retry cannot fix it"
---

## Intent

As the owner, I want `loop.mjs` to work on the project it is run in, and to start
each story's process from wherever the engine is installed, so that after the
move a project can run the loop with the workflow installed as a dependency.
Today the loop takes the project to be the checkout it is loaded from
(`DISPATCHER_ROOT`). OQ-123 does the same for `coder.mjs`, `review.mjs`,
`story.mjs` and `land.mjs`.

## Acceptance criteria

- [x] **AC-1** — `DISPATCHER_ROOT` is gone from `scripts/dispatch/loop.mjs`.
      The project root, where `steward.config.json`, `stories/` and the git
      repository are, is the current working directory. It is used for
      `runLoop`'s `repoDir` default, for `--init`'s `initWorktree`, for
      `requireOwnWorktree`, and for the settings OQ-125 reads.
- [x] **AC-2** — The loop starts each story's child process from the engine
      root (`STORY_MJS`, found from the module's own location), with the
      project root as its working directory.
- [x] **AC-3** — Tests, with a temporary directory holding its own
      `steward.config.json` (`repo` `owner/other`) as the project root:
      `runLoop` with no `repoDir` uses that directory, and with no `repo` uses
      `owner/other`; and `runStoryProcess` runs `STORY_MJS` from this
      checkout's `scripts/dispatch/`, with the project root as the child's
      working directory. How a test sets the project root is the coder's
      choice (Context: `process.chdir` is not available in this repository's
      test pool).
- [x] **AC-4** — With this repository as the working directory, every existing
      test passes, and no existing assertion or expected value changes.
- [x] **AC-5** — `OQ-130` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The dispatcher is a script", as that
      document's "Reading this document" note says.

## Out of scope

- **`coder.mjs`, `review.mjs`, `story.mjs` and `land.mjs`** (OQ-123), and
  **`scripts/dispatch/cli.mjs`** (OQ-131).
- **Installing the engine in the loop's worktree** after it updates its
  checkout. That is part of adopting the workflow as a dependency (OQ-115).
- **What `--init` creates**, and where by default. Only the repository it
  starts from changes.

## Constraints

- Node, ESM, no new runtime dependency, and no argument-parsing library.

## Context

- Split from OQ-123 on 2026-10-08, at the owner's decision: the old AC-1 for
  `loop.mjs`, and the old AC-3.
- On `main` at `0a9254b`, in `loop.mjs`: `DISPATCH_DIR` at line 59,
  `DISPATCHER_ROOT` at 60, `STORY_MJS` at 61 (OQ-86); `runStoryProcess` at
  251, which already starts the child with `cwd: repoDir` (line 255);
  `runLoop`'s `repoDir = DISPATCHER_ROOT` default at 318; `main`'s
  `initWorktree(DISPATCHER_ROOT, …)` at 500 and `requireOwnWorktree(DISPATCHER_ROOT)`
  at 505.
- `loop.test.mjs` already injects `runStoryProcess` through `runLoop`'s `deps`
  (lines 162–190).
- `vite.config.js` sets `pool: 'vmThreads'`, and Node does not allow
  `process.chdir()` in a worker thread.
- The decisions: `docs/agent-workflow-design.md`, "Portability", R2 and "The
  move, in order".

## Open questions

*(none)*

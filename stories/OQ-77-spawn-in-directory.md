---
id: OQ-77
title: Run a spawned session in the directory its caller names
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need to tell `spawn.mjs` which directory a session runs
in, so that a coder works in its own worktree and a reviewer reads a checkout
of the head it is reviewing, rather than whatever directory the dispatcher
happens to be in.

## Acceptance criteria

- [ ] **AC-1** — `runSession` in `scripts/dispatch/spawn.mjs` takes a `cwd`
      option and starts the process in that directory. It is required: a call
      without it throws before anything is started, because the silent
      default (the caller's own directory) is the defect this story fixes. A
      test runs the stand-in in a directory other than the test's own and
      asserts, from the stand-in's output, that the process ran there. The
      stand-in gains a mode that prints its working directory.
- [ ] **AC-2** — `spawnSession` takes the same required `cwd` and passes it
      to `runSession` unchanged. A test asserts that it arrives, and that a
      call without it throws before `run` is called.
- [ ] **AC-3** — A `cwd` that does not exist makes `runSession` reject rather
      than run anywhere else. A test covers it.
- [ ] **AC-4** — The coder invocation sketch in
      `docs/agent-workflow-design.md`, "Invocation shape", no longer shows
      `--add-dir "$WORKTREE"`. It says instead that the session is started
      with the worktree as its working directory. `buildInvocation` does not
      gain `--add-dir`.

## Out of scope

- **Creating or removing worktrees, and choosing the directory.** OQ-70
  creates the coder's worktree and OQ-69 the reviewer's checkout. This story
  only lets them hand the directory to `spawn.mjs`.
- **Streaming output and the stall interval.** That is OQ-76.
- Anything else in `invocation.mjs`, beyond the documentation in AC-4.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not invoke `claude`. Use the stand-in in
  `scripts/dispatch/fixtures/`.

## Context

Found on 2026-09-24 while starting OQ-68, the first spawn through the merged
`spawnSession`. A search of `scripts/dispatch/invocation.mjs` and `spawn.mjs`
for `cwd`, `--add-dir` and `worktree` found nothing. `runSession` passes
`env`, `shell`, `windowsHide`, `stdio` and `detached` to `spawn`, and no
working directory. So a session runs wherever its caller is.

- **Both callers need a directory.** OQ-70's AC-1 creates "a dedicated
  worktree" and spawns the coder. OQ-69's Context point 1, "The reviewer's
  checkout matters", describes the reviewer running in a detached worktree at
  the head SHA, not the coder's tree. Both say they call `spawn.mjs` and
  reimplement none of it, so neither can do its job until this lands. That
  is why this story is `tier: fix`.
- **`cwd` alone is enough; `--add-dir` is not needed.** The OQ-68 coder
  (#133) was started by a driver that changed into the worktree before
  calling `spawnSession`, with no `--add-dir`. It edited, committed and
  pushed inside the worktree, and `classifySession` reported `completed`.
  The earlier hand-run driver passed both, so this is the first run showing
  the working directory alone suffices.
- `docs/agent-workflow-design.md`, "Invocation shape": the sketch AC-4
  corrects, which also names `--output-format json`. OQ-76 changes that line,
  so the two edits touch different lines of the same block.
- `scripts/dispatch/spawn.test.mjs` and `fixtures/stand-in-session.mjs`: the
  existing tests and stand-in to extend

## Open questions

*(none)*

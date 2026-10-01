---
id: OQ-109
title: Run the loop from its own worktree, and stop it if that worktree has anything uncommitted
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want the unattended loop to run from a worktree of its own,
kept at `origin/main` and edited by nobody, so that its dispatch code and
prompts are exactly what is on `main`. Then nothing half-finished in the
repository's main checkout can quietly run in every story it dispatches.

## Acceptance criteria

- [ ] **AC-1** — **Creating the worktree.**
      `node scripts/dispatch/loop.mjs --init [path]` fetches `origin`, then
      creates a worktree at `path` with a detached HEAD at `origin/main`
      (`git worktree add --detach`), and exits.
      - The default `path` is a sibling of the repository's root, named after
        it with `-loop` appended. For a checkout at
        `C:\Source\tower-workshop-paths` that is
        `C:\Source\tower-workshop-paths-loop`.
      - `--init` refuses, exiting non-zero and creating nothing, when `path`
        already exists.

      Tests cover the default path's derivation, creation in a fixture
      repository, and the refusal.
- [ ] **AC-2** — **Refusing the wrong checkout.** The loop's command-line
      entry (`main`, not `--init`) exits non-zero before it calls `runLoop`,
      fetches or dispatches anything when its own checkout has a branch
      checked out (`git symbolic-ref -q HEAD` succeeds). The message names the checkout
      and says to run the loop from its own worktree (AC-1). Tests cover a
      checkout on a branch, which is refused, and a detached one, which goes
      on.
- [ ] **AC-3** — **Updating between stories.** `updateCheckout` in
      `scripts/dispatch/loop.mjs` fetches `origin`, then:
      - if `git status --porcelain --untracked-files=all` prints anything,
        returns a new status, `dirty`, naming the paths, and changes
        nothing. `runLoop` stops with that status and dispatches nothing;
      - otherwise runs `git checkout --detach origin/main` and returns
        `updated` with the new head, as today.

      `git merge --ff-only` is no longer used. When it is called, and that it
      is never called while a story's process runs, are unchanged from
      OQ-86. Tests cover:
      - an update to a newer `origin/main`;
      - a modified tracked file, which stops the loop;
      - an untracked file, which stops the loop;
      - a story branch on `origin` that does not affect the update.

      The OQ-86/AC-1 tests that exercise the fast-forward and its refusal
      (`loop.test.mjs`, "a checkout behind origin/main fast-forwards to it",
      "a checkout that has diverged … refuses", and "runLoop stops with its
      own status … when the fast-forward refuses") test behaviour this story
      replaces. They are replaced by these tests, not kept alongside them.
      Every other OQ-86 test still passes. One may change only where its
      fixture checkout has to be detached, and the PR body lists each one.
- [ ] **AC-4** — Every `**Planned (…)**` marker that names OQ-109, in
      `docs/agent-workflow-design.md` and in `docs/session-a.md`, is resolved
      as the design document's "Reading this document" note says.

## Out of scope

- **Hand-runs.** `story.mjs`, `coder.mjs`, `review.mjs` and `land.mjs` still
  run from whichever checkout runs them, as a dispatcher session does today.
  Only the loop gets its own worktree. The owner decided this on 2026-10-01.
- Discarding anything found in the loop's worktree. AC-3 stops and reports.
  Cleaning it up is the owner's.
- Installing dependencies in the loop's worktree. The dispatch scripts import
  only Node built-ins and each other, and each coder and reviewer installs in
  its own worktree, as today.
- Claiming stories on `origin`, and skipping or reporting leftover branches.
  That is OQ-110.
- The scheduled task. OQ-101 runs the loop from this worktree.

## Constraints

- Node, ESM, no new runtime dependencies.
- Tests use fixture repositories, as `loop.test.mjs` already does, and never
  touch the real repository's worktrees.

## Context

- `scripts/dispatch/loop.mjs`: `updateCheckout` (today `git merge --ff-only`),
  `runLoop`, `parseArgs` and `main`.
- Every dispatch module derives its root from its own file location
  (`DISPATCHER_ROOT` in `coder.mjs`, `review.mjs`, `story.mjs` and `loop.mjs`).
  So `node <loop worktree>/scripts/dispatch/loop.mjs` makes every story
  process read its code and its prompts (`CODER_PROMPT`, `REVIEWER_PROMPT`)
  from that worktree.
- Why: `git merge --ff-only` goes ahead when there are uncommitted edits to
  files the incoming commits do not touch, and keeps them. The runner
  confirmed this in a scratch repository on 2026-10-01. Reviews of OQ-86's
  PR #185 raised it twice. A detached worktree also has no local branch that
  can diverge.
- The main checkout keeps the `main` branch checked out, so the loop's
  worktree cannot. That is why it is detached.
- The loop's own runs write into its checkout in one place:
  `land.mjs` appends to `logs/land-latency.jsonl` (`DEFAULT_LATENCY_LOG`).
  `logs` is in `.gitignore`, so AC-3's `git status` does not report it.
  `story.mjs` writes a `blocked:` edit in a story's own worktree, not the
  loop's.

## Open questions

*(none)*

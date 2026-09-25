---
id: OQ-84
title: Have the dispatcher push the coder's branch, and keep the session's output whatever the outcome
tier: fix
kind: workflow
depends_on: [OQ-78]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the coder to commit and the dispatcher to push, so that a
model session has no write access to the remote at all, and the one step
coders keep getting wrong is done by code. When a dispatch does not end in a
pull request, I also want to see what the session said, what it cost and what
it was refused, without digging out a transcript.

## Acceptance criteria

- [ ] **AC-1** — After a session that ended `completed`, `dispatchCoder` pushes
      the story branch itself, with exactly `git push origin <branch>`, never
      forced, when the branch has at least one commit beyond the base. It then
      opens the pull request as it does today. A test asserts the push's
      arguments, and that no forced push (`--force`, `-f`, `+<ref>`) can be
      constructed.
- [ ] **AC-2** — The coder can no longer push. The five push patterns come out
      of `coderAllowedTools`, and `Bash(git push:*)` goes into
      `CODER_DISALLOWED_TOOLS` as a second barrier, as the reviewer already has.
      A test asserts that no `git push` pattern is allowed and that the blanket
      deny is present. This **replaces** the test
      "OQ-63/AC-5 - never denies git push outright". Its reason, that a blanket
      deny would shadow the scoped push patterns, is gone with the patterns, and
      the PR says so under item 9.
- [ ] **AC-3** — What the session left decides the status, and nothing is
      pushed in any of these cases:
      - `completed` with no commit beyond the base: `nothing-committed`
        (replacing `nothing-pushed`);
      - any uncommitted change in the worktree (`git status --porcelain` is not
        empty): `uncommitted-changes`, listing the paths. The dispatcher never
        commits on the coder's behalf, because the commits are the coder's
        account of its work;
      - the push rejected: `push-failed`, with git's error;
      - a session that did not end `completed`: no push, as today.

      In each case a branch holding commits is kept locally, as now. Tests
      cover each status.
- [ ] **AC-4** — The push is an exported function that the retry path uses too.
      `invocation.mjs`'s retry block no longer tells the coder to push: today it
      says ``Push with exactly `git push origin <branch>` ``. It says to commit on
      the existing branch, and that the dispatcher pushes. A test asserts the
      assembled retry prompt contains no `git push`.
- [ ] **AC-5** — Every result `dispatchCoder` returns after a session has run
      carries that session's output under one key: the report text, the cost,
      the number of turns, the commands it was refused, and the classification
      outcome. It is taken from the envelope `spawnSession` already returns as
      `output`. The CLI prints it as part of the JSON it already prints. Tests
      cover `opened`, `nothing-committed`, `uncommitted-changes`,
      `push-failed`, `session-failed`, and an invalid PR block.
- [ ] **AC-6** — `coder.md` tells the coder to commit and not push. Its
      allowlist block (the `git push` lines), its "Push your branch, then …"
      instruction, the draft reason "your push failed", and step 2 of "When you
      cannot proceed" change to match. The coder cannot write `.claude/prompts/`,
      so this arrives as a `### Proposed prompt edit` in the PR body and is
      applied by the runner, as `coder.md` describes for any `.claude/prompts/`
      change. The coder leaves this AC unticked and says `ready` if everything
      else is done.
- [ ] **AC-7** — Every statement that the coder pushes, or needs to push, is
      updated to say the dispatcher pushes. That covers the design doc's "Happy
      path" step 3, its invocation-shape and "Credential minimalism" passages
      (including "The coder cannot be given the same treatment, because it
      legitimately needs to push"), and `REVIEW.md`'s "For the coder: opening a
      PR". Find them with `grep -n -i push`, and cite the code rather than
      restating it where it is enforced.

## Out of scope

- **Removing the coder's access to SSH keys and the agent.** Once the coder no
  longer pushes, it could run without an SSH agent or keyring, as the design
  doc says the reviewer should. That is a separate story, and the coder's twin
  of OQ-62.
- **`review.mjs`.** The reviewer never pushed.
- **The loop's retry cycle.** OQ-48 calls the AC-4 function.

## Constraints

- Node, ESM, no new runtime dependencies.
- The dispatcher pushes only the branch it created, by name, never forced.

## Context

- **Two coders have failed on the push, and on nothing else.** OQ-69's coder
  chained `git push -q -u origin <branch>` onto its commit (#140). OQ-78's coder
  ran `git push -q origin HEAD`, then `git push origin HEAD` (#145). Neither is
  an allowed form, and both sessions stopped and asked for a draft. In both
  cases the runner pushed the unchanged commit by hand, and it passed review
  (#140) or went to review (#145).
- **#145 lost its report.** `coder.mjs` returned only `{status, storyId, branch,
  headSha, reason}` for `nothing-pushed`. The PR block, cost and refusals were
  recovered only from Claude Code's transcript, under `~/.claude/projects/`.
- `scripts/dispatch/coder-env.mjs`: `coderAllowedTools` (the push patterns) and
  `CODER_DISALLOWED_TOOLS` (today `['Bash(gh:*)']`).
- `scripts/dispatch/coder-env.test.mjs`: the OQ-63/AC-5 test that AC-2
  replaces.
- `scripts/dispatch/invocation.mjs`: the retry block with the push instruction.
- `scripts/dispatch/spawn.mjs`: `spawnSession` returns
  `{ classification, output, record }`, where `output` is the session's JSON
  envelope.
- Decided by the owner on 2026-09-25.

## Open questions

*(none)*

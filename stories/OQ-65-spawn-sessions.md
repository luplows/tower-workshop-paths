---
id: OQ-65
title: Spawn a coder or reviewer session and classify how it ended
tier: next
kind: workflow
depends_on: [OQ-74, OQ-75]
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need one tested way to run a coder or reviewer session and
find out what happened to it, so that invoking an agent is a function call with
a known set of outcomes rather than a shell line retyped per spawn.

## Acceptance criteria

- [ ] **AC-1** — `scripts/dispatch/spawn.mjs` exports one entry point that
      takes a role and its inputs, builds the invocation with OQ-74's
      `invocation.mjs`, runs it, hands the raw record to OQ-75's `outcome.mjs`,
      and returns that classification together with the parsed output. It
      reimplements neither module. OQ-69 and OQ-70 call this entry point.
- [ ] **AC-2** — The `claude` executable is resolved to the real binary and
      started directly, never through a shell: no `shell: true` and no
      `cmd.exe`. A test asserts the spawn options. On the owner's machines,
      `claude` on PATH is a shim that `child_process.spawn` cannot start (see
      **Context**, point 2). Resolution failing is reported as an error, not
      worked around.
- [ ] **AC-3** — The prompt is written to the child's **stdin**. A test spawns
      a stand-in executable (not `claude`) with a prompt longer than 32,767
      characters and asserts the whole prompt arrives intact (see **Context**,
      point 3).
- [ ] **AC-4** — A spawn exceeding its timeout is terminated and recorded as
      timed out. A test asserts the child process is actually gone, not merely
      no longer awaited. A timeout that leaves the process running is a leak,
      not a timeout.
- [ ] **AC-5** — The spawn is watched while it runs, not only read at exit: a
      session producing no output for a configured interval is detected and
      recorded. The migration plan requires this in as many words (*"every
      spawn needs a liveness check, not just a result read"*), because the
      failure it exists for is a session that neither finishes nor dies.
- [ ] **AC-6** — The raw record handed to `outcome.mjs` (exit code, signal,
      captured stdout, and whether the session timed out or stalled) is
      defined here as the contract between the two modules, and a test
      asserts that a stand-in session's record has that shape.
- [ ] **AC-7** — `spawn.mjs` performs no GitHub operation of any kind. It does
      not create a pull request, post a status, or apply a label, and a test
      asserts its module surface. Those belong to `github.mjs` (OQ-68).
      Keeping them out is what lets a spawn be tested without a repository in
      any particular state.

## Out of scope

- **Building the arguments, environment, allowlists or prompt.** That is
  OQ-74. This module passes on what OQ-74 builds.
- **Classifying the result, or parsing the coder's PR block.** That is OQ-75.
- **Rendering the prompt.** That is `render.mjs` (OQ-51).
- **Anything touching GitHub.** That is `github.mjs` (OQ-68).
- **The loop:** retrying, counting `block` verdicts, the two-round bound,
  setting `blocked:` and the `review-blocked` label. All of that belongs to
  `dispatch.mjs` (OQ-48). This story spawns one session and returns.
- **Choosing which story to run.** `queue.mjs` does that and is already merged.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests must not invoke `claude`. Process behaviour is tested against a
  stand-in executable, such as a small Node script that echoes stdin, sleeps,
  or exits with a chosen code.

## Context

Written after running the full loop by hand for OQ-63, and extended after
OQ-51's hand-run (#117) and the #122/#123 reviews. **Split on 2026-09-23:**
this story had grown to eleven acceptance criteria covering three mechanisms.
Building the invocation became OQ-74, and reading the result became OQ-75.
This story kept the process itself and the entry point that joins all three,
so the stories that depend on OQ-65 (OQ-69, OQ-70) still depend on the right
thing. Context points about the other two parts moved with them.

1. **A spawn can report failure and still have succeeded.** In the OQ-63
   hand-run, a coder hit a session limit after its PR was already open. OQ-75
   owns what that means for classification. For this story, it means a
   spawn's return value is never a statement about the repository.
2. **`claude` on PATH may not be spawnable from Node.** On the owner's
   machine it is a `/bin/sh` shim, and `child_process.spawn('claude', …)`
   fails with `ENOENT`. Spawning the real binary directly
   (`…/node_modules/@anthropic-ai/claude-code/bin/claude.exe`) works, and also
   avoids `shell: true`, which would mean pushing a large prompt through
   `cmd.exe` quoting rules. Resolve the executable rather than assuming PATH,
   and do not reach for a shell to work around it.
3. **The prompt does not fit on a command line.** During the #122/#123
   reviews on 2026-09-23, the orchestrator reported that passing the prompt as
   an argument hit `cmd.exe`'s limit of about 8 KB. It delivered the prompt on
   stdin instead, which worked. Point 2 already rules out a shell. Without
   one, the limit is `CreateProcess`'s 32,767 characters, and that is still
   not enough. `coder.md` and `reviewer.md` are 14,745 and 14,267 bytes
   (`wc -c` on 2026-09-23, documentation section included), and the injected
   story adds its own size on top: this file was over 12 KB before the split.
   A reviewer prompt also carries the PR body, which can include a whole
   proposed diff, as OQ-63's did. So stdin is required whichever way the
   process is started, and AC-3 tests past the higher of the two limits.

- `docs/migration-plan.md`, "Order within Phase 1" step 3: the scope this
  story and OQ-74/OQ-75 implement between them, and the liveness requirement
  in AC-5
- `docs/agent-workflow-design.md`, "Invocation shape", the paragraph "What a
  spawn actually costs": measured
  wall times, from which a timeout should be chosen "well clear of 16
  minutes, not tuned to the median"
- `scripts/dispatch/queue.mjs` and its tests: the house style to match

## Open questions

*(none)*

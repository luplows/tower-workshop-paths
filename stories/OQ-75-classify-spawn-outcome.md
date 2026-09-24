---
id: OQ-75
title: Classify how a coder or reviewer session ended, from what it left behind
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need what a finished session produced turned into one
known outcome by a tested pure function, so that "did that spawn work?" has a
fixed set of answers and the loop never mistakes a failed session for a
successful one, or a successful one for a failed one.

## Acceptance criteria

- [ ] **AC-1** — `scripts/dispatch/outcome.mjs` defines and exports the shape
      of a finished session's raw record: exit code, signal, captured stdout,
      and whether the session was stopped for timing out or for stalling (no
      output for the configured interval). It takes such a record and returns
      one classification: `completed`, `budget-exhausted`, `timed-out`,
      `stalled`, `died` (non-zero exit, abnormal `stop_reason`, or
      `is_error`), or `malformed-output` (the exit looked clean but the JSON is
      absent or unparseable). `stalled` is kept separate from `timed-out`
      because the likely causes differ: a session that went silent is usually
      waiting on something, while one that ran out the clock was usually still
      working. This is a pure function tested against fixture records, with
      no process started.
      **Nothing is ever reported as `completed` by default:** a record that
      fits none of the rules is not `completed`.
- [ ] **AC-2** — **A non-`completed` outcome asserts only that the session did
      not report completion, never that the work did not happen.** In the
      first hand-run of this loop, a coder hit a session limit and returned
      `is_error: true` with `stop_reason: "stop_sequence"`, having already
      committed, pushed and opened its pull request. A dispatcher that reads
      that as "nothing happened" would respawn over completed work. The
      classification and the repository's actual state are separate
      questions, and this module answers only the first. A fixture reproduces
      that case, and the test asserts it is classified as not `completed`
      while the returned value makes no claim about the branch or the PR.
- [ ] **AC-3** — For a coder session, the `## PR title` / `## PR body` /
      `draft`-or-`ready` block that `coder.md` requires as the last thing in
      its report is parsed out and returned. When it is absent or malformed,
      that is a classified result, not a guess: this module never invents a PR
      body.
- [ ] **AC-4** — The parsed JSON the session emitted is returned alongside the
      classification, unaltered. What a reviewer's verdict inside it *means*
      is not decided here.
- [ ] **AC-5** — Nothing in `outcome.mjs` starts a process, builds an
      invocation, or performs a GitHub operation, and a test asserts the
      module surface.

## Out of scope

- **Producing the raw record:** running the session, the timeout, the
  liveness watch. That is OQ-65, which produces records in the shape AC-1
  defines and calls this module. The shape is defined here rather than there
  because this story can be built first.
- **Building the invocation.** That is OQ-74.
- **Interpreting a reviewer's verdict**, retrying, or counting rounds. That is
  the loop: OQ-48, and OQ-69 for recording a verdict.
- **Checking the repository's state after a session.** Whether a branch was
  pushed or a PR opened is the caller's question. AC-2 exists to keep this
  module from answering it by implication.

## Constraints

- Node, ESM, no new runtime dependencies.
- Tests use fixture records. None invokes `claude` or starts any process.

## Context

Split out of OQ-65 on 2026-09-23, along with OQ-74. OQ-65 had grown to eleven
acceptance criteria covering three mechanisms, and this story is the one that
reads a result. OQ-65 supplies the raw record at runtime. Until it exists,
this module can be built and tested against fixtures alone, which is why it
has no dependencies, and why it owns the record's shape: the story that is
built first defines the contract, and the one built later conforms to it.

- **A spawn can report failure and still have succeeded.** The session-limit
  case in AC-2 is not hypothetical: it is what happened during the OQ-63
  hand-run, and the PR was already open when the error came back.
- **Real fixtures exist.** The OQ-63, OQ-66 and OQ-51 hand-runs produced
  fourteen spawns' worth of `--output-format json` results. The cost table in
  `docs/agent-workflow-design.md`, "Invocation shape", was taken from them.
  Prefer real envelopes to invented ones where they can be recovered.
- `.claude/prompts/coder.md`, "The coder holds no GitHub API credential": the
  `## PR title` / `## PR body` contract AC-3 parses
- `.claude/prompts/reviewer.md`: the JSON a reviewer emits, which AC-4
  returns without interpreting
- `scripts/dispatch/queue.mjs`: the house style, including failing loudly on
  malformed input rather than defaulting

## Open questions

*(none)*

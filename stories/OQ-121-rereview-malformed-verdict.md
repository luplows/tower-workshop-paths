---
id: OQ-121
title: Run the reviewer once more when its verdict does not parse, before stopping
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a review whose verdict JSON does not parse to be tried once
more before the story stops, so that one badly formatted reply does not stop a
story that is otherwise fine and leave it for me. Today `reviewPullRequest`
(`scripts/dispatch/review.mjs`) returns `malformed-verdict` when
`parseReviewerVerdict` rejects the session's output, and `decideReview`
(`scripts/dispatch/story.mjs`) stops the story on anything but `recorded`.

## Acceptance criteria

- [ ] **AC-1** — When the first reviewer session completes and
      `parseReviewerVerdict` rejects its output, `reviewPullRequest` runs one
      more reviewer session, in the same worktree, with the same prompt,
      story, pull request, environment and model, and without installing
      dependencies again. The second session's output is then handled exactly
      as a first session's is: recorded, `no-verdict`, `head-moved` and so on.
- [ ] **AC-2** — If the second session's output does not parse either,
      `reviewPullRequest` returns `malformed-verdict`, as today, and its
      `reason` gives both sessions' parse failures. There is never a third
      session.
- [ ] **AC-3** — No other result runs a second session: a session that did
      not complete (`session-failed`), a `null` verdict (`no-verdict`), and
      every result before the session (install, story, head checks) behave as
      today, with one session or none.
- [ ] **AC-4** — Every result `reviewPullRequest` returns after running a
      session says how many reviewer sessions it ran (1 or 2).
- [ ] **AC-5** — Tests with a fake session:
      - a malformed reply, then a valid `pass`: recorded, two sessions, one
        comment posted;
      - two malformed replies: `malformed-verdict`, two sessions, nothing
        posted, both reasons in `reason`;
      - a `session-failed` first session: one session;
      - a `no-verdict` first reply: one session.
      The existing "OQ-69/AC-1: output that is not a verdict records nothing"
      and "a pass carrying a block-severity finding is not recorded" tests
      still expect `malformed-verdict` and nothing posted.
- [ ] **AC-6** — The **Planned (OQ-121)** row in
      `docs/agent-workflow-design.md`'s "Failure paths" table is resolved as
      that document's "Reading this document" note says.

## Out of scope

- **Telling the second session what went wrong with the first.** It starts
  cold with the same prompt, as every session does (principle 6).
- **Re-running on `no-verdict`.** Decided 2026-10-08 by the owner: only a
  malformed verdict is re-run.
- **Re-running a session that did not complete**, or on any other failure.
- **The reviewer's prompt** (`.claude/prompts/reviewer.md`) and
  `parseReviewerVerdict`'s rules.
- **Budget and timeout per session.** Each session keeps its own
  (`ROLE_DEFAULTS`, `scripts/dispatch/invocation.mjs`), so a re-run review can
  spend at most twice one session's ceiling.

## Constraints

*(none)*

## Context

- `scripts/dispatch/review.mjs`, `reviewPullRequest`: installs, then calls
  `spawnSession` once; returns `session-failed` unless the session
  completed, then `malformed-verdict` when `parseReviewerVerdict` rejects
  `output.result`, and `no-verdict` for a `null` verdict.
- Callers that inherit AC-1: `scripts/dispatch/story.mjs` (`decideReview`
  stops on anything but `recorded`), `scripts/dispatch/writer-prs.mjs`
  (reports anything but a recorded verdict as `not-recorded`), and
  `review.mjs`'s own command line.
- `scripts/dispatch/review.test.mjs`: the two "OQ-69/AC-1" tests that expect
  `malformed-verdict`. Their fake session returns the same reply every time,
  so it is malformed twice.
- Cost, from "What a spawn actually costs" in
  `docs/agent-workflow-design.md`: a reviewer session has cost $0.95 to
  $1.88.
- Raised by the dispatcher. The owner decided on 2026-10-08:
  tier `next`, malformed verdicts only, at most one re-run.

## Open questions

*(none)*

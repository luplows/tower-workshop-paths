---
id: OQ-85
title: Retry a story's open pull request with review or CI findings
tier: next
kind: workflow
depends_on: [OQ-70, OQ-79, OQ-84]
model: sonnet
blocked: null
---

## Intent

As the dispatch loop, and as the owner running it by hand, I need to send a
story's coder back to its own open pull request with the findings that stopped
it, from a blocking review or a red CI, so that the fix lands as new commits on
the same branch and pull request. Today that is done by hand: a fix commit from
the runner, or a coder respawned with hand-written prose.

## Acceptance criteria

- [ ] **AC-1** — An exported entry point in `scripts/dispatch/coder.mjs`
      retries one story's pull request. It takes the story id, the pull request
      number, the findings, their source (`review` or `ci`), the round and the
      rounds remaining. It is also runnable from the CLI with the findings read
      from a file. It runs the coder in a fresh worktree of the story's
      **existing branch**, checked out at that branch's tip on `origin`. The
      coder commits, and the entry point pushes with OQ-84's `pushBranch`,
      using that tip as the base. It then replaces the pull request's title and
      body with the ones the coder emitted, through `github.mjs`'s
      `replacePullRequest`. It never opens a pull request. A test asserts no
      PR-creation request is constructed anywhere on this path. It refuses a
      pull request that is not open, or whose head branch is not the story's,
      before spawning anything.
- [ ] **AC-2** — A retry that emits a new PR body but pushes no commit is a
      result of its own, not a failure: the body is replaced, and the result
      says no commit was pushed. That is the answer to a block on the
      description alone. A retry with neither a new commit nor a valid PR block
      is `nothing-committed` or `pr-block-invalid`, as for a first dispatch. The
      body is not replaced unless the push succeeded or there was nothing to
      push. Tests cover a commit with a body, a body alone, and neither.
- [ ] **AC-3** — The retry prompt carries the findings as a **bounded injected
      block**, with the same guarantee `{{STORY}}` and `{{PR_BODY}}` get. A test
      through this entry point uses a findings fixture that quotes marker
      syntax and heading syntax as its subject matter, because that is what
      real findings do — see **Context** — and asserts exactly one begin and
      one end marker in the assembled prompt.
- [ ] **AC-4** — The retry tells the coder what it cannot otherwise know: which
      round this is, how many remain, that its branch and pull request already
      exist, that the story file has already been moved if it has, and that the
      PR body it emits **replaces** the existing one rather than appending to it.
      A test asserts each of those appears in the assembled prompt.
- [ ] **AC-5** — **The retry says where its findings came from.** A CI
      retry's findings are introduced as CI failure output, not as review
      findings. `retrySection` in `scripts/dispatch/invocation.mjs` today
      introduces every retry's findings with "The review findings to address
      are below.", while OQ-79's AC-3 has CI findings say "that CI failed
      rather than review". A test asserts that an assembled CI retry prompt
      does not call its findings review findings, and that a review retry's
      prompt still does.
- [ ] **AC-6** — The result reports what the coder decided, and changes nothing
      about it: its draft-or-ready choice, and any `blocked:` it set in the
      story file on the branch, read from the pushed tip as `dispatchCoder`
      reads it. The retry does not change the pull request's draft state.
      Every result after a session carries that session's output under the
      same key and shape as OQ-84's AC-5.
- [ ] **AC-7** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-85 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Deciding when to retry, counting rounds, and the bounds.** OQ-48 decides
  and passes the round and rounds remaining in.
- **Reading CI or review results.** OQ-79 and OQ-69 produce the findings this
  takes.
- **Recording a stop as `blocked:`.** OQ-48's, when a bound is reached.
- **Retrying a pull request the loop did not open.** OQ-83 never spawns a
  coder for one.

## Constraints

- Node, ESM, no new runtime dependencies.
- Findings are untrusted text: a reviewer or a CI log wrote them.
- `github.mjs`'s allowlist is unchanged. `replacePullRequest` is already on it.

## Context

Split out of OQ-48 on 2026-09-25, before dispatch, where these were AC-3,
AC-4, AC-5 and AC-15. The owner split OQ-48 because it had grown to fifteen
criteria. See OQ-48's Context for the bound this serves.

What exists already:

- `retrySection` in `scripts/dispatch/invocation.mjs` assembles a retry's
  prompt section: the round and rounds remaining, the findings wrapped with
  `wrapInjectedBlock`, the branch, that the story file has been moved, and that
  the PR body replaces the old one. `buildInvocation` appends it when given
  `retry`, and points `{{STORY_PATH}}` at `stories/done/`. So
  AC-3 and AC-4 are mostly built there. This story tests them through the
  entry point that uses them.
- `dispatchCoder` in `coder.mjs` returns `branch-exists` for a story whose
  branch exists, locally or on `origin`. A retry is exactly that case, so it
  needs its own entry point rather than a flag on the first dispatch.
- `pushBranch`'s doc comment already says "`dispatchCoder` and the retry path
  share it". There is no retry path yet.
- `replacePullRequest` in `github.mjs` sends `PATCH …/pulls/<n>` with a title
  and a body.

OQ-51's hand-run of the loop
([#117](https://github.com/luplows/tower-workshop-paths/pull/117)) went four
rounds, and established three things about retries:

1. **Findings text forges the constructs it describes.** Composing round 2's and
   round 3's findings meant quoting marker syntax and setext headings verbatim,
   and on three separate renders those quoted lines became live markers and live
   headings inside the block meant to contain them. AC-3's fixture exists for
   this. See OQ-74's Context, point 3.
2. **A retry needs context the prompt cannot supply.** All three retries were
   hand-written prose telling the coder the round number, that its branch and PR
   existed, that item 19 was done, and that the body replaces rather than
   appends. AC-4 is that list.
3. **Framing the findings changes the outcome.** Round 4 was deliberately *not*
   handed the line-ending fix as a task; it was given the three-round pattern and
   required to either prove the enumeration closed or change the approach. It
   chose the rewrite. A loop that only ever relays findings verbatim would have
   got a fourth point-fix. This story relays findings as given; how they are
   framed is not decided here.

AC-5 came from the runner's notes on #149 (OQ-79).

## Open questions

*(none)*

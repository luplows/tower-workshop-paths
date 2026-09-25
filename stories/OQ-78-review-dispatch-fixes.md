---
id: OQ-78
title: Make review.mjs install dependencies, honour only the gate's markers, and allow a re-review over a block
tier: fix
kind: workflow
depends_on: [OQ-69]
model: sonnet
blocked: null
---

## Intent

As the owner, I want `scripts/dispatch/review.mjs` to agree with the gate and
`REVIEW.md` before it replaces the hand-run reviews. The reviewer should run the
code rather than read it, a marker the gate ignores should not stop a review, and
the same-head re-review `REVIEW.md` prescribes should be possible through it.

## Acceptance criteria

- [ ] **AC-1** — Before spawning the reviewer, `reviewPullRequest` runs `npm ci`
      in the review checkout. It uses the same credential-stripped environment
      the reviewer session gets (`coderEnv`, as the spawn already does), never
      the dispatcher's own: the install runs the PR's `package.json` scripts,
      which are code under review. A test asserts the install's working
      directory is the review checkout, and that its environment holds none of
      the GitHub credentials `coderEnv` removes.
- [ ] **AC-2** — A failed install ends the dispatch with its own `status` (not
      `session-failed`), spawns no reviewer and posts nothing. The CLI treats it
      as a failure (non-zero exit). A test covers it. `reviewer.md` warns that a
      reviewer that cannot run `npm test` "silently reviews by reading", so the
      dispatch stops rather than letting that happen.
- [ ] **AC-3** — An existing marker counts as a verdict only when the comment's
      author association is one the gate honours. The set lives in
      `.github/workflows/review-gate.yml`, step "Apply verdict from marker", and
      a test reads that file and asserts `review.mjs` uses the same set, so the
      two cannot drift. `github.mjs`'s parsed comment carries the association,
      taken from the comment list response it already reads. A test covers a
      well-formed marker at the head from a non-writer: it does not produce
      `already-reviewed`, and the review goes ahead.
- [ ] **AC-4** — When several honoured markers target the current head, the
      **latest** comment's governs, not the first. (`verdictAt` currently uses
      `find`, which returns the first.) A test covers a `block` followed by a
      `pass` at the same head.
- [ ] **AC-5** — An explicit option (a `reviewPullRequest` parameter and a
      `--rereview` CLI flag, documented in the file's usage line) permits
      reviewing a head that already has a verdict, **only** when the governing
      verdict at that head is `block`. This is the same-head re-review
      `REVIEW.md` prescribes for a block on the PR description alone ("What the
      workflow enforces", item 3). If the option is given over a `pass` or
      `pass-with-observations`, or where there is no verdict at the head, the
      dispatch returns its own `status` and posts nothing. Without the option,
      OQ-69's AC-8 behaviour is unchanged. Tests cover all four cases.
- [ ] **AC-6** — Under the override, the check made just before posting (the
      second `verdictAt` call) still refuses to post if an honoured marker
      **newer than the block being overridden** appeared during the review. It
      does not treat that block as a race. Tests cover both: a newer marker
      stops the post, and the overridden block on its own does not.
- [ ] **AC-7** — The `beforeAll` hook in `scripts/dispatch/review.test.mjs` that
      builds the git fixtures has an explicit timeout of at least 60 000 ms, set
      on that hook. `vite.config.js` and every other file's timeouts are
      unchanged.

## Out of scope

- **Deciding when a re-review is warranted.** The caller asserts it: a person
  today, OQ-48's loop later. `review.mjs` checks only that the verdict it would
  supersede is a `block`.
- **Counting rounds or enforcing the two-block bound.** That is OQ-48's. A
  re-review's verdict is recorded like any other, and a second `block` counts.
- **Checking write access through a permissions lookup.** The comment's author
  association is what the gate reads, so it is what this reads.
- **Editing `reviewer.md` or `REVIEW.md`.** If the coder thinks `reviewer.md`
  should say that dependencies are already installed, it proposes that as a
  prompt edit (see `coder.md`) rather than making it.
- **Caching `node_modules` across reviews, or `npm ci` flags** beyond what makes
  the install match CI's.
- **OQ-73** (whether the stored `gh` token is reachable from a spawned session).
  AC-1 keeps the install to the reviewer's exposure, and does no better or
  worse than it.

## Constraints

- `github.mjs`'s `send` keeps its existing request shapes. The association comes
  from the comment list response `listPullRequestComments` already requests, not
  from a new call.
- Node, ESM, no new runtime dependencies.

## Context

- `scripts/dispatch/review.mjs`: `reviewPullRequest` (the checkout, the spawn
  with `baseEnv: coderEnv(...)`, the second `verdictAt` before posting) and
  `verdictAt`.
- `scripts/dispatch/github.mjs`: `parseComments`, which today keeps `user.login`
  but not `author_association`.
- `.github/workflows/review-gate.yml`, step "Apply verdict from marker": the
  association check, and the last marker winning within a comment.
- `REVIEW.md`, "What the workflow enforces", items 3 (same-head re-review after a
  description-only block, from #138) and 4 (write access).
- [#140](https://github.com/luplows/tower-workshop-paths/pull/140): the review
  and runner notes raising all four points. Out of ten local full-suite runs,
  the runner saw one fail with `Hook timed out in 10000ms` at
  `review.test.mjs:74`, which skipped all 34 of that file's tests. The hand-run
  review script runs `npm ci` in its checkout before spawning; AC-1 moves that
  into the module.

## Open questions

*(none)*

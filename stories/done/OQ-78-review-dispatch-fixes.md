---
id: OQ-78
title: Install dependencies before either dispatched session, and make review.mjs honour only the gate's markers and allow a re-review over a block
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
`scripts/dispatch/coder.mjs` has the same missing install, and the coder should
likewise start with its dependencies in place rather than having to think of it.
It should also choose its story from the latest `origin/main`, which is what it
already hands the coder.

## Acceptance criteria

- [x] **AC-1** — Before spawning the reviewer, `reviewPullRequest` runs `npm ci`
      in the review checkout. It uses the same credential-stripped environment
      the reviewer session gets (`coderEnv`, as the spawn already does), never
      the dispatcher's own: the install runs the PR's `package.json` scripts,
      which are code under review. A test asserts the install's working
      directory is the review checkout, and that its environment holds none of
      the GitHub credentials `coderEnv` removes.
- [x] **AC-2** — A failed install ends the dispatch with its own `status` (not
      `session-failed`), spawns no reviewer and posts nothing. The CLI treats it
      as a failure (non-zero exit). A test covers it. `reviewer.md` warns that a
      reviewer that cannot run `npm test` "silently reviews by reading", so the
      dispatch stops rather than letting that happen.
- [x] **AC-3** — An existing marker counts as a verdict only when the comment's
      author association is one the gate honours. The set lives in
      `.github/workflows/review-gate.yml`, step "Apply verdict from marker", and
      a test reads that file and asserts `review.mjs` uses the same set, so the
      two cannot drift. `github.mjs`'s parsed comment carries the association,
      taken from the comment list response it already reads. A test covers a
      well-formed marker at the head from a non-writer: it does not produce
      `already-reviewed`, and the review goes ahead.
- [x] **AC-4** — When several honoured markers target the current head, the
      **latest** comment's governs, not the first. (`verdictAt` currently uses
      `find`, which returns the first.) A test covers a `block` followed by a
      `pass` at the same head.
- [x] **AC-5** — An explicit option (a `reviewPullRequest` parameter and a
      `--rereview` CLI flag, documented in the file's usage line) permits
      reviewing a head that already has a verdict, **only** when the governing
      verdict at that head is `block`. This is the same-head re-review
      `REVIEW.md` prescribes for a block on the PR description alone ("What the
      workflow enforces", item 3). If the option is given over a `pass` or
      `pass-with-observations`, or where there is no verdict at the head, the
      dispatch returns its own `status` and posts nothing. Without the option,
      OQ-69's AC-8 behaviour is unchanged. Tests cover all four cases.
- [x] **AC-6** — Under the override, the check made just before posting (the
      second `verdictAt` call) still refuses to post if an honoured marker
      **newer than the block being overridden** appeared during the review. It
      does not treat that block as a race. Tests cover both: a newer marker
      stops the post, and the overridden block on its own does not.
- [x] **AC-7** — The `beforeAll` hook in `scripts/dispatch/review.test.mjs` that
      builds the git fixtures has an explicit timeout of at least 60 000 ms, set
      on that hook. `vite.config.js` and every other file's timeouts are
      unchanged.
- [x] **AC-8** — `dispatchCoder` runs `npm ci` in the new worktree after
      creating it and before spawning the coder. The install uses the
      environment the coder session gets (`coderEnv` applied to `baseEnv`, as
      `spawnSession` does), not the dispatcher's own, for the same reason as
      AC-1. A test asserts the install's working directory is the worktree, and
      that its environment holds none of the GitHub credentials `coderEnv`
      removes.
- [x] **AC-9** — A failed install in `dispatchCoder` ends the dispatch with its
      own `status`, spawns no coder and opens no pull request. The worktree and
      local branch are cleaned up as on every other path (OQ-70's AC-9), and the
      CLI treats it as a failure (non-zero exit). A test covers it.
- [x] **AC-10** — `dispatchCoder` chooses its story from the queue as it stands
      on the freshly fetched `origin/main`, not from the dispatcher's local
      `stories/`. Today it reads the local checkout before fetching
      (`loadQueue(repoDir)`), so a checkout that is behind can pick a story that
      is already in `stories/done/` on `origin/main`. `readFileSync` then throws
      out of `dispatchCoder` instead of returning a status. A test puts a story
      in `stories/done/` on the origin but leaves it open in the local checkout,
      and asserts it is not chosen. The `repoDir` docstring's "should be
      current" caveat is removed.

## Out of scope

- **Deciding when a re-review is warranted.** The caller asserts it: a person
  today, OQ-48's loop later. `review.mjs` checks only that the verdict it would
  supersede is a `block`.
- **Counting rounds or enforcing the round bound.** That is OQ-48's. A
  re-review's verdict is recorded like any other, and a further `block` counts.
- **Checking write access through a permissions lookup.** The comment's author
  association is what the gate reads, so it is what this reads.
- **Editing `reviewer.md` or `REVIEW.md`.** If the coder thinks `reviewer.md`
  should say that dependencies are already installed, it proposes that as a
  prompt edit (see `coder.md`) rather than making it.
- **Caching `node_modules` across dispatches, or `npm ci` flags** beyond what
  makes the install match CI's.
- **Editing `coder.md`.** If the coder thinks `coder.md` should say that
  dependencies are already installed, it proposes that as a prompt edit, as
  above.
- **OQ-73** (whether the stored `gh` token is reachable from a spawned session).
  AC-1 and AC-8 keep each install to its session's exposure, and do no better
  or worse than it.

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
- On this Windows machine the AC-7 hook alone took 3.8–4.0 s over three runs,
  and 4.7–6.6 s over five full-suite runs, of which `git push` was 2.0–3.6 s.
  Vitest cannot interrupt a synchronous hook: it lets the hook finish, then
  fails it if the deadline passed (`deadline.exceeded()` in `withTimeout`). So
  the timeout is reached only when other load on the machine slows the git
  calls.
- `scripts/dispatch/coder.mjs`: `dispatchCoder`, which creates the worktree
  (`git worktree add --no-track -b …`) and passes `baseEnv` to `spawnSession`.
  [#142](https://github.com/luplows/tower-workshop-paths/pull/142)'s runner
  notes raised the missing install. `coderAllowedTools` grants `Bash(npm:*)`,
  so a coder can install dependencies itself, but nothing tells it to.

## Open questions

*(none)*

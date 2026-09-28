---
id: OQ-90
title: Stop two review.test.mjs tests failing when anything else runs at the same time
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner running the loop, I want the test suite to fail only on real
defects, so that a coder's pull request is not sent back for a red CI it did
not cause. Two tests in `scripts/dispatch/review.test.mjs` fail when another
process shares the machine, including a real `review.mjs` dispatch. In CI, a
failure like that counts as one of OQ-48's three red-CI rounds.

## Acceptance criteria

- [x] **AC-1** — `reviewPullRequest` in `scripts/dispatch/review.mjs` takes a
      `scratchRoot` option, the directory its `tw-review-*` scratch directory
      is made in. It defaults to `os.tmpdir()`, so a dispatch behaves as
      today. The CLI does not expose it.
- [x] **AC-2** — The test "leaves no review scratch directory behind in the
      temp directory" passes a `scratchRoot` of its own, made for that test,
      and asserts that the directory is empty afterwards. No test in
      `review.test.mjs` lists or compares the contents of `os.tmpdir()`.
- [x] **AC-3** — The tests that run a whole review through the file's
      `review(...)` helper get a timeout of 30 s. The value is defined once,
      as one named constant with a comment giving the reason (as the file's
      `beforeAll` does for its 60 s), and passed to those tests only. That
      includes "OQ-69/AC-1: resolves the head, spawns the reviewer and records
      the verdict as a marker comment only". Tests that do not call
      `review(...)` keep the 5 s default, so no file-level or global setting
      such as `vi.setConfig` is used. No other timeout in the suite changes.
- [x] **AC-4** — **A one-off check, in this pull request only.** The PR
      body's **Verification** reports running
      `npx vitest run scripts/dispatch/review.test.mjs` as two processes at
      once, five times, with the number of runs that failed. The expected
      result is none. Before the fix, the scratch-directory test failed in 6
      of 10 such runs (**Context**), so five clean pairs is fair evidence.
      Compound shell commands are refused, so the pairs can be started from a
      `node -e` script. On Windows that script must start `npx` with
      `shell: true`, or as `node` running npm's `npx-cli.js`, because
      `execFile` cannot start `npx` there without a shell. The reviewer may repeat the check once. It is not
      added to CI, to `REVIEW.md` or to any recurring check: AC-2 removes the
      cause, and that can be checked from the diff alone.

## Out of scope

- Other test files. `coder.test.mjs:670` also reads `os.tmpdir()`, but it
  filters to the scratch directories its own sessions used, so a concurrent
  process cannot fail it.
- Changing Vitest's global `testTimeout`. `vite.config.js` sets none, so the
  5 s default applies, and it stays.
- What `review.mjs` does with its scratch directory, other than where it makes
  it.

## Constraints

*(none)*

## Context

- `review.test.mjs:704-709`:
  `readdirSync(tmpdir()).filter((name) => /^tw-review-[A-Za-z0-9]{6}$/.test(name))`,
  taken before and after one review and compared. Any other process that
  makes or removes a `tw-review-*` directory in between fails it.
- `review.mjs:258`: `mkdtemp(path.join(tmpdir(), 'tw-review-'))`.
- The `beforeAll` at `review.test.mjs:116`: `}, 60_000) // OQ-78/AC-7: many
  git calls, which a loaded machine has pushed past the 10 s default.`
- Measured by the owner's other session on 2026-09-28 and posted on #153:
  `npx vitest run scripts/dispatch` five times at #153's head and five at
  #154's, two at a time. The scratch-directory test failed in 6 of the 10
  runs, for example "expected [ 'tw-review-NIl4Zk' ] to deeply equal
  [ 'tw-review-4tBlh6' ]". The OQ-69/AC-1 marker test timed out at 5000 ms
  once in the 10 runs.
- The same unnamed single failures were seen in #153's review and in the
  runner's first full run on #155.

## Open questions

*(none)*

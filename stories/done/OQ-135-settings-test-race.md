---
id: OQ-135
title: Stop settings.test.mjs deleting its temporary project before readSettings has read it
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want `scripts/dispatch/settings.test.mjs` to keep each
temporary project until its test has finished with it, and each test to check
the specific error it claims to, so that `npm test` stops failing at random on
every pull request and on `main`, and a test cannot pass on the wrong error.

## Acceptance criteria

- [x] **AC-1** — `withTempProject` in `scripts/dispatch/settings.test.mjs`
      awaits the function it is given before it removes the temporary
      directory, and every test that uses it awaits it. The directory is still
      removed when that function throws or rejects.
- [x] **AC-2** — A test of `withTempProject` itself shows AC-1: given an async
      function that first awaits a timer and then checks that the directory
      exists, the directory exists at that point, and it no longer exists once
      `withTempProject`'s promise has settled. A second case shows the same
      when the function rejects after the timer, and that the rejection
      reaches the caller.
- [x] **AC-3** — Each of the eight tests of an invalid case asserts that the
      error message contains both the settings file's full path and the
      problem as `settings.mjs` words it:
      - missing file: `file not found`;
      - invalid JSON: `invalid JSON`;
      - `repo` missing: `missing required key 'repo'`;
      - `storyPrefix` missing: `missing required key 'storyPrefix'`;
      - `repo` not `owner/name`: `'repo' must be of the form owner/name`;
      - `storyPrefix` lower case, and `storyPrefix` longer than eight
        characters: `'storyPrefix' must match`;
      - an extra key: `unrecognised key 'extra'`.
- [x] **AC-4** — The diff changes no file but
      `scripts/dispatch/settings.test.mjs` and this story's own move to
      `stories/done/` with its ticks. `scripts/dispatch/settings.mjs` is
      unchanged.

## Out of scope

- **`scripts/dispatch/settings.mjs`**, and the wording of its messages. AC-3
  tests the messages it has.
- **OQ-125 to OQ-128's tests.** Each writes its own; if one reuses this file's
  helper, it gets the fixed one, since this story is `fix` and goes first.
- **Other test files.** On `main` at `2951abf`, `grep -rn 'return fn('` over
  `scripts/` and `src/` test files finds this helper only.

## Constraints

*(none)*

## Context

- Found by the dispatcher session on 2026-10-08 and written up at its request.
  CI run 37878038058, the `workflow_run` run on `main` at `2951abf` after the
  sweep landed #226 (OQ-122), failed in `Run npm test`: 2 of 956 tests, both
  in `settings.test.mjs`. "OQ-122/AC-2 - throws when storyPrefix is missing"
  got `'/tmp/steward-settings-9X3UFM/steward.…'` where it expected
  `/storyPrefix/`, and "OQ-122/AC-2 - throws when an extra key is present"
  got `'/tmp/steward-settings-Ovx1rS/steward.…'` where it expected `/extra/`.
  The same tests passed on #226's own CI.
- The cause, on `main` at `2951abf`: `withTempProject` (lines 10 to 17) is
  synchronous, `try { return fn(dir) } finally { rmSync(dir, …) }`, and every
  caller passes an `async` function. `fn` returns its promise at its first
  `await`, while `readSettings`'s `readFile` (`settings.mjs` line 34) is still
  pending, and the `finally` deletes the directory then. When the delete wins,
  `readSettings` throws `<path>: file not found` (line 37), which a test
  expecting a key's name fails on.
- Why AC-3: the invalid-JSON test (line 38) asserts only the path, so it
  passes on that `file not found` error too. #226's reviewer observed (item
  17) that the key and value tests assert only `/repo/`, `/storyPrefix/` or
  `/extra/`, not the path OQ-122's AC-2 asks for. The reviewer counted seven;
  there are six (lines 42 to 85), beside the two that assert the path (29 and
  35) and the one that reads this repository's own file (24). The messages
  are at `settings.mjs` lines 37, 46, 55, 62, 65, 69 and 73.
- Dispatch is paused until this lands: every pull request's `npm test` can
  fail on it, and a failure costs a coder retry.

## Open questions

*(none)*

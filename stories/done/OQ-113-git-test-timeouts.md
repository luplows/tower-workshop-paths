---
id: OQ-113
title: Give the tests that build real git repositories in loop.test.mjs and story-containment.test.mjs a timeout of their own
tier: fix
kind: workflow
depends_on: [OQ-111]
model: sonnet
blocked: null
---

## Intent

As the owner running the loop, I want a full `npm test` to fail only on real
defects, so that a coder, a reviewer or I do not lose a round to a test that
ran out of time while the rest of the suite was busy. Tests in
`scripts/dispatch/loop.test.mjs` and `scripts/dispatch/story-containment.test.mjs`
build real git repositories under Vitest's 5 s default timeout, and one or two
of them time out in a full run. OQ-90 fixed the same failure for
`review.test.mjs` only.

## Acceptance criteria

- [x] **AC-1** — `scripts/dispatch/story-containment.test.mjs` defines one
      named constant of 30 000 ms, with a comment giving the reason, as
      `review.test.mjs` does for `REVIEW_TEST_TIMEOUT`. Each of the file's
      tests is passed it as its timeout. Every test in the file runs git,
      through `scenario`, `MAIN` or `git` directly.
- [x] **AC-2** — `scripts/dispatch/loop.test.mjs` defines one named constant
      of 30 000 ms in the same way. It is passed as the timeout to every test
      that calls `makeRepo`, including those OQ-111 added, and to no other
      test. A test that does not call `makeRepo` keeps the 5 s default.
- [x] **AC-3** — No other timeout changes. Vitest's global `testTimeout` stays
      unset in `vite.config.js`, neither file uses `vi.setConfig`, and no other
      test file is edited. No assertion in either file changes.
- [x] **AC-4** — **A one-off check, in this pull request only.** The PR body's
      **Verification** reports running the full suite, `npx vitest run`, five
      times one after another at the pull request's head, with the number of
      runs that had any failure and, for each failure, the test's name and the
      reason Vitest gave. **AC-4 is delivered only if none of the five runs
      has a timeout in either file.** If one does, AC-4 stays unticked and the
      PR body says so. The timeout is not raised beyond AC-1's and AC-2's
      30 000 ms, and runs are not repeated until five come out clean. Before
      the fix, Session A's four full runs on 2026-10-07 had a timeout in one
      of these two files in three of them (**Context**), so five clean runs is
      fair evidence. A failure in another file is reported, not fixed here,
      and does not stop AC-4 being ticked. **Verification** lists each such
      failure after a line reading "For Session A:", and Session A turns each
      one into a new story. The check is not added to CI, `REVIEW.md` or any
      recurring check.

## Out of scope

- Other test files. `coder.test.mjs` already sets 60 s for the whole file
  (`vi.setConfig`), `review.test.mjs` passes `REVIEW_TEST_TIMEOUT` (OQ-90),
  `coder-env.test.mjs` passes `PROBE_TIMEOUT_MS`, and `story.test.mjs` gives
  its one real-repository test 30 s. None of them timed out in the runs under
  **Context**.
- Making the tests faster, sharing one repository between tests, or changing
  how many workers Vitest runs (`pool: 'vmThreads'` in `vite.config.js`). Each
  is a bigger change than this defect needs. File separately if timeouts recur
  after this.
- One shared timeout constant across test files. The house style, from OQ-90,
  is one constant per file with its own comment.

## Constraints

*(none)*

## Context

- Seen so far. Each is a full Vitest run on the owner's Windows machine:
  - #184: 1 test failed in the first of three runs. Its name was not kept.
  - #192: one unidentified failure in one of three runs during review.
  - #193: 845 of 846 passed on `b247020`. Its body calls the failure "the
    timeout recorded under 'Open with the owner' in the dispatcher handover",
    most likely the 2026-10-06 one below.
  - 2026-10-06, the owner's dispatcher session: "OQ-82/AC-2: a conforming
    blocked: edit > is not a violation" timed out at 5018 ms. The file passed
    8 of 8 three times alone, and the next full run passed 846 of 846.
  - #194: "OQ-109/AC-3: a modified tracked file stops the update…" in
    `loop.test.mjs` timed out at 5000 ms in two full runs. `loop.test.mjs`
    alone passed 33 of 33.
  - 2026-10-07, Session A, four full runs one after another at `07033b7`.
    Three had a timeout, every one of them in these two files, and each in a
    different test:
    - Run 1, 844 of 846 in 208 s: "OQ-86/AC-2: the second story's process
      starts only after an update that includes the first's merge"
      (`loop.test.mjs`) at 5010 ms, and "OQ-82/AC-2: a conforming blocked:
      edit > is not a violation" (`story-containment.test.mjs`) at 6151 ms.
      The other tests that call `makeRepo` took between 629 ms and 3444 ms,
      and the other `story-containment.test.mjs` tests between 481 ms and
      1922 ms.
    - Run 2, 845 of 846: "OQ-82/AC-2: another story's ACs edited > is a
      violation naming that file and line" at 5019 ms.
    - Run 3, 846 of 846. Its slowest tests in these files took 3013 ms to
      3771 ms.
    - Run 4, 844 of 846: "OQ-109/AC-3: a modified tracked file stops the
      update…" at 5789 ms, and "OQ-82/AC-2: a conforming move with ticks >
      is not a violation" at 5009 ms.
- `scripts/dispatch/review.test.mjs`, `REVIEW_TEST_TIMEOUT` and its comment:
  the pattern AC-1 and AC-2 follow.
- `scripts/dispatch/loop.test.mjs`, `makeRepo`: builds an origin and a clone
  with real git commands.
- `scripts/dispatch/story-containment.test.mjs`, `scenario`: checks out a
  branch, commits and checks out `main` again, for every test.
- OQ-111 (#194) adds five tests to `loop.test.mjs` that call `makeRepo`.
  `depends_on` waits for it, so this story covers them and does not conflict
  with it.
- OQ-90, in `stories/done/`: the same failure in `review.test.mjs`, and why
  its fix kept the global default.

## Open questions

*(none)*

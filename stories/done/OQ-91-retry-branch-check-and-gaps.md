---
id: OQ-91
title: Match a retry's branch to its story file exactly, and close OQ-85's test gaps
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want `retryStory` to refuse a pull request whose branch is not
exactly its story's, with its own status, and I want every refusal and outcome
it can return to have a test, so that OQ-48 can rely on each status meaning
what OQ-85 says. The reviews and runner notes on #153 and #154 found a prefix-only
branch check, three untested cases, CI retry wording that points at a review
heading without saying why, and two stale comments in `github.mjs`.

## Acceptance criteria

- [x] **AC-1** — `retryStory` in `scripts/dispatch/coder.mjs` refuses a pull
      request, as `wrong-branch` and before any worktree is made, unless its
      head is exactly `story/<name>` for a story file `<name>.md` with the
      story's id that exists at that branch's tip on `origin`, in `stories/`
      or `stories/done/`. That is the name `branchFor` gives the story. The
      existing refusals keep their order and statuses: `pr-not-open`, the
      id-prefix `wrong-branch`, `local-branch-exists` and `branch-missing`
      are checked first, as today (`coder.mjs:424-439`). The new check runs
      after the branch has been fetched from `origin`, so a head absent from
      `origin` is still `branch-missing`. A test covers a head with the right
      id and the wrong slug, which today throws `ENOENT` after the worktree
      is made.
- [x] **AC-2** — Tests through `retryStory` cover:
      - `local-branch-exists`, with nothing spawned;
      - `push-failed`, with the body not replaced and the result carrying
        `draft` and `blocked` (OQ-85's AC-6);
      - a coder that sets `blocked:` and asks for a draft **without a push**,
        with both reported. This is the combination OQ-85's AC-6 names; the
        existing "without a push" test has a coder that asks for a draft but
        sets no `blocked:`.
- [x] **AC-3** — A retry whose only uncommitted files are untracked screenshot
      baselines counts as a clean worktree, as `pushBranch` already treats
      them: with a valid PR block and no commit it is `body-replaced`, and
      the result reports the files as `untrackedScreenshots`. A test pins
      this. The behaviour exists today (`classifyStatus` keeps those files out
      of `paths`); only the test is new.
- [x] **AC-4** — A CI retry's prompt still names the `## Response to review`
      heading, which `coder.md` defines. It says the heading is also where a
      response to a CI failure goes, and that a failure the coder believes its
      change did not cause, such as a flaky test, belongs there with the
      evidence. A review retry's wording is unchanged. A test asserts both.
- [x] **AC-5** — The two comments in `scripts/dispatch/github.mjs` that say
      "one of the six `build*` functions" (lines 241 and 269 at this story's
      writing) describe what the allowlist admits now: the REST requests the
      `build*` functions produce for `repo`, and the one GraphQL request
      `buildConvertPullRequestToDraft` produces. No code in `github.mjs`
      changes.

## Out of scope

- Changing OQ-85's statuses, or what OQ-48 does with them.
- Changing the `## Response to review` heading, in `coder.md` or anywhere else.
- A GraphQL response carrying both `errors` and `isDraft`. The runner noted it
  on #153; it is not taken up here.

## Constraints

*(none)*

## Context

- `retryStory` (`coder.mjs`, from OQ-85, #154) checks the head against
  `` new RegExp(`^story/${storyId}-[A-Za-z0-9._-]+$`) `` and derives the story
  filename from the head. `dispatchCoder` names the branch with
  `branchFor(filename)`. Found by #154's review, observation 1.
- `coder.test.mjs` has `push-failed` tests for `dispatchCoder` only
  (OQ-84/AC-3 and AC-5), and none for `local-branch-exists`. #154's review,
  observation 2, found the AC-6 gap.
- `classifyStatus` in `coder.mjs` puts an untracked file under `SCREENSHOT_DIR`
  in `screenshots`, not `changes`, and `retryStory` counts nothing to push as
  `push.paths.length === 0`.
- `retrySection` in `invocation.mjs` gives a CI retry: "If you believe one is
  wrong, say so under a `## Response to review` heading in your final report."
  `coder.md` defines that heading under "The review gate". OQ-90 fixes the
  flaky tests that make this wording matter.
- Raised by the owner's other session on 2026-09-28, from the reviews of
  #153 and #154.

## Open questions

*(none)*

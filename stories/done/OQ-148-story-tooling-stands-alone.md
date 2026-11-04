---
id: OQ-148
title: Make the story tooling and the tests of this repository's CI stand apart from the old engine
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: "Owner-only: written by Session A for steward's ST-48 validation, reviewed and landed on the old engine. Never dispatched (decided 2026-11-04 by the owner)."
---

## Intent

As the owner, I want what this repository keeps from `scripts/dispatch/` to work
without the rest of it, so that OQ-132 can remove the old engine and steward's
`init` can install in its place, with CI's `test` check passing at every step.

## Acceptance criteria

- [x] **AC-1** — `scripts/story-prefix.mjs` exports `STORY_PREFIX`, which is
      `'OQ'`. `scripts/lint-stories.mjs` takes the prefix from it and no longer
      imports anything from `scripts/dispatch/`.
- [x] **AC-2** — `story-containment.mjs` and its test are at
      `scripts/story-containment.mjs` and `scripts/story-containment.test.mjs`.
      They import nothing from `scripts/dispatch/`, the script holds its own
      `resolveStory` and takes the prefix from `STORY_PREFIX`, and the test's
      existing test names and assertions are unchanged. `ci.yml` runs it at the
      new path, and `REVIEW.md` item 18 names the new path.
- [x] **AC-3** — `install-cleanup.alone.test.mjs` is at
      `scripts/install-cleanup.alone.test.mjs`, changed only in the paths it reads
      the workflow files from, and `ci.yml`'s
      `Run the install clean-up test alone (OQ-136)` step runs it there, still with
      `VITEST_ALONE=1`.
- [x] **AC-4** — A new `scripts/ci-workflows.test.mjs` holds the tests in
      `scripts/dispatch/ci.test.mjs` that read this repository's workflow files:
      OQ-117's, OQ-118/AC-3's, OQ-124's, OQ-136's and OQ-140's. They leave
      `ci.test.mjs`. Their test names are unchanged, and it holds its own copies of
      the helpers they use, importing nothing from `scripts/dispatch/`. Their
      assertions are unchanged apart from three things:
      - OQ-136/AC-4's check names the clean-up test's new path;
      - the setup-step prefix is the string `'Setup: '`, not `ci.mjs`'s constant;
      - the name a `workflow_run` trigger must match is the string
        `'Land approved PRs'`, not read from `land-approved.yml`.
- [x] **AC-5** — `.github/pull_request_template.md` starts with a `Unit:` line and
      a comment saying it takes the path of the story the pull request implements,
      or `none`. `REVIEW.md`'s "Reading the PR body" says so too. The template's
      three sections are unchanged.
- [x] **AC-6** — `OQ-148` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "Portability", "Decided so far", as that
      document's "Reading this document" note says.
- [x] **AC-7** — `npm run lint`, `npm test`, the alone test, `npm run build`,
      `npm run test:e2e` and `node scripts/lint-stories.mjs` pass, and a `git grep`
      in the pull request body shows that no file kept by OQ-132 imports from
      `scripts/dispatch/`, `scripts/land/` or `scripts/report/`.

## Out of scope

- **Removing anything else.** The old engine keeps working until OQ-132. In
  particular `scripts/dispatch/settings.mjs`, `review.mjs`, `queue.mjs` and
  `steward.config.json` stay as they are.
- **`stories/stories.json`,** steward's file for a story prefix. Using it would
  start moving this project to steward's story convention, which steward's ST-48
  rules out (the owner, 2026-11-04).
- **A story prefix other than `OQ`.** A test of `lintStory` that passes it a
  prefix can stay. A test that sets the prefix through a settings file goes, since
  there is no such setting now.

## Constraints

*(none)*

## Context

- The plan the owner agreed on 2026-11-04 is in `docs/agent-workflow-design.md`,
  "Portability", "Decided so far", "This repository adopts steward through `init`".
- At caf4cb7, `scripts/lint-stories.mjs` line 25 imports `readSettings` and calls
  it at lines 378 and 411. `scripts/dispatch/story-containment.mjs` lines 24-25
  import `resolveStory` and `readSettings`. `ci.yml` lines 37 and 43 run the two
  moved files. `scripts/dispatch/ci.test.mjs` line 642 names the alone test's path.
- `lint-stories.test.mjs` line 82 and `story-containment.test.mjs` line 62 write a
  `steward.config.json` into their temporary projects.
- A rehearsal of OQ-148 and OQ-132 together on 2026-11-04, without moving the
  `ci.test.mjs` tests, gave 324 of 325 passing, the one failure being the test at
  `lint-stories.test.mjs` line 395, which sets the prefix through a settings file.

## Open questions

*(none)*

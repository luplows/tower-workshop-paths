---
id: OQ-94
title: One local check command, named where the coder and the reviewer read, lint included
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want every session to run the same checks CI runs, by the
same commands, so that a pull request's **Verification** reports the project's
real lint result, and a reviewer can tell when it does not. `CLAUDE.md`'s
Testing section names the commands for Vitest and Playwright but not for lint
or the build. The coder for OQ-90 (#159) guessed `npx eslint`, found no ESLint
config, and skipped linting. The reviewer of OQ-91 (#161) did the same.
Steward's handoff coder reads `CLAUDE.md` and runs the checks it names, and
steward's reviewer reads `REVIEW.md` and judges **Verification** without
running anything, so the commands have to be reachable from both files. And
this project has no one command a coder can run to get what CI's fast checks
would say, which is what steward's handoff coder is told to run before it
finishes (Out of scope, "Steward's prompts").

## Acceptance criteria

- [ ] **AC-1** — `package.json` has a `check` script that runs
      `npm run lint`, `npm test` and `npm run build`, in that order, which is
      CI's. It stops at the first that fails, and exits non-zero when any
      does. It does not run `npm run test:e2e`.
- [ ] **AC-2** — The first bullet of `CLAUDE.md`'s **Testing** section names
      the command for each check CI runs, in CI's order: `npm run lint`,
      `npm test`, `npm run build` and `npm run test:e2e`. It says that lint
      is oxlint, and that the project has no ESLint configuration, so
      `npx eslint` is not the project's linter. It says that `npm run check`
      runs the first three and is what a session runs before it reports
      **Verification**, and that `npm run test:e2e` is run separately, since
      it needs Playwright's browsers. It marks the list as a restatement of
      `.github/workflows/ci.yml` and `package.json` that must not drift from
      them, as `CLAUDE.md`'s "Claims about this repository" requires.
- [ ] **AC-3** — A Vitest test under `scripts/` reads
      `.github/workflows/ci.yml`, `package.json` and `CLAUDE.md`. It takes
      every `run:` step of the `test` job that starts with `npm `, and fails,
      naming the command:
      - when the command does not appear, in backticks, in the first bullet of
        `CLAUDE.md`'s **Testing** section;
      - when it is not `npm run test:e2e` and `package.json`'s `check` script
        does not run it, or runs it out of CI's order.

      It also fails if it finds no such `run:` step, so the check cannot pass
      by reading nothing. `npm ci` counts as setup, not a check, and is
      exempt, and so is `npm run test:e2e` from the `check` script's
      comparison, and the test names both exemptions.
- [ ] **AC-4** — `REVIEW.md` item 12 says that a check is run by the command
      `CLAUDE.md`'s **Testing** section names for it, that `npm run check`
      runs lint, Vitest and the build, and that lint is `npm run lint`, not
      `npx eslint`. It points at that section for the rest rather than copying
      the list, so AC-3's test still has only one list to check. No other
      item is renumbered or reworded.
- [ ] **AC-5** — The PR body's **Verification** gives `npm run check`'s
      result on the branch, and the result of `npm run check` with one
      deliberate lint error added and then removed, showing a non-zero exit.

## Out of scope

- **Steward's prompts.** They live in `luplows/steward`, not here. At
  `release/v0.3.0`, `.claude/prompts/coder-handoff.md` tells the coder to read
  `CLAUDE.md` (line 63) and to run "the project's own checks, as its
  instructions or its `package.json` or equivalent say" (line 82), so AC-2
  reaches it. `.claude/prompts/reviewer.md` gives the reviewer the checklist
  (`REVIEW.md`, this project's `rulesFile`) and tells it not to run the
  project's tests or lint (line 225), so AC-4 reaches it.
- **`steward.config.json`'s `check`.** It stays `null`. Nothing in steward
  reads it at `v0.3.0`, and steward's crew decided on 2026-11-25, when the
  owner had it raised, to retire it rather than give it a use (ST-105,
  luplows/steward#186): a coder's check is whatever the project's own
  instructions name, which is AC-2. `v0.3.0` requires the key, so it is not
  removed here either; the upgrade to a release with ST-105 removes it.
- **Running the check for the coder**, for example in steward after the
  coder's session and before the push. Steward's crew decided against it on
  2026-11-25. CI runs every check as a required one, and `landWhen` keeps a
  red pull request from landing, so a failure is already caught. This story
  is about what the PR body reports.
- **CI running `npm run check`.** `ci.yml` keeps one step per check, so a
  failed run names the check that failed.
- **Playwright in `check`.** It needs the browsers that CI's "Setup:
  Playwright browsers" installs, and `setup` installs only the project's
  dependencies (`npm ci`).
- **The steps that do not start with `npm `.** AC-3's filter leaves them out,
  and AC-2 does not list them:
  - the Playwright and cache steps ("Resolve Playwright version", "Setup:
    cache Playwright browsers", the apt package cache steps and "Setup:
    Playwright browsers") are setup, not checks;
  - "Run the install clean-up test alone (OQ-136)" and "Check story diff
    containment (OQ-82)" are checks, but CI-only ones. The first runs the one
    test file that `vite.config.js` leaves out of `npm test` unless
    `VITEST_ALONE=1` is set, and the second takes the pull request's
    base and head commits. Neither is what a pull request's **Verification**
    reports. Decided by the owner on 2026-10-12, when the hold was cleared.

## Constraints

- Node, ESM, no new runtime or development dependencies. The `check` script
  is written so that it runs the same under `npm`'s shell on Windows (`cmd`)
  and on Linux (`sh`). Read the YAML as text, as
  `scripts/ci-workflows.test.mjs` reads `ci.yml` (its OQ-118/AC-3 scan). Do
  not add a YAML parser.

## Context

- `.github/workflows/ci.yml`, job `test`, its `run:` steps at `7656e00`, in
  order: `npm ci` (in "Setup: npm ci"), `npm run lint`, `npm test`, the
  OQ-136 alone test (`npx vitest run scripts/install-cleanup.alone.test.mjs`),
  the containment check (`node scripts/story-containment.mjs …`, on pull
  requests only), `npm run build`, "Resolve Playwright version" (line 48),
  "Resolve apt package cache key" (line 59), "Setup: Playwright browsers"
  (line 68, a retry loop around `npx playwright install`), "Collect apt
  package files for the cache" (line 141), and `npm run test:e2e` (line 152).
  "Setup: cache Playwright browsers", "Restore apt package cache" and "Save
  apt package cache" use actions and have no `run:`. When this story was
  written (`c063e8d`), the steps were `npm ci`, the four `npm` checks and
  `npx playwright install`, and nothing else.
- `package.json` scripts: `"lint": "oxlint"`, `"test": "vitest run"`,
  `"build": "vite build"`, `"test:e2e": "playwright test"`, and no `check`.
  The oxlint configuration is `.oxlintrc.json`. There is no `eslint.config.*` or
  `.eslintrc*`.
- `CLAUDE.md`, **Testing**, first bullet today: "CI runs lint, Vitest
  (`npm test`), the build, and Playwright (`npm run test:e2e`) on every pull
  request, and is a required check."
- #159 (OQ-90), **Verification**: "`npx eslint` on the two changed files: it
  could not run ("couldn't find an eslint.config.*"), so those files were not
  linted." Its review's one observation was that the project's linter is
  oxlint. Raised by the owner on 2026-09-28.
- #161 (OQ-91), review comment: "npx eslint on the changed files found no
  eslint.config.* and did not run, so lint was not checked locally".
- `REVIEW.md` item 12 today: "The **Verification** section reports real
  results — actual numbers, taken the same way across a before/after
  comparison — rather than an assertion that checks passed."
- `steward.config.json` after #292: `"setup": { "command": "npm ci",
  "timeoutMinutes": 10 }`, so a handoff coder's worktree has the
  dependencies `npm run check` needs, and `"check": null`. At `v0.3.0`,
  `scripts/dispatch/settings.mjs` validates `check` (line 47), and a grep of
  `scripts/` and `.claude/prompts/` there finds nothing else that reads it:
  `scripts/dispatch/handoff-coder.mjs` reads only `setup` and `rulesFile`
  (line 399).
- On Session A's machine on 2026-11-25, lint took about 2 s, `npm test` 36 s
  and the build 2 s. One of `npm test`'s 39 files did not run, since that
  checkout's `node_modules` predated `fast-check`, so the whole suite takes a
  little longer.
- Held from 2026-11-04 for steward's install, since its Constraints and Out
  of scope named the old engine's files. Refined again on 2026-11-24, after
  OQ-115: its acceptance criteria were unaffected. Refined on 2026-11-25 to
  add the `check` script (AC-1, AC-3 and AC-5), which the owner chose to fold
  in here rather than give a story of its own. Setting `steward.config.json`'s
  `check` to it was dropped the same day, once steward's crew decided to
  retire the setting.

## Open questions

*(none)*

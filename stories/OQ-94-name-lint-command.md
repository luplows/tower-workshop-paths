---
id: OQ-94
title: Name each CI check's command where the coder and the reviewer read, lint included
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
running anything, so the commands have to be reachable from both files.

## Acceptance criteria

- [ ] **AC-1** — The first bullet of `CLAUDE.md`'s **Testing** section names
      the command for each check CI runs, in CI's order: `npm run lint`,
      `npm test`, `npm run build` and `npm run test:e2e`. It says that lint
      is oxlint, and that the project has no ESLint configuration, so
      `npx eslint` is not the project's linter. It marks the list as a
      restatement of `.github/workflows/ci.yml` that must not drift from it,
      as `CLAUDE.md`'s "Claims about this repository" requires.
- [ ] **AC-2** — A Vitest test under `scripts/` reads
      `.github/workflows/ci.yml` and `CLAUDE.md`. It takes every `run:` step
      of the `test` job that starts with `npm ` and checks that the command
      appears, in backticks, in the first bullet of `CLAUDE.md`'s
      **Testing** section. It fails, naming the command, when one is missing.
      It also fails if it finds no such `run:` step, so the check cannot pass
      by reading nothing. `npm ci` counts as setup, not a check, and is
      exempt, so the test names that exemption.
- [ ] **AC-3** — `REVIEW.md` item 12 says that a check is run by the command
      `CLAUDE.md`'s **Testing** section names for it, and that lint is
      `npm run lint`, not `npx eslint`. It points at that section for the rest
      rather than copying the list, so AC-2's test still has only one list to
      check. No other item is renumbered or reworded.

## Out of scope

- **Steward's prompts.** They live in `luplows/steward`, not here. At
  `release/v0.3.0`, `.claude/prompts/coder-handoff.md` tells the coder to read
  `CLAUDE.md` (line 63) and to run "the project's own checks, as its
  instructions or its `package.json` or equivalent say" (line 82), so AC-1
  reaches it. `.claude/prompts/reviewer.md` gives the reviewer the checklist
  (`REVIEW.md`, this project's `rulesFile`) and tells it not to run the
  project's tests or lint (line 225), so AC-3 reaches it.
- **Running lint for the coder**, for example in steward's handoff coder
  before the push. CI runs `npm run lint` as a required check, so a lint
  failure is already caught. This story is about what the PR body reports.
- **The steps that do not start with `npm `.** AC-2's filter leaves them out,
  and AC-1 does not list them:
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

- Node, ESM, no new runtime dependencies. Read the YAML as text, as
  `scripts/ci-workflows.test.mjs` reads `ci.yml` (its OQ-118/AC-3 scan). Do
  not add a YAML parser.

## Context

- `.github/workflows/ci.yml`, job `test`, its `run:` steps at `7656e00`, in
  order: `npm ci` (in "Setup: npm ci"), `npm run lint`, `npm test`, the
  OQ-136 alone test (`npx vitest run scripts/install-cleanup.alone.test.mjs`),
  the containment check (`node scripts/story-containment.mjs …`, on pull
  requests only), `npm run build`, "Resolve Playwright version", the apt
  package cache steps, "Setup: Playwright browsers" (a retry loop around
  `npx playwright install`), and `npm run test:e2e`. When this story was
  written (`c063e8d`), the steps were `npm ci`, the four `npm` checks and
  `npx playwright install`, and nothing else.
- `package.json` scripts: `"lint": "oxlint"`, `"test": "vitest run"`,
  `"build": "vite build"`, `"test:e2e": "playwright test"`. The oxlint
  configuration is `.oxlintrc.json`. There is no `eslint.config.*` or
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
- Held from 2026-11-04 for steward's install, since its Constraints and Out
  of scope named the old engine's files. Refined again on 2026-11-24, after
  OQ-115: its acceptance criteria were unaffected.

## Open questions

*(none)*

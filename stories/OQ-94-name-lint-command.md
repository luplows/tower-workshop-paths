---
id: OQ-94
title: Name the command for each CI check in CLAUDE.md, so a session runs the real linter
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want every session to run the same checks CI runs, by the
same commands, so that a pull request's **Verification** reports the project's
real lint result. `CLAUDE.md`'s Testing section names the commands for Vitest
and Playwright but not for lint or the build. The coder for OQ-90 (#159) guessed
`npx eslint`, found no ESLint config, and skipped linting.

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

## Out of scope

- **`.claude/prompts/coder.md` and `reviewer.md`.** The coder reads
  `CLAUDE.md` before it writes anything (`coder.md`, "Before you write
  anything"), so naming the commands there reaches it. A spawned session
  also cannot edit `.claude/prompts/`.
- **Running lint for the coder**, for example in `coder.mjs` before the push.
  CI runs `npm run lint` as a required check, so a lint failure is already
  caught and retried. This story is about what the PR body reports.
- **The `npx playwright install` step.** It is setup, not a check, and
  starts with `npx`, so AC-2's filter leaves it out.

## Constraints

- Node, ESM, no new runtime dependencies. Read the YAML as text, as
  `scripts/land/delete-merged-heads.test.mjs` reads `land-approved.yml`.
  Do not add a YAML parser.

## Context

- `.github/workflows/ci.yml`, job `test`: `npm ci`, `npm run lint`,
  `npm test`, `npm run build`, `npx playwright install --with-deps chromium`,
  `npm run test:e2e`, in that order.
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

## Open questions

*(none)*

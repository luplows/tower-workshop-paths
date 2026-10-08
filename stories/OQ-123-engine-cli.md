---
id: OQ-123
title: Run the dispatch scripts on the project in the working directory, through one command-line entry point
tier: next
kind: workflow
depends_on: [OQ-122]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the dispatch scripts to work on whichever project they are
run in, through one command, so that after the move another repository can
install the workflow as a dependency and run it on itself. Today the scripts
assume the checkout they are loaded from is the project (`DISPATCHER_ROOT`, two
directories above `scripts/dispatch/`). Once the workflow is a package in a
project's `node_modules`, that checkout is the package, not the project.

## Acceptance criteria

- [ ] **AC-1** — The dispatch modules distinguish two directories:
      - the **engine root**, where the scripts and the prompts are, found from
        the module's own location as `DISPATCHER_ROOT` is today;
      - the **project root**, where `steward.config.json` (OQ-122), the
        `stories/` directory and the git repository are, which is the current
        working directory.
      `DISPATCHER_ROOT` is gone from `coder.mjs`, `loop.mjs`, `review.mjs` and
      `story.mjs`. Every default that used it for the repository
      (`repoDir`, `loop.mjs`'s `--init` and `requireOwnWorktree`) uses the
      project root, and the prompts (`CODER_PROMPT`, `REVIEWER_PROMPT`) are read
      from the engine root.
- [ ] **AC-2** — A new `scripts/dispatch/cli.mjs` is one entry point:
      `node scripts/dispatch/cli.mjs <command> [arguments]`, where `<command>`
      is `loop`, `story`, `coder`, `review`, `land`, `queue`, `lint` or
      `verdicts`. Each runs what `node scripts/dispatch/<module>.mjs`
      (`scripts/lint-stories.mjs` for `lint`,
      `scripts/report/review-verdicts.mjs` for `verdicts`) runs today, with the
      same arguments, output and exit code. An unknown or missing command
      prints the list of commands and exits non-zero. Running each module
      directly still works.
- [ ] **AC-3** — The loop starts each story's child process from the engine
      root (`STORY_MJS`), with the project root as its working directory.
- [ ] **AC-4** — A test runs `cli.mjs` from this checkout with a different
      project as the working directory: a temporary git repository holding its
      own `steward.config.json` (prefix `ST`) and a `stories/ST-1-thing.md`.
      `queue` lists `ST-1` and nothing from this repository, and `lint`
      checks that project's stories, not this repository's.
- [ ] **AC-5** — A test shows the coder's and the reviewer's prompts are read
      from the engine root when the working directory is another project.
- [ ] **AC-6** — The **Planned (OQ-123)** sentence in
      `docs/agent-workflow-design.md`, "The dispatcher is a script", is resolved
      as that document's "Reading this document" note says.

## Out of scope

- **A `package.json` `bin` entry, and publishing.** The package is created in
  the workflow's own repository when it is extracted; this repository's
  `package.json` does not become it.
- **The gate's scripts** under `scripts/land/` and
  `scripts/dispatch/story-containment.mjs`, which the workflow files under
  `.github/` call by path. They become commands with `init` and the thin
  workflow files, after the move.
- **Installing the engine in the loop's worktree.** Once a project pins the
  workflow as a dependency, the loop has to install it after updating its
  checkout; that is part of adopting it (OQ-115).
- **Paths inside the prompts**, such as the reviewer's
  `node scripts/dispatch/review-tools.mjs`, which assume the engine is in the
  project. They change with the prompts' project section, after the move.
- **Other settings** (OQ-122's Out of scope).

## Constraints

- Node, ESM, no new runtime dependency, and no argument-parsing library.

## Context

- `DISPATCHER_ROOT` on `main` at `a2c7f7e`: `coder.mjs` lines 52–53 (with
  `CODER_PROMPT`), 314 and 536; `loop.mjs` lines 60, 318, 500 and 505;
  `review.mjs` lines 55–56 (with `REVIEWER_PROMPT`) and 236; `story.mjs` lines
  48, 176, 210 and 286.
- `loop.mjs` line 61: `STORY_MJS = path.join(DISPATCH_DIR, 'story.mjs')`, the
  child process each story runs in (OQ-86).
- The modules that run as commands today, by their
  `process.argv[1]` checks: `coder.mjs`, `land.mjs`, `loop.mjs`, `queue.mjs`,
  `review.mjs`, `story.mjs`, `review-tools.mjs`, `story-containment.mjs`,
  `scripts/lint-stories.mjs` and `scripts/report/review-verdicts.mjs`.
  `review-tools.mjs` is run by the reviewer session, and
  `story-containment.mjs` by CI, so neither is a command here.
- OQ-122 adds `steward.config.json` and the settings module this story reads
  the project from.
- The decisions: `docs/agent-workflow-design.md` on `main` (landed with #199),
  "Portability", R2 and "The move, in order".

## Open questions

*(none)*

---
id: OQ-131
title: Run every dispatch command through one command-line entry point
tier: next
kind: workflow
depends_on: [OQ-123, OQ-130]
model: sonnet
blocked: null
---

## Intent

As the owner, I want one command that runs each of the dispatch scripts, so that
a project with the workflow installed as a dependency has one entry point to
call, and the workflow's own repository can point its package's `bin` at it.
OQ-123 and OQ-130 make the scripts work on the project in the working directory;
this story gives them one front door.

## Acceptance criteria

- [ ] **AC-1** — A new `scripts/dispatch/cli.mjs` is one entry point:
      `node scripts/dispatch/cli.mjs <command> [arguments]`, where `<command>`
      is `loop`, `story`, `coder`, `review`, `land`, `queue`, `lint` or
      `verdicts`. Each runs what `node scripts/dispatch/<module>.mjs`
      (`scripts/lint-stories.mjs` for `lint`,
      `scripts/report/review-verdicts.mjs` for `verdicts`) runs today, with the
      same arguments, output and exit code. An unknown or missing command
      prints the list of commands and exits non-zero. Running each module
      directly still works.
- [ ] **AC-2** — A test runs `cli.mjs` from this checkout with a different
      project as the working directory: a temporary git repository holding its
      own `steward.config.json` (prefix `ST`) and a `stories/ST-1-thing.md`.
      `queue` lists `ST-1` and nothing from this repository, and `lint`
      checks that project's stories, not this repository's. Another test
      shows an unknown command and a missing one each exit non-zero with the
      list of commands.
- [ ] **AC-3** — The **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The dispatcher is a script", is
      resolved as that document's "Reading this document" note says: this is
      the last story it names.

## Out of scope

- **A `package.json` `bin` entry, and publishing.** The package is created in
  the workflow's own repository when it is extracted
  (`docs/steward-bootstrap.md`, B4); this repository's `package.json` does not
  become it.
- **The gate's scripts** under `scripts/land/` and
  `scripts/dispatch/story-containment.mjs`, and `review-tools.mjs`, which the
  reviewer session runs. None is a command here.
- **Changing what any command does.** `cli.mjs` only dispatches to the
  existing modules.

## Constraints

- Node, ESM, no new runtime dependency, and no argument-parsing library.

## Context

- Split from OQ-123 on 2026-10-08, at the owner's decision: the old AC-2 and
  AC-4.
- The modules that run as commands today, by their `process.argv[1]` checks on
  `main` at `0a9254b`: `coder.mjs`, `land.mjs`, `loop.mjs`, `queue.mjs`,
  `review.mjs`, `story.mjs`, `review-tools.mjs`, `story-containment.mjs`,
  `scripts/lint-stories.mjs` and `scripts/report/review-verdicts.mjs`.
  `review-tools.mjs` is run by the reviewer session, and
  `story-containment.mjs` by CI, so neither is a command here.
- `queue.mjs`'s and `lint-stories.mjs`'s command lines read the working
  directory already; OQ-126 and OQ-127 make them honour its prefix.
- The decisions: `docs/agent-workflow-design.md`, "Portability", R2 and "The
  move, in order".

## Open questions

*(none)*

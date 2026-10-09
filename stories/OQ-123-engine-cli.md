---
id: OQ-123
title: Take the project from the working directory and the prompts from the engine, in coder.mjs, review.mjs, story.mjs and land.mjs
tier: next
kind: workflow
depends_on: [OQ-122, OQ-125, OQ-126, OQ-127, OQ-128, OQ-129]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the dispatch scripts to work on whichever project they are
run in, so that after the move another repository can install the workflow as a
dependency and run it on itself. Today the scripts assume the checkout they are
loaded from is the project (`DISPATCHER_ROOT`, two directories above
`scripts/dispatch/`). Once the workflow is a package in a project's
`node_modules`, that checkout is the package, not the project. This story does
it for `coder.mjs`, `review.mjs`, `story.mjs` and `land.mjs`; OQ-130 does it
for `loop.mjs`, and OQ-131 adds the one command-line entry point.

## Acceptance criteria

- [ ] **AC-1** — `coder.mjs`, `review.mjs` and `story.mjs` distinguish two
      directories:
      - the **engine root**, where the scripts and the prompts are, found from
        the module's own location as `DISPATCHER_ROOT` is today;
      - the **project root**, where `steward.config.json` (OQ-122), the
        `stories/` directory and the git repository are, which is the current
        working directory.
      `DISPATCHER_ROOT` is gone from these three modules. Every default that
      used it for the repository (each `repoDir` default) uses the project
      root, and the prompts (`CODER_PROMPT`, `REVIEWER_PROMPT`) are read from
      the engine root.
- [ ] **AC-2** — The settings these three modules and `land.mjs` read (OQ-125's
      default repository, and OQ-126's and OQ-128's prefix) are read from the
      project root, not from the directory two levels above the module.
- [ ] **AC-3** — Tests, with a temporary git repository holding its own
      `steward.config.json` (`repo` `owner/other`, prefix `ST`) as the project
      root: the coder's and the reviewer's prompts are still read from the
      engine root, and the settings and the default `repoDir` come from the
      project root. How a test sets the project root is the coder's choice
      (Context: `process.chdir` is not available in this repository's test
      pool).
- [ ] **AC-4** — With this repository as the working directory, every existing
      test passes, and no existing assertion or expected value changes.
- [ ] **AC-5** — `OQ-123` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The dispatcher is a script", as that
      document's "Reading this document" note says.

## Out of scope

- **`loop.mjs`** (OQ-130) and **`scripts/dispatch/cli.mjs`** (OQ-131).
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

- Split on 2026-10-08, at the owner's decision, so that no coder session has
  to carry the whole of it. This story keeps the old AC-1 (for these modules,
  with `land.mjs`'s settings added) and the old AC-6 (the marker), and gains
  a test for them; OQ-130 takes the old AC-1 for `loop.mjs` and the old AC-3,
  and OQ-131 the old AC-2 and AC-4. The old AC-5 (prompts from the engine
  root) is AC-3 here.
- `DISPATCHER_ROOT` on `main` at `0a9254b`: `coder.mjs` lines 52–53 (with
  `CODER_PROMPT`), 314 and 536; `review.mjs` lines 55–56 (with
  `REVIEWER_PROMPT`) and 242; `story.mjs` lines 48, 184, 218 and 294.
  `land.mjs` has none; OQ-125 has it read its settings from the same
  directory, two levels above `scripts/dispatch/`.
- `queue.mjs`'s and `lint-stories.mjs`'s command lines already read the working
  directory (`loadQueue()` defaults `rootDir` to `process.cwd()`;
  `lint-stories.mjs`'s `main` passes `process.cwd()`).
- `vite.config.js` sets `pool: 'vmThreads'`, and Node does not allow
  `process.chdir()` in a worker thread.
- OQ-122 adds `steward.config.json` and the settings module. OQ-125 to OQ-128
  make the scripts take the repository and the story prefix from it, reading
  it from the root they find today, and OQ-129 guards against either coming
  back. This story moves that root to the working directory.
- The decisions: `docs/agent-workflow-design.md` on `main` (landed with #199),
  "Portability", R2 and "The move, in order".

## Open questions

*(none)*

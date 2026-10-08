---
id: OQ-122
title: Read and validate a project settings file holding the repository and the story prefix
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a project's repository and story id prefix to be read from
a settings file in the project, and checked when they are read, so that the
dispatch scripts can stop carrying `luplows/tower-workshop-paths` and `OQ` in
their code. This is the first step of moving the workflow to a repository of its
own (`luplows/steward`), whose stories will be `ST-<n>`. This story adds the file
and the module that reads it; OQ-125 to OQ-129 make the scripts use it.

## Acceptance criteria

- [ ] **AC-1** — A file `steward.config.json` at the repository root holds
      `{ "repo": "luplows/tower-workshop-paths", "storyPrefix": "OQ" }`. A new
      module under `scripts/dispatch/` reads and validates a project's settings
      from a given project root: `repo` must be `owner/name`, `storyPrefix`
      must match `^[A-Z]{1,8}$`, and any other key is refused. A missing file,
      invalid JSON, a missing key or an invalid value throws an error naming
      the file and the problem. The code holds no default for either value.
- [ ] **AC-2** — Tests for AC-1: this repository's own `steward.config.json`
      reads as the values above, and each invalid case AC-1 names (missing
      file, invalid JSON, each key missing, each value invalid, an extra key)
      throws, with the file named in the message.
- [ ] **AC-3** — `OQ-122` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", as that
      document's "Reading this document" note says. The other ids in the
      marker stay.

## Out of scope

- **Using the settings anywhere.** No existing module reads the new one in
  this story. The repository default is OQ-125's; the story prefix is OQ-126's
  (the queue reader and the story-file matches that use it), OQ-127's (the
  story lint) and OQ-128's (the story-id checks in `coder.mjs` and
  `story.mjs`); the guard against either coming back is OQ-129's.
- **Any other setting.** The base branch (`main`), the remote (`origin`), the
  `stories/` directory and the CI workflow path stay constants: they are the
  same in all three repositories (decided 2026-10-08 by the owner).
- **Where the project root is found.** That is OQ-123 and OQ-130. The new module
  takes the root as a parameter.

## Constraints

- Node, ESM, no new runtime dependency. The settings file is JSON, read with
  `JSON.parse`.

## Context

- Split on 2026-10-08, at the owner's decision, after this story's first
  dispatch spent the coder's whole budget ($6.03 over 119 turns, against
  `maxBudgetUsd: 6` in `scripts/dispatch/invocation.mjs` line 43) and
  committed nothing. AC-1 is the old AC-1, and AC-2 the old AC-6.
- The decisions: `docs/agent-workflow-design.md`, "Portability", R3 and "The
  move, in order".

## Open questions

*(none)*

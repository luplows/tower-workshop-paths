---
id: OQ-125
title: Take the default repository from the project settings, not from a constant in five modules
tier: next
kind: workflow
depends_on: [OQ-122]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the dispatch scripts' default repository to come from the
project's `steward.config.json` (OQ-122), so that the same code run in another
project works on that project's repository without `--repo` on every command.
Today `'luplows/tower-workshop-paths'` is a `DEFAULT_REPO` constant in five
modules.

## Acceptance criteria

- [ ] **AC-1** — The `DEFAULT_REPO` constants in `scripts/dispatch/coder.mjs`,
      `land.mjs`, `loop.mjs`, `review.mjs` and `story.mjs` are gone. Where each
      was used (the default for `--repo` in each command line, and `runLoop`'s
      `repo` parameter), the default is the `repo` read by OQ-122's settings
      module from the project root. `--repo` still overrides it, and an explicit
      `repo` passed to `runLoop` still wins.
- [ ] **AC-2** — The project root each module reads the settings from is the
      one it uses for the repository today: `DISPATCHER_ROOT` in `coder.mjs`,
      `loop.mjs`, `review.mjs` and `story.mjs`. `land.mjs`, which has none,
      uses the same directory, two levels above `scripts/dispatch/`.
- [ ] **AC-3** — Tests, using a temporary project root whose settings name
      `owner/other`: `loop.mjs`'s `parseArgs` with no `--repo`, and `runLoop`
      with no `repo`, use `owner/other`; with `--repo x/y`, and with an
      explicit `repo`, they use that. How the root reaches `parseArgs` and
      `runLoop` in a test is the coder's choice. With this repository's own
      settings every existing test passes, and no existing assertion or
      expected value changes (`loop.test.mjs`'s
      `parseArgs([])` expectation of `luplows/tower-workshop-paths` included).
- [ ] **AC-4** — `OQ-125` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", and the
      `DEFAULT_REPO` bullet under "Portability", "What ties the workflow to
      this repository today", is corrected, as that document's "Reading this
      document" note says.

## Out of scope

- **The story prefix** (OQ-126, OQ-127, OQ-128).
- **Finding the project from the working directory**, and `DISPATCHER_ROOT`
  itself. That is OQ-123.
- **A test that fails if `tower-workshop-paths` comes back** into these
  modules. That is OQ-129.
- **`scripts/land/`** and the workflow files, which take the repository from
  `github.repository`.

## Constraints

- No new runtime dependency.

## Context

- Split from OQ-122 on 2026-10-08 (the old AC-2), at the owner's decision.
- On `main` at `0a9254b`: `DEFAULT_REPO` is defined at `coder.mjs` line 55,
  `land.mjs` line 45, `loop.mjs` line 63, `review.mjs` line 58 and `story.mjs`
  line 49, and used at `coder.mjs` lines 692 and 695, `land.mjs` line 317,
  `loop.mjs` lines 318 (`runLoop`'s parameter) and 488 (`parseArgs`),
  `review.mjs` line 429 and `story.mjs` line 421.
- `DISPATCHER_ROOT`: `coder.mjs` line 52, `loop.mjs` line 60, `review.mjs`
  line 55 and `story.mjs` line 48, each two directories above the module.
- Only `loop.mjs` exports its command-line parsing (`parseArgs`, line 480) and
  its entry (`runLoop`, line 317). The other four handle `--repo` inside an
  unexported `main`. `loop.test.mjs` line 633 expects `parseArgs([])` to give
  `repo: 'luplows/tower-workshop-paths'`.

## Open questions

*(none)*

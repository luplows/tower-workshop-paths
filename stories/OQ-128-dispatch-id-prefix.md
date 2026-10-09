---
id: OQ-128
title: Check story ids against the project's story prefix in coder.mjs and story.mjs
tier: next
kind: workflow
depends_on: [OQ-122]
model: sonnet
blocked: null
---

## Intent

As the owner, I want `coder.mjs` and `story.mjs` to accept a story id with the
prefix in the project's `steward.config.json` (OQ-122), so that the same code
can dispatch and retry an `ST-<n>` story. Today both refuse any id that is not
`OQ-<n>`, and their usage text names `OQ-<n>`.

## Acceptance criteria

- [ ] **AC-1** — In `scripts/dispatch/coder.mjs`, the story-id checks in
      `retryStory` and in its command line, and its usage text (`USAGE`, and
      the usage error its command line throws), take the prefix from the
      settings.
- [ ] **AC-2** — In `scripts/dispatch/story.mjs`, the story-id checks in
      `runStory` and in its command line, and its usage text, take the prefix
      from the settings.
- [ ] **AC-3** — A message or usage text names the configured prefix (for
      example `ST-<n>`) or a neutral `<story-id>`; which one is the coder's
      choice.
- [ ] **AC-4** — Tests, using a project whose settings say `ST`: `runStory` and
      `retryStory` refuse `OQ-3` with their "requires a story id" error, and
      accept `ST-3`, going on past that check. With this repository's own
      settings every existing test passes; the only change made to an existing
      test is supplying the settings, and no existing assertion or expected
      value changes. How the settings reach `runStory` and `retryStory` is the
      coder's choice (both already take `repoDir`): nothing falls back to a
      default when they are missing.
- [ ] **AC-5** — `OQ-128` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", as that
      document's "Reading this document" note says.

## Out of scope

- **The queue reader and the story-file matches** in `coder.mjs`'s
  `loadQueueAt` and `review.mjs`'s `resolveStory` (OQ-126), and **the story
  lint** (OQ-127).
- **Branch names.** `coder.mjs` builds `story/<id>-<slug>` from the story's
  file name (`branchFor`, line 94), which carries the prefix already; nothing
  here changes how.
- **The repository default** (OQ-125).
- **A test that fails if `OQ-` comes back** into these modules (OQ-129).

## Constraints

- No new runtime dependency.

## Context

- Split from OQ-122 on 2026-10-08, at the owner's decision: part of the old
  AC-3 and AC-4.
- On `main` at `0a9254b`: `coder.mjs`'s `retryStory` check at line 539,
  `USAGE` at lines 654–655, the retry command line's check at line 670, and
  the dispatch command line's check and usage error at lines 697–698;
  `story.mjs`'s `runStory` check at line 296, and its command line's usage
  text and check at lines 424–425.
- `retryStory` (`coder.mjs` line 535) and `runStory` (`story.mjs` line 293)
  each take `repoDir`, defaulting to `DISPATCHER_ROOT`.

## Open questions

*(none)*

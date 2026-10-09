---
id: OQ-127
title: Build the story lint's story-id patterns from the project's story prefix
tier: next
kind: workflow
depends_on: [OQ-122]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the story lint to check a project's stories against the
prefix in its `steward.config.json` (OQ-122), so that the same lint can run on
a queue numbered `ST-<n>`. Today every story-id pattern in
`scripts/lint-stories.mjs` spells `OQ`, so it would reject every `ST-<n>` story
and ignore every `ST-<n>` file.

## Acceptance criteria

- [x] **AC-1** — Every story-id pattern in `scripts/lint-stories.mjs` takes its
      prefix from the settings: its own `STORY_FILENAME_RE`, the `id` and
      `depends_on` checks and their messages, the filename-prefix match and
      its message, the `stories/done/` id collection, and the ids read from
      `**Planned (…)**` markers. A message names the configured prefix (for
      example `ST-<n>`) or a neutral `<story-id>`; which one is the coder's
      choice.
- [x] **AC-2** — Tests, using a project whose settings say `ST`:
      - `lintStory` passes a well-formed `stories/ST-3-thing.md`, and fails a
        story whose `id` is `OQ-3` and one with a `depends_on: [OQ-1]` entry;
      - `lintAll` lints `stories/ST-3-thing.md` and ignores
        `stories/OQ-3-thing.md`;
      - a `**Planned (ST-3)**` marker in that project's `docs/` fails when
        `stories/done/ST-3-thing.md` exists, and passes when only
        `stories/ST-3-thing.md` does.
- [x] **AC-3** — With this repository's own settings every existing test
      passes, and `node scripts/lint-stories.mjs` on this repository reports
      what it reported before. The only change made to an existing test is
      supplying the settings: a `steward.config.json` written into its
      temporary root, or the settings passed in. No existing assertion or
      expected value changes. How the settings reach `lintStory` and `lintAll`
      is the coder's choice: nothing falls back to a default when they are
      missing.
- [x] **AC-4** — `OQ-127` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", as that
      document's "Reading this document" note says.

## Out of scope

- **The queue reader** (OQ-126) and the story-id checks in `coder.mjs` and
  `story.mjs` (OQ-128).
- **Merging the two `STORY_FILENAME_RE` copies** (`queue.mjs` and
  `lint-stories.mjs`) into one. Both take the prefix; whether they become one
  is the coder's choice, not a requirement.
- **Comments** that spell `OQ-`, such as the file's header and `lintDocs`'s
  doc comment. Only patterns and messages change.
- **A test that fails if `OQ-` comes back** into this module (OQ-129).

## Constraints

- No new runtime dependency.

## Context

- Split from OQ-122 on 2026-10-08, at the owner's decision: part of the old
  AC-3 and AC-4.
- On `main` at `0a9254b`, in `scripts/lint-stories.mjs`: `STORY_FILENAME_RE`
  at line 26; the `id` check and message at lines 252–253; the `depends_on`
  check and message at 273–274; the filename-prefix match at 296 and its
  message at 299; the `stories/done/` id collection (`collectStoryIds`) at
  340; the marker ids at 381. `lintStory(filePath, source)` (line 233) takes
  no root; `lintAll(rootDir)` (line 398) does.
- Existing tests that run without settings, in `lint-stories.test.mjs`: 24
  `lintStory(…)` calls, 23 of them on `OQ-9001-…` file names, and `lintAll` on
  a temporary root (lines 110 and 114). `lintAll(repoRoot)` at line 365 runs on
  this repository.

## Open questions

*(none)*

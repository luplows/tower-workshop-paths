---
id: OQ-126
title: Build the queue reader's story-id patterns from the project's story prefix
tier: next
kind: workflow
depends_on: [OQ-122]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the queue reader to recognise a project's stories by the
prefix in its `steward.config.json` (OQ-122), so that the same code can read a
queue numbered `ST-<n>`. Today `queue.mjs` matches only `OQ-<n>`, and
`review.mjs` and `coder.mjs` find story files through its pattern, so none of
them could see an `ST-<n>` story.

## Acceptance criteria

- [x] **AC-1** — In `scripts/dispatch/queue.mjs`, `STORY_FILENAME_RE`
      (and `isStoryFilename`), the frontmatter `id` check and its error
      message, and `numericId` take the prefix from the settings. The error
      message names the configured prefix (for example `ST-<n>`) or a neutral
      `<story-id>`; which one is the coder's choice.
- [x] **AC-2** — The uses of those outside `queue.mjs` take the prefix too:
      `review.mjs`'s `resolveStory`, both its story-file matches and the id it
      takes from a moved story file and from a `story/<prefix>-<n>-…` branch,
      which `scripts/dispatch/story-containment.mjs` relies on; and
      `coder.mjs`'s `loadQueueAt`, through `isStoryFilename` and `buildStory`.
- [x] **AC-3** — Tests, using a project whose settings say `ST`:
      - `loadQueue` loads `stories/ST-3-thing.md` and ignores
        `stories/OQ-3-thing.md`;
      - `buildStory` accepts `id: ST-3` with `numericId` 3, and refuses
        `id: OQ-3`;
      - `resolveStory` reads `ST-3` from a branch `story/ST-3-thing` and from a
        moved `stories/done/ST-3-thing.md`, and finds no story in an `OQ-3`
        move or branch.
- [x] **AC-4** — With this repository's own settings every existing test
      passes. The only change made to an existing test is supplying the
      settings: a `steward.config.json` written into its temporary root, or
      the settings passed in. No existing assertion or expected value changes.
      How the settings reach `buildStory`, `loadQueue`, `isStoryFilename` and
      `resolveStory` is the coder's choice: nothing falls back to a default
      when they are missing.
- [x] **AC-5** — `OQ-126` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", as that
      document's "Reading this document" note says.

## Out of scope

- **The story lint** (`scripts/lint-stories.mjs`, OQ-127), and the story-id
  checks and usage text in `coder.mjs` and `story.mjs` (OQ-128).
- **Merging `queue.mjs`'s and `lint-stories.mjs`'s `STORY_FILENAME_RE`** into
  one. Whether they become one is the coder's choice in OQ-127, not here.
- **The repository default** (OQ-125) and **where the project root is found**
  (OQ-123 and OQ-130).
- **A test that fails if `OQ-` comes back** into these modules (OQ-129).
- **The prompts**, which mention `OQ-` only in examples and history.

## Constraints

- No new runtime dependency.

## Context

- Split from OQ-122 on 2026-10-08, at the owner's decision: part of the old
  AC-3 and AC-4.
- On `main` at `0a9254b`: `queue.mjs` `STORY_FILENAME_RE` at line 21
  (`isStoryFilename` at 23–25), the `id` check at line 181 and its message at
  182, and `numericId` at 205. `loadQueue(rootDir)` (line 264) takes the root;
  `buildStory(filePath, source, isDone)` (line 177) takes none.
- `review.mjs` imports `STORY_FILENAME_RE` from `queue.mjs` (line 49) and uses
  it in `resolveStory` (lines 97–98), then spells the prefix at lines 101 and
  103. `story-containment.mjs` calls `resolveStory` (line 135), and CI runs it
  from the repository root (`ci.yml` lines 30–36).
- `coder.mjs` imports `buildStory` and `isStoryFilename` (line 46) and uses
  them in `loadQueueAt` (lines 86–87), on stories read from a git ref.
- Existing tests that run without settings: `loadQueue` on temporary roots in
  `queue.test.mjs` (lines 78, 131 and 187), the 8 `buildStory(…)` calls there,
  and 4 `resolveStory(…)` calls in `review.test.mjs`.

## Open questions

*(none)*

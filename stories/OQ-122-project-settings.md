---
id: OQ-122
title: Read the repository and the story prefix from a project settings file, not from the code
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want the dispatch and landing scripts to take the project's
repository and story id prefix from a settings file in the project, so that the
same code can run the queue of another repository whose stories are numbered
differently. This is the first step of moving the workflow to a repository of its
own (`luplows/steward`), whose stories will be `ST-<n>`. Today
`'luplows/tower-workshop-paths'` is the default repository in five command lines,
and the `OQ` prefix is written into the story-id patterns of five modules, so the
moved code could not read a single `ST-<n>` story.

## Acceptance criteria

- [ ] **AC-1** — A file `steward.config.json` at the repository root holds
      `{ "repo": "luplows/tower-workshop-paths", "storyPrefix": "OQ" }`. A new
      module under `scripts/dispatch/` reads and validates a project's settings
      from a given project root: `repo` must be `owner/name`, `storyPrefix`
      must match `^[A-Z]{1,8}$`, and any other key is refused. A missing file,
      invalid JSON, a missing key or an invalid value throws an error naming
      the file and the problem. The code holds no default for either value.
- [ ] **AC-2** — The `DEFAULT_REPO` constants in `scripts/dispatch/coder.mjs`,
      `land.mjs`, `loop.mjs`, `review.mjs` and `story.mjs` are gone. Where each
      used it (the default for `--repo`, and `runLoop`'s `repo` parameter),
      the default is the settings' `repo`. `--repo` still overrides it.
- [ ] **AC-3** — Every story-id pattern takes its prefix from the settings,
      in each of these, all written for `OQ` today:
      - `scripts/dispatch/queue.mjs`: `STORY_FILENAME_RE`, the frontmatter
        `id` check and its error message, and `numericId`;
      - `scripts/lint-stories.mjs`: its own `STORY_FILENAME_RE`, the `id` and
        `depends_on` checks and their messages, the filename-prefix match and
        its message, the `stories/done/` id collection, and the ids read from
        `**Planned (…)**` markers;
      - `scripts/dispatch/coder.mjs`: the story-id checks in `retryStory` and
        in its command line, and its usage text (`USAGE`, and the usage error
        its command line throws);
      - `scripts/dispatch/story.mjs`: the checks in `runStory` and its command
        line, and its usage text;
      - `scripts/dispatch/review.mjs`: the id taken from a moved story file and
        from a `story/<prefix>-<n>-…` branch (`resolveStory`), which
        `scripts/dispatch/story-containment.mjs` also relies on.
      A message or usage text names the configured prefix (for example
      `ST-<n>`) or a neutral `<story-id>`; which one is the coder's choice.
- [ ] **AC-4** — Tests show the prefix is honoured, using a project root whose
      settings say `ST`:
      - the queue loads `stories/ST-3-thing.md` and ignores
        `stories/OQ-3-thing.md`;
      - the lint passes a well-formed `ST-3` story, and fails an `OQ-3` story
        and a `depends_on: [OQ-1]` entry in that project;
      - `resolveStory` reads `ST-3` from a branch `story/ST-3-thing` and from a
        moved `stories/done/ST-3-thing.md`;
      - `runStory` and `retryStory` accept `ST-3` and refuse `OQ-3`.
      With this repository's own settings, every existing test passes. The
      only change made to an existing test is supplying the settings: a
      `steward.config.json` written into its temporary root, or the settings
      passed in. No existing assertion or expected value changes. How the
      settings reach `buildStory`, `loadQueue`, `lintStory` and `lintAll` is the coder's
      choice, within AC-1: nothing falls back to a default when they are
      missing.
- [ ] **AC-5** — A test reads each module AC-3 names and fails if `OQ-`
      appears anywhere in it outside a comment: in a regular expression
      literal, a string literal or a template literal. So a later edit cannot
      quietly reintroduce the prefix, in a pattern or in text.
- [ ] **AC-6** — AC-1's settings tests: each invalid case named in AC-1
      throws, with the file named in the message.
- [ ] **AC-7** — The **Planned (OQ-122)** sentence in
      `docs/agent-workflow-design.md`, "The story artifact", "Format", is
      resolved as that document's "Reading this document" note says.

## Out of scope

- **Any other setting.** The base branch (`main`), the remote (`origin`), the
  `stories/` directory and the CI workflow path stay constants: they are the
  same in all three repositories (decided 2026-10-08 by the owner).
- **Where the project root is found.** Today it is the scripts' own checkout
  (`DISPATCHER_ROOT`). Taking it from the working directory is OQ-123.
- **The prompts.** `.claude/prompts/coder.md` and `reviewer.md` mention `OQ-`
  only in examples and history.
- **Prefixes in the workflow files** under `.github/`, and in documents.
- **Merging the two `STORY_FILENAME_RE` copies** (`queue.mjs` and
  `lint-stories.mjs`) into one. Both take the prefix; whether they become one
  is the coder's choice, not a requirement.

## Constraints

- Node, ESM, no new runtime dependency. The settings file is JSON, read with
  `JSON.parse`.

## Context

- The sites, found on `main` at `a2c7f7e` by searching the non-test modules
  for story-id patterns that spell `OQ`:
  `queue.mjs` lines 21, 181 and 205; `lint-stories.mjs` lines 26, 252–253,
  273–274, 296, 340 and 381; `coder.mjs` lines 539, 670 and 697; `story.mjs`
  lines 288 and 416; `review.mjs` lines 101 and 103.
- Text that spells `OQ-`, found on `main` at `909ad17` in the same modules
  and added to AC-3 after the dispatcher's review: the error message at
  `queue.mjs` line 182; the filename-prefix message at `lint-stories.mjs`
  line 299; `coder.mjs`'s `USAGE` (lines 654–655) and the usage error at line
  698; `story.mjs`'s usage text at line 415. No existing test asserts on any
  of them.
- Existing tests that run without a settings file, which AC-4 lets be given
  one: `loadQueue` on temporary roots in `queue.test.mjs` (lines 78, 131 and
  187, among others); `lintAll` on temporary roots in `lint-stories.test.mjs`
  (lines 110 and 114); and 24 `lintStory(…)` calls in `lint-stories.test.mjs`,
  23 of them on `OQ-9001-…` file names, which pass no root at all.
  The 8 `buildStory(…)` calls in `queue.test.mjs` also pass no root;
  `buildStory` is also called by `coder.mjs` (line 87), on stories read from
  git.
- `DEFAULT_REPO`: `coder.mjs` line 55, `land.mjs` line 45, `loop.mjs` line 63,
  `review.mjs` line 58, `story.mjs` line 49; used at `coder.mjs` lines 692 and
  695, `land.mjs` line 317, `loop.mjs` lines 318 and 488, `review.mjs` line
  385 and `story.mjs` line 412.
- How the project root is found today: `DISPATCHER_ROOT` in `coder.mjs`,
  `loop.mjs`, `review.mjs` and `story.mjs`; `loadQueue(rootDir)` and
  `lintAll(rootDir)` take it as a parameter, and `lintStory(filePath, source)`
  takes none.
- The decisions: `docs/agent-workflow-design.md` on `main` (landed with #199),
  "Portability", R3 and "The move, in order".

## Open questions

*(none)*

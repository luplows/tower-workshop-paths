---
id: OQ-100
title: Close the story lint's acceptance-criteria gaps, and test the lint as a command
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the person writing stories, I want the story lint to reject every
malformed acceptance criterion it currently lets through, and I want
`node scripts/lint-stories.mjs` itself tested, so that a malformed story
fails where OQ-61 said it would, and a coder or Session A running the command
by hand gets the result CI would give. #171's round-2 review found two ways
an AC escapes AC-5's check. It also found that no test runs the command, only
the function behind it.

## Acceptance criteria

- [ ] **AC-1** — An `**AC-0**` item is a blocking `AC-5` violation. OQ-61's
      AC-5 requires the ids to run `1..n`, and the gap check today starts at
      1, so nothing rejects 0. A test lints a story with `AC-0`, `AC-1` and
      `AC-2` and asserts one blocking `AC-5` violation, on the `AC-0` line.
- [ ] **AC-2** — In the `Acceptance criteria` section, a list item marked
      with `*` or `+` is a blocking `AC-5` violation, the same as a malformed
      `-` item is today. A list item here is a line that starts, at its
      first character, with `*` or `+` followed by a space. A line such as
      `*Barebones: to be refined in a planning session.*`, where the `*`
      opens italic text, is not a list item and stays unchecked. So do
      indented lines, such as an AC's continuation lines and nested
      sub-bullets. Tests cover:
      - a story whose last AC is written `* [ ] **AC-2** — …` fails, on that
        line;
      - the same with `+`;
      - a story whose section holds an italic line starting with `*` and no
        space, beside well-formed ACs, has no `AC-5` violation;
      - `lintAll` over the repository still reports no blocking violation.
        That covers the four italic lines named in Context and indented `-`
        sub-bullets such as OQ-99's.
- [ ] **AC-3** — A test runs `node scripts/lint-stories.mjs` as a child
      process, by the script's absolute path, with its working directory set
      to a temporary fixture root, and asserts:
      - with a story that has a blocking violation: exit code 1, and stderr
        has a line of the form `stories/<file>:<line>: <rule> <message>` for
        that violation;
      - with a clean story: exit code 0;
      - with only a non-blocking violation: exit code 0, and stderr has that
        violation's line. So a script that silently does nothing cannot pass
        either case that expects output.

## Out of scope

- **YAML block-style lists in frontmatter** (`depends_on:` followed by
  `  - OQ-45`). #171's review observed the parser rejects them as "not a
  list". No story uses that style, and the rejection is loud. The owner chose
  on 2026-09-28 not to follow it up.
- **Running the command in CI.** CI enforces the lint through the Vitest
  case that calls `lintAll(repoRoot)`, and that stays as it is. AC-3's test
  runs inside that suite.
- **Any other rule of OQ-61's lint**, and the non-blocking `mechanisms` lines
  it prints today for OQ-55 to OQ-60.

## Constraints

*(none)*

## Context

- `scripts/lint-stories.mjs` (OQ-61, #171):
  - `AC_ITEM_RE` is `/^-\s*\[[ xX]\]\s*\*\*AC-(\d+)([a-z]?)\*\*/`.
  - `lintAcceptanceCriteria` skips any line not matching `/^-/`, so a `*` or
    `+` item is never examined. It flags a `-` item that fails `AC_ITEM_RE`.
    Its gap check runs `for (let n = 1; n <= maxN; n++)`, which never looks
    at 0.
  - `main()` lints `process.cwd()` and prints each violation to stderr with
    `formatViolation`, as `<relative path>:<line>: <rule> <message>`. It sets
    `process.exitCode` to 1 if any violation is blocking, and 0 otherwise.
  - The command runs only when
    `process.argv[1] === fileURLToPath(import.meta.url)`.
    `scripts/report/review-verdicts.mjs` compares `realpathSync` of both
    instead. AC-3 tests the behaviour, not which comparison is used.
- Four stories on `main` have a line in `Acceptance criteria` that starts
  with `*` and is italic text, not a list item (AC-2):
  `stories/OQ-66-parallel-flows.md:19` (`*(provisional — …`), and line 19 of
  `OQ-95-gold-box-max-level.md`, `OQ-96-deprioritize-enhancements.md` and
  `OQ-97-clear-leading-zeros.md` (`*Barebones: to be refined in a planning
  session.*`). No story in `stories/done/` has such a line.
- `scripts/lint-stories.test.mjs` builds fixture roots with `mkdtemp` under
  `tmpdir()` (`tmpRoot`), and calls `lintAll` directly.
- `stories/done/OQ-61-story-schema-lint.md`, AC-5: "The set of N across a
  story is `1..n` with no gap and no duplicate, and `n >= 1`."
- #171's round-2 review, item 17 observations: an `**AC-0**` item is
  accepted; an AC written with a `*` bullet is skipped, and disappears with no
  violation if it is the last one; and "No test runs the CLI as a process".
- Raised by the dispatcher session on 2026-09-28. The owner chose to fold
  those observations into one story.

## Open questions

*(none)*

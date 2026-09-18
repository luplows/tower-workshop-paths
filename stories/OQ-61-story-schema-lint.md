---
id: OQ-61
title: Lint story files in CI
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the person writing stories, I want a malformed story to fail CI rather than fail
silently at dispatch, so that a schema defect surfaces in the PR that introduced it
instead of stalling the dispatcher or — worse — producing a story that dispatches
but cannot be reviewed against.

## Acceptance criteria

- [ ] **AC-1** — `node scripts/lint-stories.mjs` validates every `stories/*.md` and
      `stories/done/*.md`. A conforming set exits `0` and writes nothing to stderr.
      A non-conforming set exits non-zero and writes one line per violation naming
      the file path, the identifier of the rule broken, and the 1-based line number.
      All violations are reported in a single run; it does not stop at the first.
- [ ] **AC-2** — Frontmatter is rejected when any of `id`, `title`, `tier`,
      `kind`, `depends_on`, `model`, `blocked` is absent; when `id` does not match
      `^OQ-\d+$`; when `tier` is not one of exactly `fix`, `next`, `normal`,
      `later`; when `kind` is not one of exactly `product`, `workflow`; when
      `depends_on` is not a list (possibly empty) whose every entry matches
      `^OQ-\d+$`; or when `blocked` is neither null nor a non-empty string. An
      unknown extra key is reported but does **not** fail the run, so the schema
      can be extended without a flag day.
- [ ] **AC-3** — A story whose `id` does not equal the `OQ-NN` prefix of its own
      filename is rejected. `stories/OQ-9001-anything.md` carrying `id: OQ-9002`
      fails; the slug after the prefix is not otherwise constrained. Fixtures use
      four-digit ids so they cannot collide with a real story.
- [ ] **AC-4** — All six sections `Intent`, `Acceptance criteria`, `Out of scope`,
      `Constraints`, `Context`, `Open questions` must be present as level-2
      headings. Rejection names every missing heading, not just the first.
- [ ] **AC-5** — Every acceptance criterion is a task-list item carrying
      `**AC-N**`. The set of N across a story is `1..n` with no gap and no
      duplicate, and `n >= 1`. A story with an `AC-3` but no `AC-2`, or with two
      `AC-1`s, or with an empty `Acceptance criteria` section, is rejected.
- [ ] **AC-6** — A section whose only content is an italic parenthetical —
      `*(none)*`, `*(must be empty to dispatch)*`, or any `*(...)*` alone on its
      line — is treated as **empty**, identically to a section with no content at
      all. A story whose `Open questions` section holds only such a placeholder is
      therefore reported as `ready`, not `draft`. Both forms are covered by
      fixtures, and the equivalence is asserted for `Constraints` as well.

## Out of scope

- **Cross-file duplicate `id` detection.** It needs its own story: the rule is
  cross-file rather than per-file, and the cause is upstream — the design documents
  spend real OQ numbers on illustrative examples, which is how `OQ-49` came to be
  assigned twice. This lint validates one file at a time.
- Any judgment about whether a story is *good* — sizing, AC quality, whether the
  intent is coherent. Schema only. The readiness test stays human.
- `AC`↔test traceability. Separate check, separate story.
- Deriving `in-progress` / `in-review` from git or GitHub state. This reads files.

## Constraints

- Node, ESM, no new runtime dependencies. A frontmatter parser may be added as a
  dev dependency.
- Runs inside the existing `test` job. No new CI job, and no added wall-clock
  budget beyond the file read — the suite stays at ~70 s.
- Exit code and stderr are the only outputs. No labels, annotations, or PR
  comments; those couple the lint to GitHub and it must be runnable offline.
- The permitted values in AC-2 are the schema for the purposes of this story. If
  `stories/_TEMPLATE.md` disagrees with them, the template is wrong and is fixed
  in this PR.

## Context

- `scripts/verify-workshop-costs.test.mjs` — the house style for a script with
  unit tests alongside it.
- `docs/agent-workflow-design.md`, *The story artifact* — where the schema and the
  derived-status table come from.
- The story-artifact example in `docs/agent-workflow-design.md` and the worked example in
  `docs/migration-plan.md` both carry placeholder-only sections
  (`*(must be empty to dispatch)*` and `*(none)*`). Build AC-6's fixtures from
  those two forms under `test/fixtures/` rather than pointing tests at a live
  story, which will move to `done/`.

## Open questions

*(none)*

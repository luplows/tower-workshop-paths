---
id: OQ-49
title: Read and rank the story queue
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the dispatcher, I need to know which story to work on next, so that story
selection is deterministic and needs no human or model judgment.

## Acceptance criteria

- [ ] **AC-1** — `queue.mjs` treats exactly the files matching
      `OQ-<n>-<slug>.md` in `stories/` and `stories/done/` as stories.
      `README.md` and `_TEMPLATE.md` sit in the same directory and are not
      stories; neither is any other name.
- [ ] **AC-2** — A story whose frontmatter is missing, unparseable, or missing
      a required field fails the run loudly, naming the file — it is never
      skipped, and never silently defaulted.
- [ ] **AC-3** — Status is derived, never read from a field, and the first
      match in this order wins: `done` (the file is in `stories/done/`),
      `blocked` (`blocked` is non-null), `draft` (**Open questions** holds
      content beyond the empty marker, per AC-7), `waiting` (a `depends_on`
      entry is not in `stories/done/`), `ready` (none of the above).
- [ ] **AC-4** — Only `ready` stories are returned as dispatchable. A `waiting`
      story is still listed, with what it is waiting on.
- [ ] **AC-5** — Ordering is by `tier` — `fix`, `next`, `normal`, `later`, in
      that order — then lowest id first, and is identical across runs regardless
      of the order the filesystem enumerates files in. An unrecognised `tier`
      fails loudly per AC-2 rather than sorting somewhere arbitrary.
- [ ] **AC-6** — Run as a script (`node scripts/dispatch/queue.mjs`) it prints
      every story in that order with its id, title and derived status, and
      exits non-zero if any story failed to parse.
- [ ] **AC-7** — A section counts as empty when its content, ignoring HTML
      comments and whitespace, is exactly `*(none)*`. A section holding nothing
      at all is **malformed** and fails loudly per AC-2, because it cannot be
      told apart from one nobody filled in. This file uses the marker, and must
      therefore derive `ready` rather than `draft` — a queue reader that cannot
      dispatch its own story is the failure this criterion exists to prevent.
- [ ] **AC-8** — Section boundaries ignore fenced code blocks. A `## ` line
      inside a fence is content, not a heading, so it neither starts a section
      nor ends one. `stories/OQ-51-*.md` carries `## Open questions` inside a
      fence at one point in the file and the real heading later; a scanner that
      takes the first `^## Open questions` reads the wrong section entirely.
      That file is the fixture — a naive parser gets `draft` from it for the
      wrong reason, and would get `ready` wrong for a story arranged slightly
      differently.

## Out of scope

- Spawning anything. Selection only.
- Reading git or GitHub state. `in-progress` and `in-review` from the status
  table in `stories/README.md` are derived from branches and PRs, and belong to
  `dispatch.mjs` later — `queue.mjs` derives only the five states in AC-3.
- Writing to any story file, including setting `blocked`.
- Reading `kind`. It groups stories for people, and `stories/README.md` states
  that nothing in the dispatcher reads it and nothing in the ordering may. Sorting
  by it later should be a visible violation rather than a natural extension.
- Validating anything beyond the fields this module reads. A full schema lint
  is a later story.

## Constraints

- Node, ESM, no new runtime dependencies. A frontmatter parser is a dev
  dependency at most.
- Lives at `scripts/dispatch/queue.mjs` with `queue.test.mjs` beside it; Vitest
  already discovers `scripts/**/*.test.mjs` with no config change.

## Context

- `stories/README.md` — the status table, the ordering rule, and the filename
  rule this implements
- `stories/_TEMPLATE.md` — the schema, as a file
- `scripts/verify-workshop-costs.test.mjs` — the house style for a tested
  script: pure exported functions, `// @vitest-environment node`, and a thin
  CLI wrapper over them
- `scripts/lib/resolve-extensionless.mjs` — the `--import` shim other scripts
  need; this one reads markdown rather than importing app source, so it
  should not need it

## Open questions

*(none)*

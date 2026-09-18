---
id: OQ-55
title: Declare a story's mechanisms and lint that they exist
tier: next
kind: workflow
depends_on: [OQ-61]
model: sonnet
blocked: null
mechanisms:
  - the lint's frontmatter validation
  - the story schema of record (template, design doc, review checklist)
---

## Intent

As the person writing stories, I want each story to declare the mechanisms it
touches, so that the sizing judgment Session A makes when marking a story ready
leaves a durable trace instead of living only in the conversation that produced it.
A judgment nobody can find later is a judgment nobody can be shown to have skipped.

## Acceptance criteria

- [ ] **AC-1** — `mechanisms` is a required frontmatter key holding a non-empty
      list of non-empty strings. Absent, `[]`, an entry that is blank or
      whitespace, or a value that is not a list, is rejected — naming the file,
      the rule, and the line.
- [ ] **AC-2** — The lint validates the shape of the list and nothing about its
      content. Any non-empty list of non-empty strings passes: no count ceiling,
      no keyword or vocabulary matching, no cross-check against the acceptance
      criteria. A test asserts that a nine-entry list passes, so that a later
      change cannot reintroduce a cap without failing a test that says why.
- [ ] **AC-3** — `stories/_TEMPLATE.md` carries the field with a one-line note on
      what belongs in it, and the story schema in `docs/agent-workflow-design.md`
      matches. Every story already in `stories/` and `stories/done/` is updated so
      the lint passes against the current corpus in the same PR.
- [ ] **AC-4** — `REVIEW.md` item 18 (containment) is extended to cover mechanisms
      the story did not declare. It stays one item — the checklist grows by a
      clause, not by an entry.

## Out of scope

- **Attributing each acceptance criterion to a declared mechanism.** It is the
  stronger check and it is deliberately deferred: it costs AC-level tagging across
  every story, and nothing has yet gone wrong in a way the declaration alone would
  have missed. Revisit when something does — the failure will also say which of
  the deferred checks would have caught it.
- **A pre-implementation check in the worker.** Same reasoning. The worker's
  existing write-and-exit route already covers it informally once the declaration
  exists to compare against.
- **Any ceiling on the number of mechanisms**, in the lint or anywhere else. This
  is a decision, not an omission: see AC-2 and *Sizing is a judgment* in the
  design doc.
- **Counting files or directories touched in a diff.** A cheaper and weaker
  signal, worth collecting as measurement before it is ever considered as a gate.
  Separate story if wanted.

## Constraints

- Extends the existing story lint. No new script, no new CI job.
- Entries are free prose. A controlled vocabulary would need maintaining and would
  drift from the codebase within weeks; the value is in the author naming the
  mechanisms at all, not in the names being canonical.

## Context

- `stories/OQ-61-story-schema-lint.md` — the lint this extends. AC-2 there
  enumerates the frontmatter rules this adds to.
- `stories/OQ-54-coder-model-default.md` — also amends the same frontmatter
  validation, for `model`. Semantically independent, but the two will conflict
  textually if in flight together. Lowest-id-first ordering serialises them while
  dispatch is one story at a time; revisit before parallel dispatch.
- `docs/agent-workflow-design.md`, *Sizing is a judgment, and it is Session A's* — the
  decision this implements, and the reason AC-2 forbids a ceiling.
- `REVIEW.md` item 18 — the containment item AC-4 extends.

## Open questions

*(none)*

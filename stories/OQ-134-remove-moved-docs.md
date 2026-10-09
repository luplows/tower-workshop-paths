---
id: OQ-134
title: Remove the workflow documents that moved to steward, keeping this project's passages in its README and outline
tier: next
kind: workflow
depends_on: [OQ-132, OQ-133]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the workflow's documents gone from this repository once
steward holds them, with the few passages about this project kept where a
reader of this project looks, so that there is one design of record for the
workflow and this repository's documents are about the product. No file here is
about steward in particular: a project should not need one (decided 2026-10-08
by the owner).

## Acceptance criteria

- [ ] **AC-1** — These are removed: `docs/agent-workflow-design.md`,
      `docs/harness-outline.md`, `docs/session-a.md`, `docs/migration-plan.md`,
      `docs/gap-analysis.md` and `docs/steward-bootstrap.md`.
- [ ] **AC-2** — The design doc's passages about this project are kept, each
      where the owner placed it on 2026-10-08:
      - Pages as the alpha channel, and tags as reviewed checkpoints
        ("Branching and releases"): `README.md`, beside the live-demo line;
      - no production deployment target yet (its open question 9):
        `Project-Outline.md`, "Non-Goals (for now)";
      - the buy-order invariants given as examples for property-based and
        golden tests ("Quality beyond the gate", items 3 and 4):
        `Project-Outline.md`, "Core Feature: Recommended Buy Order";
      - validating scraped data (item 5): `README.md`, "Data drift".
- [ ] **AC-3** — `README.md` has one short paragraph saying the agent workflow
      is steward, pinned in `package.json`, with a link to `luplows/steward`,
      and its pointer at `docs/agent-workflow-design.md` (line 7) points there
      instead.
- [ ] **AC-4** — Outside `stories/` and `Completed-Questions.md`, nothing refers
      to a removed document, shown by a `git grep` in the pull request body.
- [ ] **AC-5** — The **Planned (…)** marker in "Portability", "Decided so far",
      goes with the design doc. This is the last story it names, so the pull
      request body says so in place of resolving it.

## Out of scope

- **`mytower.app` as an example of network egress.** It is dropped here
  (decided 2026-10-08 by the owner, after #223's review; the design doc's R1).
  The coder's line about it reaches the prompt through steward's project
  section (OQ-115).
- **Stories that stay here and cite a removed document**, such as OQ-72 and
  OQ-94. A coder's pull request may not change other stories (OQ-82), so
  Session A repoints them in a `write-story/` pull request.
- **`CLAUDE.md`'s documents table** (OQ-133, which this depends on).

## Constraints

*(none)*

## Context

- **After OQ-132 as well as OQ-133** (owner, 2026-10-09, from #223's review,
  item 24): the moved code refers to `docs/agent-workflow-design.md`, so AC-4
  needs it gone, and OQ-132's own AC-5 edits that document's marker, which this
  story deletes.
- Decided 2026-10-08 by the owner, refining OQ-115: the passages go to
  `README.md` and `Project-Outline.md`, not to a document about the workflow;
  `docs/steward-bootstrap.md` moves to steward with its history (the
  bootstrap's D-9).
- On `main` at `c97aa50`, in `docs/agent-workflow-design.md`: "Branching and
  releases" at line 985; "Quality beyond the gate" items 3, 4 and 5 at lines
  1105, 1110 and 1113; the open questions table's row 9 at line 1970;
  `mytower.app` as an egress example at lines 430 and 1140.
- `README.md` line 5 is the live-demo line, and line 7 points at
  `docs/agent-workflow-design.md`. `Project-Outline.md` has "Core Feature:
  Recommended Buy Order" and "Non-Goals (for now)".

## Open questions

*(none)*

---
id: OQ-133
title: Cut CLAUDE.md, REVIEW.md and the stories README down to this project's own rules, pointing at steward's
tier: next
kind: workflow
depends_on: [OQ-115]
model: sonnet
blocked: null
---

## Intent

As the owner, I want this repository's rule files to hold only this project's
own rules, with steward's rules reaching every session from steward, so that a
workflow rule has one home and changes in steward without an edit here. Today
`CLAUDE.md`, `REVIEW.md` and `stories/README.md` hold both.

## Acceptance criteria

- [ ] **AC-1** — `CLAUDE.md` keeps this project's own rules: committing a data
      regeneration separately; the docs check naming `README.md`,
      `Open-Questions.md` and `Project-Outline.md`; nothing dispatches from
      `Open-Questions.md`; looking things up in `Completed-Questions.md` by OQ
      number; and all of "Testing". Steward's rules ("Branches and pull
      requests", "Claims about this repository" and "Stories", less the items
      above) reach sessions here from steward.
- [ ] **AC-2** — `REVIEW.md` keeps the content of its items 8 and 10, which
      name Vitest, Playwright, the buy-order algorithm and screenshot baselines.
      Steward's checklist reaches the reviewer and the coder from steward.
- [ ] **AC-3** — `stories/README.md` is a short file pointing at steward's story
      schema, and `stories/_TEMPLATE.md` is removed in favour of steward's.
- [ ] **AC-4** — `OQ-133` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "Portability", "Decided so far", as that
      document's "Reading this document" note says.

## Out of scope

- **The moved documents** (OQ-134). `CLAUDE.md`'s "Where things are
  documented" table points at steward's copies once this lands, so OQ-134
  can remove the local ones.
- **The code** (OQ-132).
- **`.github/pull_request_template.md`**, which stays as it is.

## Constraints

*(none)*

## Context

- Decided 2026-10-08 by the owner, refining OQ-115: which rules are this
  project's and which are steward's is settled (AC-1, AC-2); how steward's
  reach a project's sessions is decided once steward builds the mechanism.
- The coder reads `CLAUDE.md` and `REVIEW.md` from the repository root
  (`.claude/prompts/coder.md` line 140), and the reviewer reads `REVIEW.md`
  there (`reviewer.md` line 171). The reviewer cites `REVIEW.md` items by
  number (for example items 16–18, `reviewer.md` line 152).
- R1 removes items 8 and 10 from steward's copy of `REVIEW.md`, leaving gaps,
  and a steward story closes them.

## Open questions

- How steward's rules reach this project's sessions (AC-1): a `CLAUDE.md`
  import of a rules file steward ships, a link to steward at the pinned tag, or
  the prompts' project section. An import has to be shown to work for a path
  under `node_modules` and in a spawned session. Decided once steward builds
  the mechanism (owner, 2026-10-08).
- The form of this project's review items (AC-2), and how they reach the
  reviewer alongside steward's numbered checklist (R3, "a project's own review
  items come later"). Decided after steward is built (owner, 2026-10-08).

---
id: OQ-53
title: Import current levels from playerInfo.dat
tier: later
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want to import my Workshop and Enhancement levels straight from the
game's save data, so that the levels held here match my save exactly without my
typing in every one.

## Acceptance criteria

- [ ] **AC-1** — A file picker accepts a `playerInfo.dat` and the import runs to
      completion on a valid file.
- [ ] **AC-2** — An unparseable file is rejected atomically: the entered levels
      after a failed import are identical to the levels before it, with no partial
      writes. An error is surfaced that names the rejected file and does not expose
      a raw exception or stack trace.
- [ ] **AC-3** — Workshop levels present in the file replace the entered values.
- [ ] **AC-4** — Enhancement levels present in the file replace the entered values.
- [ ] **AC-5** — Workshop and Enhancement levels absent from the file are set to
      zero, not left at their entered values. The import is a snapshot of the save,
      not a merge into what was already typed.

## Out of scope

- Any interaction with OQ-22's Clear button. Import and Clear stay separate
  actions; AC-5 gives import a zeroing effect that overlaps Clear, and reconciling
  the two is a later story.
- Undo of a successful import. AC-2 covers the failed-import case only.
- Any server-side parsing. Client-only per `Project-Outline.md`.

## Constraints

- Escalate `model` to opus if Open question 1 lands a binary format; sonnet is
  adequate for a text format.

## Context

- `src/state/` — where entered levels live today
- OQ-24 — the original investigation, in `Completed-Questions.md`

## Open questions

1. **What is the on-disk structure of `playerInfo.dat`?** How Workshop and
   Enhancement levels are keyed, and whether the file is text or binary. Until this
   is written into **Constraints**, AC-3 to AC-5 are not reviewable: a reviewer
   holding only this story cannot tell a correct parse from a plausible one.
2. **Can "absent" be distinguished from "zero" in the file?** If a save always
   stores a complete set of levels including unpurchased ones, AC-5 is vacuous and
   the import is simply a full replace. Confirm against a real save before
   accepting AC-5.
3. **Does AC-5 apply per item or per category?** If a save carries Workshop data
   and no Enhancement section at all, does the import zero every Enhancement level
   the player typed in? That is the case most likely to destroy hand-entered data,
   and it needs an explicit answer rather than an inferred one.
4. **What counts as unparseable for AC-2?** Truncation, a wrong header, valid
   structure with missing keys, and keys with out-of-range values are four
   different failures. Which of them reject the whole file?

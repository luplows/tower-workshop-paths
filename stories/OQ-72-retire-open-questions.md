---
id: OQ-72
title: Retire Open-Questions.md now that nothing is left in it
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As anyone reading this repository, I want one queue rather than an empty second
one, so that there is no file whose only remaining content is an explanation of
why it is empty.

## Acceptance criteria

- [ ] **AC-1** — `Open-Questions.md` is deleted.
- [ ] **AC-2** — The docs check names two files, not three. `CLAUDE.md` and
      `.github/pull_request_template.md` both list `README.md`,
      `Open-Questions.md` and `Project-Outline.md`; both are updated, and they
      agree with each other.
- [ ] **AC-3** — `REVIEW.md` items 3 and 4 are updated. Item 3 requires a docs
      check outcome for the three files; item 4 requires a pull request resolving
      an entry from `Open-Questions.md` to move that entry — an instruction with
      no possible subject once the file is gone.
- [ ] **AC-4** — `README.md`'s two references are repointed. Line 60 cites the
      file for drift-detection follow-up and line 73 offers it as "the full
      backlog" — the backlog readers should be sent to is `stories/`.
- [ ] **AC-5** — `OQ-1-Checklist.md`'s header link resolves. It currently points
      at `Open-Questions.md` for OQ-1, whose story is now
      `stories/OQ-1-confirm-max-levels-in-game.md`.
- [ ] **AC-6** — `Completed-Questions.md`'s two `[OQ-4x](Open-Questions.md)` links
      resolve. This is the only edit to the archive; its prose is history and is
      not rewritten.
- [ ] **AC-7** — Four stale citations of "Open-Questions.md OQ-42" are corrected
      to `Completed-Questions.md`, where OQ-42's entry has been since it was
      resolved: `.claude/hooks/session-start.sh` twice,
      `.github/workflows/review-gate.yml` and `.github/workflows/detect-drift.yml`.
      These are wrong today, independently of this story.
- [ ] **AC-8** — No reference to `Open-Questions.md` remains anywhere outside
      `Completed-Questions.md`'s historical prose, `docs/gap-analysis.md` and
      `docs/migration-plan.md`. A grep in the PR body demonstrates it.
- [ ] **AC-9** — `stories/README.md`'s "Three places work lives" table becomes
      two places, and stops saying the file "keeps its name because
      `Completed-Questions.md` and several workflow comments reference it by that
      name" — a reason that no longer holds once AC-6 and AC-7 are done.

## Out of scope

- **Rewriting `docs/migration-plan.md`.** Its header forbids it: the plan is kept
  as written, and a step overtaken by events is annotated inline. Its several
  references to the two-queue drain get an inline note recording that the drain
  finished, not an edit.
- **`docs/gap-analysis.md`.** A dated snapshot, kept for its reasoning. Its
  references to `Open-Questions.md` describe the state when it was written and
  stay as they are.
- **Rewriting `Completed-Questions.md`'s prose.** AC-6 fixes two links and
  nothing else.
- **Changing the OQ numbering scheme.** Numbers stay permanent, never reused,
  never renumbered, across `stories/`, `stories/done/` and the archive.

## Constraints

- No entry may be lost. Every story that was in `Open-Questions.md` exists in
  `stories/` before this story is dispatched, which is what makes AC-1 a deletion
  rather than a migration.

## Context

Written 2026-09-19, in the same pull request that drained the file. The six
remaining entries were refined into `stories/OQ-1-confirm-max-levels-in-game.md`,
`OQ-45-verify-enhancement-costs.md`, `OQ-8-buyout-from-lifetime-coins.md`,
`OQ-9-verify-on-real-mobile.md`, `OQ-46-batch-walkthrough.md` and
`OQ-47-review-block-rate.md`.

**The file is kept, drained, rather than deleted in that pull request**, because
deleting it requires editing `CLAUDE.md`, and `CLAUDE.md` is being rewritten in a
separate pull request at the same time. Splitting the deletion out avoids two
pull requests editing the same file for unrelated reasons.

The migration plan anticipated this ending: *"Two queues coexist during the
drain"*, mitigated by documenting that nothing dispatches from the backlog. The
drain is now finished, so the mitigation can be retired with the file.

**The reason originally given for keeping the name no longer applies.**
`stories/README.md` says the file keeps its name because other files reference it
by that name. Those references are AC-6 and AC-7, and four of them are pointing
at the wrong file already.

- `stories/README.md` — the three-places table AC-9 reduces
- `docs/migration-plan.md` — the drain it planned for, annotated rather than
  edited
- `stories/OQ-71-single-source-of-record.md` — the companion story; AC-7's stale
  citations are the same defect class it addresses

## Open questions

*(none)*

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
why it is empty, and no pointer sends a reader to it for something that is not
there.

## Acceptance criteria

Line numbers are at `f5cb7b1`. Where a file has changed since, the quoted
text is what identifies the place.

- [ ] **AC-1** — `Open-Questions.md` is deleted.
- [ ] **AC-2** — The docs check names two files, not three:
      `README.md` and `Project-Outline.md`. `CLAUDE.md` line 19 and
      `.github/pull_request_template.md` lines 14–17 are updated, and they
      agree with each other. The template's sentence about noting an open
      question's move to `Completed-Questions.md` goes, since nothing is moved
      there any more (AC-4).
- [ ] **AC-3** — `CLAUDE.md`'s "Stories" bullet "Nothing dispatches from
      `Open-Questions.md`. It is the idea backlog." (line 62) is replaced by
      one saying where an unrefined idea goes: a story file under `stories/`
      whose **Open questions** section is not empty, which the queue shows as
      `draft` and never dispatches (`stories/README.md`, status derivation).
- [ ] **AC-4** — `REVIEW.md` items 3, 4 and 5 are updated, and no item is
      renumbered, since other files cite items by number:
      - item 3 requires a docs check outcome for the two files of AC-2;
      - item 4 no longer tells a pull request to move an `Open-Questions.md`
        entry into `Completed-Questions.md`. It says instead that
        `Completed-Questions.md` is a closed archive, and that a pull request
        implementing a story completes it by item 19;
      - item 5 checks a new number against `stories/` (`done/` and `retired/`
        included) and `Completed-Questions.md`, and no longer names
        `Open-Questions.md`.
- [ ] **AC-5** — `docs/session-a.md`, "Writing it", first bullet (line 29),
      drops `Open-Questions.md` from the places a new number is checked
      against, as AC-4 does for item 5.
- [ ] **AC-6** — `stories/README.md` no longer describes the backlog:
      - the table under "Three places work lives, and what dispatches from
        which" loses its `Open-Questions.md` row (line 14), and the heading
        stops giving a count, since the table has more than three rows;
      - the paragraph from "**Nothing dispatches from `Open-Questions.md`.**"
        (line 20) to "reference it by that name." (line 25) is replaced by one
        saying where an unrefined idea goes, as AC-3 does;
      - "Numbering" (lines 33–37) stops calling the scheme "unchanged from
        `Open-Questions.md`" and stops naming "the backlog" as a place a
        number lives, and "check all three places" names the places it means.
- [ ] **AC-7** — `README.md`'s three references are repointed:
      - line 7, which calls the file "the idea backlog behind" `stories/`;
      - line 60, which cites it for OQ-43, now in `Completed-Questions.md`;
      - line 73, which offers it as "the full backlog". The backlog readers
        should be sent to is `stories/`.
- [ ] **AC-8** — The two pointers to OQ-1 resolve to
      `stories/OQ-1-confirm-max-levels-in-game.md`: `Project-Outline.md`
      line 26, and `OQ-1-Checklist.md`'s header link (line 3).
- [ ] **AC-9** — `Completed-Questions.md`'s three links into
      `Open-Questions.md` resolve to where each story is: `[OQ-45]` on line
      221, and `[OQ-47]` and `[OQ-48]` on line 252. This is the only edit to
      the archive. Its prose is history and is not rewritten.
- [ ] **AC-10** — Three stale workflow citations of "Open-Questions.md" for
      OQ-42 and OQ-43 point at `Completed-Questions.md`, where both entries
      have been since they were resolved: `.github/workflows/review-gate.yml`
      line 3 (OQ-42), and `.github/workflows/detect-drift.yml` lines 3 (OQ-43)
      and 121 (OQ-43, in the issue text the workflow writes). These are wrong
      today, independently of this story.
- [ ] **AC-11** — The same correction in `.claude/hooks/session-start.sh`,
      lines 60 and 86 (OQ-42).
- [ ] **AC-12** — The 13 code comments in 10 files that cite
      `Open-Questions.md` point at `Completed-Questions.md`, where every OQ
      they name is archived:
      - `scripts/extract-enhancement-data.mjs` (OQ-39);
      - `src/components/AppSectionTabs.jsx` (OQ-17);
      - `src/components/CategoryLevelInputs.jsx`,
        `EnhancementInputs.test.jsx` and `WorkshopInputs.test.jsx` (OQ-16);
      - `src/components/UpgradePath.test.jsx` (OQ-2);
      - `src/data/enhancementPriority.js` (OQ-3 and OQ-2);
      - `src/utils/cheapestNextUpgrades.js` (lines 206 and 514, OQ-2);
      - `src/utils/enhancementDiscount.js` (OQ-37);
      - `src/utils/workshopDiscount.js` (OQ-4).

      `src/utils/cheapestNextUpgrades.js` line 83 names no OQ. It either
      names the archived entry that decided unlock-group costs are not
      discounted, or drops the pointer. Only comments change: no code,
      test assertion or behaviour.
- [ ] **AC-13** — In `docs/agent-workflow-design.md`, the "Stays here"
      column of R1's table no longer lists `Open-Questions.md`.
- [ ] **AC-14** — `git grep -n "Open-Questions"` finds nothing outside this
      list, and the PR body gives the command and its full output:
      - `Completed-Questions.md`'s prose, and `docs/gap-analysis.md`,
        `docs/migration-plan.md` and `docs/steward-bootstrap.md`, which are
        records;
      - `docs/agent-workflow-design.md`'s accounts of the extraction: the
        "Checked again at the real run" paragraph, and R4's list of the
        stories that stay here;
      - `scripts/dispatch/fixtures/oq75-coder-envelope.json`, a recorded
        session envelope;
      - files under `stories/`, this story's own included once it is in
        `stories/done/`. A coder's pull request may not change other stories
        (OQ-82), and this one's mentions describe what it did.

## Out of scope

- **Rewriting `docs/migration-plan.md`.** Its header forbids it: the plan is kept
  as written, and a step overtaken by events is annotated inline. Its several
  references to the two-queue drain get an inline note recording that the drain
  finished, not an edit.
- **`docs/gap-analysis.md` and `docs/steward-bootstrap.md`.** Records of their
  time. Their references describe the state when they were written and stay as
  they are.
- **Rewriting `Completed-Questions.md`'s prose.** AC-9 fixes three links and
  nothing else.
- **Other story files.** Their mentions are history ("Refined out of
  `Open-Questions.md` on 2026-09-19") or are Session A's to reword: OQ-133's
  AC-1 lists `Open-Questions.md` among `CLAUDE.md`'s project rules, and OQ-71's
  AC-7 cites, as examples, the stale OQ-42 and OQ-48 pointers this story
  fixes.
- **Changing the OQ numbering scheme.** Numbers stay permanent, never reused,
  never renumbered, across `stories/`, `stories/done/`, `stories/retired/` and
  the archive.

## Constraints

- No entry may be lost. Every story that was in `Open-Questions.md` exists in
  `stories/` or `stories/done/` before this story is dispatched, which is what
  makes AC-1 a deletion rather than a migration. The file's own table lists
  them.
- If a write under `.claude/hooks/` is refused, handle AC-11 the way
  `.claude/prompts/coder.md` says to handle a refused write under
  `.claude/prompts/`: give the edit as a diff in the PR body, and leave AC-11
  unticked.

## Context

Written 2026-09-19, in the same pull request that drained the file. The six
remaining entries were refined into `stories/OQ-1-confirm-max-levels-in-game.md`,
`OQ-45-verify-enhancement-costs.md`, `OQ-8-buyout-from-lifetime-coins.md`,
`OQ-9-verify-on-real-mobile.md`, `OQ-46-batch-walkthrough.md` and
`OQ-47-review-block-rate.md`.

**The file was kept, drained, rather than deleted in that pull request**,
because deleting it requires editing `CLAUDE.md`, and `CLAUDE.md` was being
rewritten in a separate pull request at the same time.

**Held from 2026-10-10 until steward was extracted**, since `CLAUDE.md`,
`REVIEW.md`, the pull request template and `stories/README.md` were among the
paths that moved (`docs/agent-workflow-design.md`, "Portability", "Decided so
far"). **Refined again on 2026-10-12, when the hold was cleared.** The
references had grown since 2026-09-19. Each one in AC-2 to AC-13 was re-derived
at `f5cb7b1` with `git grep -n "Open-Questions"`. The first version's AC-8,
"no reference anywhere outside three files", could not be met, since a coder
may not edit other story files. AC-14 lists what stays instead.

The migration plan anticipated this ending: *"Two queues coexist during the
drain"*, mitigated by documenting that nothing dispatches from the backlog. The
drain is now finished, so the mitigation can be retired with the file.

**The reason originally given for keeping the name no longer applies.**
`stories/README.md` says the file keeps its name because other files reference it
by that name. Those references are AC-9 to AC-12, and the OQ-42 and OQ-43
citations among them already point at the wrong file.

- `stories/README.md` — the table and paragraphs AC-6 changes
- `docs/migration-plan.md` — the drain it planned for, annotated rather than
  edited
- `stories/OQ-71-single-source-of-record.md` — the companion story; AC-10's
  stale citations are the same defect class it addresses

## Open questions

*(none)*

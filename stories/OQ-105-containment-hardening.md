---
id: OQ-105
title: Fail story containment when the branch and the move name different stories, and keep the head branch name out of workflow shells
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want the `stories/` containment check (OQ-82) to fail a pull
request whose head branch names one story while its diff moves a different one,
whether steward's coordinator or a person made the branch, and I want no
workflow to paste the head branch name into a shell command, so that a coder
cannot pass containment by completing the wrong story, and a branch name cannot
run as a command.

## Acceptance criteria

- [ ] **AC-1** — A head branch **names** story OQ-n when it matches either
      form:
      - `story/OQ-<n>-…`, the form used for stories implemented by hand;
      - `handoff/H-<k>-stories-oq-<n>-…`, the form steward's coordinator
        gives the handoff of `stories/OQ-<n>-….md`.

      `checkStoryContainment` in `scripts/story-containment.mjs` returns
      `ok: false` when `resolveStory` resolves the diff as `moved` with id
      OQ-m, and the head branch names OQ-n with n ≠ m. One violation names the
      moved story's file under `stories/done/`, and its message names both
      ids.
- [ ] **AC-2** — `resolveStory`'s fallback, used when the diff moves no story,
      resolves a branch that names OQ-n in either form of AC-1 as
      `branch-only` with id OQ-n. Today only the `story/` form does.
- [ ] **AC-3** — Nothing else about the check's result changes. In particular:
      a branch in either form and a move of the story it names, a move with a
      branch in neither form (for example `write-story/…` or `chore/…`), and a
      move with no branch given are all decided exactly as at `7656e00`.
- [ ] **AC-4** — `scripts/story-containment.test.mjs` adds fixtures, named
      `OQ-105/AC-…`, for:
      - a `story/OQ-82-…` branch whose diff moves and ticks a different story,
        which fails as AC-1 says;
      - a `handoff/H-1-stories-oq-82-…` branch whose diff moves and ticks a
        different story, which fails as AC-1 says;
      - a `handoff/H-1-stories-oq-82-…` branch moving OQ-82, which passes;
      - a `handoff/H-1-stories-oq-82-…` branch with no move whose diff adds a
        story, which the fallback catches as AC-2 says;
      - a move on a `write-story/…` branch, which is decided as at `7656e00`.

      The OQ-82 fixtures already in that file still pass, unmodified.
- [ ] **AC-5** — In `.github/workflows/ci.yml`, the "Check story diff
      containment (OQ-82)" step passes the head branch name to the script
      through an `env:` entry, referenced as a quoted shell variable. No
      `${{ github.head_ref }}` appears in that step's `run:`.
- [ ] **AC-6** — In `.github/workflows/update-screenshots.yml`, the
      `git push` step passes `github.event.pull_request.head.ref ||
      github.ref_name` through an `env:` entry, referenced as a quoted shell
      variable. No `${{ … }}` expression appears in that step's `run:`. The
      `concurrency.group` and `actions/checkout` `ref:` uses are not shell, and
      are left as they are.
- [ ] **AC-7** — After the change, no `run:` block in any file under
      `.github/workflows/` contains `github.head_ref`, `head.ref`,
      `pull_request.title` or `pull_request.body`. The PR body gives the grep
      used and its output.
- [ ] **AC-8** — The `**Planned (OQ-105)**` marker in
      `docs/agent-workflow-design.md` is resolved as that document's "Reading
      this document" note says.

## Out of scope

- Reporting every offending line rather than the first per file (the second
  observation on PR #178). The owner chose not to pursue it.
- How steward's reviewer finds the story to review against. It reads the
  pull request's `Unit:` line (`steward.config.json` has
  `unitLinks: ["file"]`), not this script.
- The workflows steward manages, `review-gate.yml`, `land-approved.yml` and
  `inspection.yml`. `steward upgrade` rewrites them (#286 changed exactly
  those three), so a change made here would not last. AC-7's grep finds
  nothing in them at `7656e00`.
- `REVIEW.md`. Item 18 already says what the check enforces, and this story does
  not change what a conforming pull request may do.

## Constraints

*(none)*

## Context

- `scripts/story-containment.mjs` (`resolveStory` has been this project's own
  since OQ-148), at `7656e00`:
  - `resolveStory` (lines 32–50): the move wins, and the branch is consulted
    only when nothing is moved. Its fallback matches `^story/(OQ-\d+)-`
    (line 48), with the prefix from `scripts/story-prefix.mjs`.
  - `checkStoryContainment` (lines 157–209) calls `resolveStory({ nameStatus,
    branch, prefix })`. For a `moved` result it never reads the branch, so a
    branch/move disagreement passes today.
- Steward's handoff branch, from `handoffBranch` in
  `scripts/dispatch/handoff-coder.mjs` at `release/v0.3.0`: `handoff/`, the
  handoff's id, `-`, and a word for its source. For a file, the word is its
  path lower-cased, with each run of other characters made `-`, cut to 40
  characters (line 120). So `stories/OQ-141-share-format-stable-ids.md` gave
  `handoff/H-2-stories-oq-141-share-format-stable-ids-m` (#290), and the
  `stories-oq-<n>-` start always survives the cut.
- Branches of recent pull requests that implement a story: `story/…` for
  those written by hand (#279, #280, #282, #287), and `handoff/…` for those
  steward's coordinator coded (#288, #290). The owner chose on 2026-11-24 to
  keep both forms, for ad-hoc work.
- `.github/workflows/ci.yml`, the containment step (lines 40–46):
  `${{ github.head_ref }}` is the third argument of a folded `run:` command
  (line 46).
- `.github/workflows/update-screenshots.yml`: runs on `pull_request` with
  `permissions: contents: write` (lines 37–38), and its last `run:` step ends
  with
  `git push origin HEAD:${{ github.event.pull_request.head.ref || github.ref_name }}`
  (line 199).
- `docs/agent-workflow-design.md`, line 319: the `**Planned (OQ-105)**`
  marker, naming both branch forms.
- PR #178: the review that raised both points as observations.
- AC-3's baseline was `67d47ef` when this story was written, `f5cb7b1` from
  2026-10-12, and `7656e00` from 2026-11-24, when it was refined again after
  steward's install: OQ-148 moved the script out of `scripts/dispatch/` and
  brought `resolveStory` into it, and OQ-132 removed `review.mjs`.
- GitHub's guidance on script injection in workflows recommends an
  intermediate environment variable for untrusted context values.

## Open questions

*(none)*

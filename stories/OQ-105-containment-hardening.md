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
and I want no workflow to paste the head branch name into a shell command, so
that a coder cannot pass containment by completing the wrong story, and a
branch name cannot run as a command.

## Acceptance criteria

- [ ] **AC-1** — `checkStoryContainment` in
      `scripts/dispatch/story-containment.mjs` returns `ok: false` when
      `resolveStory` resolves the diff as `moved` with id OQ-m, and the head
      branch matches `story/OQ-<n>-…` with n ≠ m. One violation names the moved
      story's file under `stories/done/`, and its message names both ids.
- [ ] **AC-2** — Nothing else about the check's result changes. In particular:
      a matching branch and move (`story/OQ-82-…` moving OQ-82), a move with a
      branch that does not match `story/OQ-<n>-…` (for example
      `write-story/…` or `chore/…`), and a move with no branch given are all
      decided exactly as at `67d47ef`.
- [ ] **AC-3** — `resolveStory` in `scripts/dispatch/review.mjs` is unchanged,
      so `review.mjs`'s choice of story is unchanged.
- [ ] **AC-4** — `scripts/dispatch/story-containment.test.mjs` adds fixtures,
      named `OQ-105/AC-…`, for:
      - a `story/OQ-82-…` branch whose diff moves and ticks a different story,
        which fails as AC-1 says;
      - a `story/OQ-82-…` branch moving OQ-82, which still passes;
      - a move on a `write-story/…` branch, which is decided as at `67d47ef`.

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
- Changing how `review.mjs` or the reviewer picks the story to review against.
  That is `resolveStory`'s job, and AC-3 keeps it unchanged.
- Hardening other `${{ … }}` uses in workflows that are not under AC-7's names,
  such as `github.event.comment.body` in `review-gate.yml`, which already goes
  through `env:`.
- `REVIEW.md`. Item 18 already says what the check enforces, and this story does
  not change what a conforming pull request may do.

## Constraints

*(none)*

## Context

- `scripts/dispatch/story-containment.mjs`: `checkStoryContainment` calls
  `resolveStory({ nameStatus, branch })`. For a `moved` result it never reads
  the branch, so a branch/move disagreement passes today.
- `scripts/dispatch/review.mjs`, `resolveStory`: the move wins, and the branch
  is consulted only when nothing is moved (`branch-only`).
- `.github/workflows/ci.yml`, the containment step: `${{ github.head_ref }}` is
  the third argument of a folded `run:` command.
- `.github/workflows/update-screenshots.yml`: runs on `pull_request` with
  `permissions: contents: write`, and its last `run:` step ends with
  `git push origin HEAD:${{ github.event.pull_request.head.ref || github.ref_name }}`.
- PR #178: the review that raised both points as observations.
- GitHub's guidance on script injection in workflows recommends an
  intermediate environment variable for untrusted context values.

## Open questions

*(none)*

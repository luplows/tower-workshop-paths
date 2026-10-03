---
id: OQ-111
title: Skip a story whose branch exists only locally, after pushing it so every machine sees it taken
tier: next
kind: workflow
depends_on: [OQ-110]
model: sonnet
blocked: null
---

## Intent

As the owner, running the loop on more than one machine, I want a story
whose branch was left only on one machine's disk to be skipped, not to stop
the loop, and to be pushed to `origin` first, so the other machine skips it
too and the leftover is visible from anywhere.

## Acceptance criteria

- [ ] **AC-1** — **Skipping and pushing a local-only branch.** `pickStory` in
      `scripts/dispatch/loop.mjs` also skips a ready story whose branch,
      named by `branchFor` as today, exists locally (`refs/heads/<branch>`)
      and not on `origin`. Before skipping, it pushes that branch to
      `origin` as it is, with the must-not-exist push OQ-110 builds for the
      claim, calling the function `coder.mjs` exports for it.
      `loop.mjs` builds no push of its own. If that push fails, the story is
      still skipped, and git's error is part of the skip's report entry.
- [ ] **AC-2** — **The report says where the branch was found.** Every skip
      entry `pickStory` returns says whether the branch was on `origin` or
      only local, and for a local one, whether the push succeeded. A branch
      that exists both locally and on `origin` counts as on `origin`, and
      nothing is pushed for it, whatever its local tip.
- [ ] **AC-3** — **The queue keeps moving.** A story skipped under AC-1 does
      not stop the loop: `runLoop` goes on to the next ready story.

      Tests use the real `pickStory` against fixture repositories with a
      bare `origin`, and cover:
      - a local-only branch, which is pushed and skipped, followed by a
        story that is dispatched;
      - a local-only branch whose push fails, which is still skipped, with
        the error reported;
      - a branch on `origin`, which is skipped as today, with nothing pushed;
      - a branch both local and on `origin` at different tips, which is
        skipped as on `origin`, with nothing pushed.

      `loop.test.mjs`'s "OQ-86/AC-4: dispatchCoder's branch-exists (no pull
      request, nothing recorded) stops the loop" still passes unchanged: a
      dispatch that returns `branch-exists` still stops the loop. Its
      `describe` title, "a local-only branch stops the loop rather than
      looping on branch-exists", is no longer true and is retitled. The PR
      body says so.
- [ ] **AC-4** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-111 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Raising the skipped story as a GitHub issue.** That is OQ-112, which
  raises a local-only branch whatever its age.
- **Leftover `tw-coder-*` worktrees.** OQ-101's AC-3 reports them.
- Deleting any branch, local or remote.
- Branches named other than `branchFor` would name them for a ready story.

## Constraints

- Node, ESM, no new runtime dependencies.
- Unit tests do not reach GitHub. Git behaviour is tested against fixture
  repositories.

## Context

- Decided by the owner on 2026-10-01, in the dispatcher session, as part of
  the first OQ-110, and split out of it on 2026-10-03. A local branch is
  invisible to the owner's other machine, which would dispatch the story
  again, and the leftover would never be looked at.
- Once OQ-110 is built, a dispatch claims its branch on `origin` straight
  after creating it. A local-only branch is then what a run killed between
  those two steps leaves, or a leftover from before OQ-110.
- `scripts/dispatch/loop.mjs`: `pickStory` skips on `remoteTip`
  (`git ls-remote --heads origin`) only. Its skip entries are
  `{ id, branch }` today.
- Local branches are shared by every worktree of a repository. So the
  loop's own worktree (OQ-109) sees `story/` branches a hand-run makes from
  the main checkout. A hand-run caught between creating its branch and
  pushing its claim would have that branch pushed by this story, and its
  claim then fails as `branch-exists` (OQ-110's AC-2). This is a known
  limit, expected to be rare, as in OQ-101's Context.
- PR #185's review noted that OQ-86/AC-4's local-branch test in
  `loop.test.mjs` stubs `pickStory`. This story's tests use the real one.

## Open questions

*(none)*

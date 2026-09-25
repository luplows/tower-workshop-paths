---
id: OQ-82
title: Fail CI when a story's pull request changes stories/ beyond its own move and ticks
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want a coder unable to add, loosen or re-prioritise a story in
its own pull request. The coder's pull requests are opened under my account, so
OQ-81's author check passes them, but a model wrote their contents. A new or
edited `ready` story in such a diff is work the loop would go on to carry out
that nobody asked for.

## Acceptance criteria

- [ ] **AC-1** — A check, run in CI's existing `test` job, reads the pull
      request's diff against its base and decides whether it **implements a
      story**. It does if the diff moves `stories/OQ-<n>-<slug>.md` to
      `stories/done/`, or if the head branch is named `story/OQ-<n>-<slug>`.
      Either one is enough, so a coder that skips the move is still caught.
- [ ] **AC-2** — For a pull request that implements story OQ-n, the only
      changes allowed under `stories/` are:
      - that story's move to `stories/done/`;
      - in that file, acceptance-criterion lines changing from `- [ ]` to
        `- [x]` and nothing else on those lines;
      - that story's `blocked:` frontmatter line, which is the coder's escape
        route (`coder.md`; OQ-70's AC-8).

      Anything else under `stories/` fails the check, and the failure names
      each offending file and line: another story added, edited, moved or
      deleted, or any other change to its own story, including an unticked box
      or a reworded AC.
- [ ] **AC-3** — A pull request that implements no story is not restricted by
      this check. That is how Session A adds and edits stories. Who may land
      such a PR is OQ-81's rule, not this one's.
- [ ] **AC-4** — The logic is a tested module; the CI step only calls it.
      Fixtures cover:
      - a conforming move with ticks;
      - a conforming `blocked:` edit;
      - a second story added;
      - another story's ACs edited;
      - its own AC reworded;
      - a tick removed;
      - a story branch with no move that adds a story;
      - a story-writing PR, which is not restricted.
- [ ] **AC-5** — `REVIEW.md` item 18 (Containment) notes that CI now enforces
      the `stories/` part of containment. Items 16–19 are otherwise unchanged.

## Out of scope

- **Validating story schema.** OQ-61.
- **Who opened the pull request.** OQ-81.
- **Checking the rest of the diff against the story's Out of scope.** That
  stays with the reviewer, as item 18's judgement.

## Constraints

- Node, ESM, no new runtime dependencies.
- No new CI job. It runs in the existing `test` job.

## Context

- The rule this enforces has been checked by hand on every story PR since #130:
  the story diff is only the move plus tick lines. The runner notes on #140 and
  #142 record it being checked.
- `.github/workflows/ci.yml` checks out with `actions/checkout@v4` at its
  default depth, so the base the diff needs has to be fetched.
- `scripts/dispatch/review.mjs`, `resolveStory`: the existing reading of "the
  diff moves a story into `stories/done/`", with `--no-renames`, worth reusing
  rather than re-deriving.
- Decided by the owner on 2026-09-25, together with OQ-81 and the story-PR
  section of `REVIEW.md`.

## Open questions

*(none)*

---
id: OQ-83
title: Have the loop review and land writer-authored pull requests it did not open
tier: next
kind: workflow
depends_on: [OQ-48, OQ-81]
model: sonnet
blocked: null
---

## Intent

As the owner, I want a story I refined with Session A to reach the queue
without another step from me. Session A opens the story's pull request from my
account, and the loop reviews and lands it, like any other ready work. Pull
requests from anyone without write access are left alone.

## Acceptance criteria

- [ ] **AC-1** — Before dispatching each story, the loop looks for open,
      non-draft pull requests against `main` whose `author_association` is one
      the gate honours. For each one with no honoured verdict at its current
      head, it runs `review.mjs`. Draft pull requests are skipped, so marking
      one ready is how Session A hands it over. The loop's own story PRs are
      already handled by OQ-48's cycle, and are not reviewed a second time here.
- [ ] **AC-2** — On `pass` or `pass-with-observations`, the loop lands the pull
      request through OQ-50's `land.mjs`, then goes on. That way a story that
      has just landed is in the queue for the loop's next pick.
- [ ] **AC-3** — On `block`, the loop records the verdict and leaves the pull
      request. It **never spawns a coder** for a pull request it did not open,
      and never pushes to its branch. The pull request is reviewed again when
      its head moves: someone pushed a fix. `review-blocked` still applies at
      the round bound (OQ-80).
- [ ] **AC-4** — A pull request from an author outside the gate's set is not
      reviewed at all. No reviewer spend goes on it, and its body is never put
      into a reviewer prompt. A test asserts `review.mjs` is not called for a
      `CONTRIBUTOR` or `NONE` pull request.
- [ ] **AC-5** — The set of associations is the gate's, read from the same place
      OQ-81 and OQ-78's AC-3 read it, and the test that ties them together
      covers this module too.
- [ ] **AC-6** — Tests cover:
      - a writer's story PR, reviewed and landed before the next story is
        dispatched;
      - a draft, skipped;
      - a block, left with no coder spawned;
      - an outsider's PR, ignored;
      - a PR already carrying a verdict at its head, not reviewed again.

## Out of scope

- **Writing or refining stories.** That is Session A, with the owner.
- **Retrying a blocked pull request the loop did not open.** A person fixes it.
- **Pull requests against branches other than `main`.**

## Constraints

- Node, ESM, no new runtime dependencies.
- It composes `review.mjs` and `land.mjs`, and reimplements neither.

## Context

- Decided by the owner on 2026-09-25: stories come from Session A (sometimes
  Session B), not from issues, and an untrusted contributor must not be able to
  get work into the queue. OQ-81 keeps any outsider's pull request from
  landing. OQ-82 keeps a coder from changing stories in its own PR. This story
  moves Session A's output into the queue with no further step.
- `REVIEW.md`, "PRs that add or change a story": what the reviewer checks on a
  story-writing PR.
- `scripts/dispatch/review.mjs` already reviews a pull request that implements
  no story (OQ-69's AC-6b).

## Open questions

*(none)*

---
id: OQ-132
title: Remove the old engine, so that steward's init can install in its place
tier: next
kind: workflow
depends_on: [OQ-148]
model: sonnet
blocked: "Owner-only: written by Session A for steward's ST-48 validation, reviewed and landed on the old engine, as the last pull request to use it. Never dispatched (decided 2026-11-04 by the owner)."
---

## Intent

As the owner, I want this repository's copies of steward's engine gone, so that
there is one copy of it and steward's `init`, which never overwrites a file, can
install its own gate here (OQ-115). I accept that this ends the coder loop for
now: steward's coding side is not built yet.

## Acceptance criteria

- [ ] **AC-1** — These are removed: `.github/workflows/review-gate.yml` and
      `land-approved.yml`; `steward.config.json`; `scripts/land/`;
      `scripts/report/`; all that is left of `scripts/dispatch/`;
      `scripts/no-project-literals.test.mjs`; and `.claude/prompts/coder.md` and
      `reviewer.md`.
- [ ] **AC-2** — `npm run lint`, `npm test`, the alone test, `npm run build`,
      `npm run test:e2e` and `node scripts/lint-stories.mjs` pass with those gone,
      and no remaining test reads a removed file.
- [ ] **AC-3** — `CLAUDE.md`'s "Branches and pull requests" no longer names the
      sweep, `land.mjs`, the dispatcher or `scripts/dispatch/`. It says:
      - a pull request lands only through `steward land <pr-number>`, run on the
        owner's word, once its head has passed review;
      - no session merges by any other way, triggers `land-approved.yml` itself, or
        deletes a head branch;
      - no coder runs in this repository until the owner decides otherwise;
      - the one exception is steward's installation pull request (OQ-115), which
        its story says how to merge.
- [ ] **AC-4** — `REVIEW.md` stays, and is what a reviewer here reads. Its "For the
      coder: opening a PR" section is removed. Its "For the reviewer: reporting a
      verdict" section no longer cites `.claude/prompts/reviewer.md`, or a runner
      recording a verdict. Its numbered items keep their numbers.
- [ ] **AC-5** — A `git grep` in the pull request body shows that nothing outside
      `docs/`, `stories/` and `Completed-Questions.md` refers to `scripts/dispatch/`,
      `scripts/land/`, `scripts/report/`, `.claude/prompts/` or
      `no-project-literals`. `review-gate.yml`, `land-approved.yml` and
      `steward.config.json` are left out, since OQ-115 installs files of those names.
- [ ] **AC-6** — `OQ-132` is taken out of every **Planned (…)** marker in
      `docs/agent-workflow-design.md` that names it, as that document's "Reading this
      document" note says. The passages it names stay until OQ-134.

## Out of scope

- **Installing steward** (OQ-115). `main` has no gate between this pull request and
  that one, and nothing else merges in between.
- **Changing required status checks.** The owner lowers and restores them around
  OQ-115.
- **Cutting `CLAUDE.md` and `REVIEW.md` down to this project's own rules** (OQ-133),
  and **the moved documents** (OQ-134).
- **`.github/pull_request_template.md`, `.oxlintrc.json` and `.gitignore`.**
- **The four built stories that are steward's test fixtures** (OQ-51, OQ-68, OQ-69,
  OQ-70). Their originals stay in `stories/done/`, as history.

## Constraints

- No new dependency. Steward is not added to `package.json`.

## Context

- The plan is in `docs/agent-workflow-design.md`, "Portability", "Decided so far",
  "This repository adopts steward through `init`". It replaces this story's earlier
  order, which ran it after OQ-115 and OQ-133, on steward's engine.
- Removing the two workflow files and `steward.config.json` alone fails 76 tests in
  12 files (a local experiment at caf4cb7, 2026-11-04), so they cannot leave before
  the engine's tests do.
- The `pull_request` event runs a pull request's own copy of a workflow, so this
  pull request should get no `pending` status from `review-gate.yml`, which it
  deletes. A verdict comment still runs the gate on `main`, and that sets
  `review/agent`.
- After this lands, these go until steward's coding side exists: `loop`, `story.mjs`,
  `coder.mjs`, `queue.mjs` and the verdict report (the owner accepted this on
  2026-11-04: "I'm happy with ending it for now").

## Open questions

*(none)*

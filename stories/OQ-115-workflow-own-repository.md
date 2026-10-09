---
id: OQ-115
title: Cut this repository over to steward, by hand, so the loop and the gate run on the pinned engine
tier: normal
kind: workflow
depends_on: [OQ-80, OQ-117, OQ-118, OQ-122, OQ-123, OQ-130, OQ-131]
model: sonnet
blocked: "Owner-only: the cut-over is done by the owner with Session A, by hand, as one pull request through the gate. Never dispatched by the loop (decided 2026-10-08 by the owner)."
---

## Intent

As the owner, I want this repository to run its loop and its gate on steward,
pinned as a dependency, so that the workflow's code lives in one place and this
repository stays about the product (goals 1 and 4 in
`docs/agent-workflow-design.md`, "Portability"). The cut-over is the one step
where the thing being changed is the engine running the change, so the owner and
Session A do it by hand, in one pull request that the gate still reviews and
lands. The clean-up after it is ordinary stories run on steward's engine:
OQ-133 (`CLAUDE.md`, `REVIEW.md` and the stories README), then OQ-132 (the
moved code), then OQ-134 (the moved documents).

## Acceptance criteria

- [ ] **AC-1** — `package.json` has `steward` as a development dependency,
      installed from `luplows/steward` by git tag (R2), and `package-lock.json`
      matches it.
- [ ] **AC-2** — `review-gate.yml` and `land-approved.yml` are the thin files
      steward's `init` writes: this repository's triggers and permissions, then
      steward's command. `ci.yml`'s story containment step runs steward's
      command. `ci.yml`'s product checks, its `Setup: ` step names (OQ-118) and
      its after-sweep trigger (OQ-124) are unchanged.
- [ ] **AC-3** — This project's lines reach the coder's and the reviewer's
      prompts through steward's project section (R1): its repository name,
      Vitest and Playwright, the screenshot-baseline rules, `mytower.app`, and
      the pointer to `Completed-Questions.md`.
- [ ] **AC-4** — Run from this repository, steward's `lint` and `queue` commands
      report what `node scripts/lint-stories.mjs` and
      `node scripts/dispatch/queue.mjs` report at the same commit.
- [ ] **AC-5** — `OQ-115` is taken out of the **Planned (…)** marker in
      `docs/agent-workflow-design.md`, "Portability", "Decided so far", as that
      document's "Reading this document" note says.

## Out of scope

- **Removing anything that moved.** The code is OQ-132, the rule files OQ-133,
  the documents OQ-134. The cut-over leaves them in place, unused, so that it
  can be undone by reverting one pull request.
- **Retiring the moved stories.** Session A does that in a `write-story/` pull
  request, each with a note naming its `ST-<n>`, once the bootstrap's B1 has
  fixed the mapping (`stories/README.md`, "Lifecycle").
- **A second project.** That is steward's (R6, R7), not this repository's
  (decided 2026-10-08 by the owner, dropping this story's earlier AC-1).
- **Supporting other companies' models** (OQ-114, now steward's).

## Constraints

- One pull request, reviewed by the gate and landed by the sweep, not a direct
  push.

## Context

- Rewritten 2026-10-08 with the owner ("The move, in order", step 4). The
  order is forced: the gate's files must call steward before `scripts/land/`
  is removed, and the loop must be started with steward's command before
  `scripts/dispatch/` is removed. After this pull request lands, the owner
  starts the loop with steward's command. That step is outside the
  repository, so it is recorded in the pull request, not an AC.
- Until OQ-133 lands, this repository's `CLAUDE.md` and `REVIEW.md` keep the
  workflow rules in full. The coder and the reviewer read both from the
  repository root (`.claude/prompts/coder.md` line 140, `reviewer.md` line
  171), so the cut-over does not wait on how steward will deliver a project's
  rules.
- What this repository runs by path today, outside the moved paths, on `main`
  at `c97aa50`: `ci.yml` line 33 (`story-containment.mjs`);
  `land-approved.yml` lines 89, 110 and 186 (`scripts/land/`);
  `review-gate.yml` line 187 (`apply-review-blocked.mjs`).
- What this needs from steward is listed in the design doc, "Portability",
  "What adopting steward needs from it".

## Open questions

- The command names AC-2 and AC-4 call, and the files `init` writes: known once
  steward builds `init` (R2).
- The form of the prompts' project section (AC-3): known once steward builds it.
- How the loop's worktree installs the pinned engine after each update (OQ-123's
  Out of scope): a steward story, built before this one.

---
id: OQ-81
title: Land only pull requests opened by an account with write access
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want nothing to reach `main` automatically unless someone I
trust opened it. The dispatch loop will implement any `ready` story on `main`
under my token, so whoever can land a story can direct the loop, and whoever
can land code can change what the loop runs. On a public repository anyone can
open a pull request. Only a pass marker stands between them and the sweep.

## Acceptance criteria

- [ ] **AC-1** — The landing sweep lands a pull request only when its
      `author_association` is one the review gate honours for markers. The set
      lives in `.github/workflows/review-gate.yml`, step "Apply verdict from
      marker". Any other pull request is skipped with a notice naming it and its
      association, and the sweep goes on to the next candidate, as it does for a
      `review-blocked` one. This applies to **every** pull request, not only
      those touching `stories/`.
- [ ] **AC-2** — The check is testable outside Actions. It lives in a module
      under `scripts/land/` that the workflow calls, as
      `delete-merged-heads.mjs` (OQ-52) does. Tests cover: an `OWNER` pull
      request that is eligible, a `CONTRIBUTOR` one and a `NONE` one that are
      skipped, and a skipped PR followed by an eligible one, which still lands.
- [ ] **AC-3** — `land-approved.yml` and `review-gate.yml` use the same set of
      associations, and a test reads both workflows and fails if they differ.
      OQ-78's AC-3 ties `review.mjs` to the same set; the three must agree.
- [ ] **AC-4** — Every other eligibility and safety rule of the sweep is
      unchanged: one PR per run, oldest first, `--match-head-commit`,
      `review/agent` re-checked directly, and the circuit breaker with its
      exemptions. A pull request from outside that carries `breaker-override`
      is still skipped: this check comes before the breaker's exemptions.
- [ ] **AC-5** — `docs/agent-workflow-design.md`, "Merging", lists the rule
      alongside the sweep's other properties, with its reason: a landed `ready`
      story is work the loop will carry out.

## Out of scope

- **Taking an outside contribution in.** The owner re-opens it under their own
  account, deliberately. Nothing automates that.
- **Branch protection settings.** This is enforced in the sweep, which is the
  only automated merger (OQ-50 triggers the sweep and does not merge).
- **Limiting what a writer-authored pull request may change in `stories/`.**
  The coder's PRs are opened under the owner's account, so this check passes
  them. OQ-82 covers what their diff may contain.

## Constraints

- Node, ESM, no new runtime dependencies.

## Context

- `.github/workflows/land-approved.yml`: the candidate loop, which already
  fetches each PR's JSON (`gh api "repos/${REPO}/pulls/${pr}"`), where
  `author_association` is available. It currently checks labels, the breaker
  and `mergeable_state`, and never the author.
- The repository is public, and forking is allowed
  (`gh api repos/luplows/tower-workshop-paths`: `visibility: public`,
  `allow_forking: true`). Every one of the first 143 pull requests was opened
  by `luplows`, and no bot opens pull requests here, so this locks out nothing
  in use today.
- `scripts/land/delete-merged-heads.mjs` and its test: the precedent for sweep
  logic kept in a tested module.
- Decided by the owner on 2026-09-25, together with OQ-82, OQ-83 and the
  story-PR section of `REVIEW.md`: only a writer can put work into the queue,
  and no model can widen its own story.

## Open questions

*(none)*

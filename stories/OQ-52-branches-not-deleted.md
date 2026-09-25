---
id: OQ-52
title: Delete the head branch when the sweep lands a PR, and say so accurately
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As someone reading this repository's own documentation, I need what it says
about a merged branch to be what actually happens, so that an agent acting on
those instructions is not acting on a false premise.

## Acceptance criteria

- [ ] **AC-1** — Landing a PR deletes its head branch as an explicit act of the
      sweep, rather than relying on the repository's
      `delete_branch_on_merge` setting, which is enabled and observably does not
      fire.
- [ ] **AC-2** — A branch that is already gone, or that cannot be deleted, does
      not fail the landing run or prevent the merge being recorded as
      successful. Deletion is cleanup, not a gate.
- [ ] **AC-3** — Every shipped document describing what happens to a branch
      after merge matches the implemented behaviour. At minimum
      `.claude/prompts/coder.md`, which asserts deletion happens
      automatically, and `CLAUDE.md`, whose rule "Do not delete the head
      branch." says nothing about who does.
- [ ] **AC-4** — `git ls-remote --heads origin` lists no branch belonging to a
      merged PR. Which branches those are changes over time, so the invariant
      is the criterion rather than any list of them.

## Out of scope

- Diagnosing *why* `delete_branch_on_merge` does not fire. Worth knowing, but it
  is a GitHub-side question and the outcome can be fixed without the answer. If
  it turns out to matter, it is a separate story.
- Branch retention policy, or deleting branches for PRs that were closed without
  merging.
- Anything else in `land-approved.yml`. Its eligibility rules and safety
  properties are correct and must not move.

## Constraints

- The existing safety properties of the sweep stay exactly as they are: one PR
  per run, oldest first, `--match-head-commit`, `review/agent` re-checked
  directly rather than trusted via `clean`, and the circuit breaker with its
  exemptions.

## Context

Measured on 2026-09-18:

- `delete_branch_on_merge` is **`true`** on the repository.
- Four PRs merged through the sweep that day — #98 at `16:22Z`, #99 at
  `17:32Z`, #100 at `17:48Z`, #101 at `18:21Z` — and at `18:32Z` **all four
  head branches were still present** on `origin`. #98's had survived over two
  hours, so this is not propagation delay.
- The repository has **no rulesets**, and branch protection applies to `main`
  only, so nothing is blocking deletion of a `story/*` ref.
- The sweep's merge call is
  `gh pr merge "${pr}" --repo "${REPO}" --squash --match-head-commit "${sha}"` —
  no `--delete-branch`. It relies entirely on the repository setting.

Two shipped documents asserted the opposite of the observed behaviour when
this story was written:

- `CLAUDE.md`: *"The branch is deleted automatically, so you do not need to."*
  **Corrected 2026-09-24:** #121 rewrote `CLAUDE.md` and removed that
  sentence. It now says only "Do not delete the head branch."
- `.claude/prompts/coder.md`: *"You still do not need to delete your branch —
  the landing sweep does that when the PR merges."* Still present.

The second is the more serious, because it is a spawn prompt. This project has
a documented history of prompts asserting things that were not true — the OQ-43
worker was launched believing a claim nobody had checked — and that history is
written down in this very prompt's own preamble.

**Raised to `next` on 2026-09-24**, because leftover branches now break the
loop and not only the documentation:

- **They collide with spawns.** The OQ-65 coder (#131) could not push:
  `story/OQ-65-spawn-sessions` still held the head of #114, the PR that had
  added the OQ-65 story, merged 2026-09-19. The push was rejected as
  non-fast-forward. The owner approved deleting the stale branch by hand.
  At that point `git ls-remote` listed nine more `story/` branches, every one
  the head of a merged PR: OQ-49 (#108), OQ-51 (#117), OQ-62 (#110), OQ-63
  (#112), OQ-64 (#111), OQ-66 (#115), OQ-67 (#122), OQ-74 (#129) and OQ-75
  (#127). OQ-62, OQ-64 and OQ-66 are not done, so spawning any of them
  collides the same way.
- **They falsify a derived status.** `stories/README.md` derives
  `in-progress` from "a `story/OQ-49-*` branch exists". With merged branches
  never deleted, that holds permanently for every story that has had a PR.
  Whatever in the dispatcher first implements that derivation would read
  them all as in progress.

AC-4 covers the branches already left behind as well as future ones.

- `.github/workflows/land-approved.yml` — the merge call
- `Completed-Questions.md`, OQ-42 — why prompts live in files and are read end
  to end

## Open questions

*(none)*

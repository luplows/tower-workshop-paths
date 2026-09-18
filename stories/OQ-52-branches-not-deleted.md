---
id: OQ-52
title: Delete the head branch when the sweep lands a PR, and say so accurately
tier: workflow
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
      after merge matches the implemented behaviour. At minimum `CLAUDE.md` and
      `.claude/prompts/coder.md`, both of which currently assert deletion
      happens automatically.
- [ ] **AC-4** — The branches left behind by #98, #99, #100 and #101 are gone,
      so that `git ls-remote --heads origin` lists no branch from a merged PR.

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

Two shipped documents currently assert the opposite of the observed behaviour:

- `CLAUDE.md`: *"The branch is deleted automatically, so you do not need to."*
- `.claude/prompts/coder.md`: *"You still do not need to delete your branch —
  the landing sweep does that when the PR merges."*

The second is the more serious, because it is a spawn prompt. This project has
a documented history of prompts asserting things that were not true — the OQ-43
worker was launched believing a claim nobody had checked — and that history is
written down in this very prompt's own preamble.

- `.github/workflows/land-approved.yml` — the merge call
- `Completed-Questions.md`, OQ-42 — why prompts live in files and are read end
  to end

## Open questions

*(none)*

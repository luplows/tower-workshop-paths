---
id: OQ-67
title: Close the gaps between what the coder is told to do and what it is allowed to do
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a spawned coder, I need my allowlist to permit every action my own prompt
requires of me, so that I do not do a story's whole work and then fail at the
step that makes it visible to anyone.

## Acceptance criteria

- [ ] **AC-1** — `coderAllowedTools(branch)` permits `git mv`.
      `.claude/prompts/coder.md` requires the story file to be moved with it,
      `REVIEW.md` item 19 marks the coder against that move, and the returned
      list grants no `mv` of any kind, so the move is refused at the tool layer.
- [ ] **AC-2** — `coderAllowedTools(branch)` permits pushing the assigned
      branch by its plain name — `git push origin <branch>` — in addition to
      the two refspec forms it already grants. Push remains scoped to the one
      branch: no pattern the function returns may permit a push to `main` or to
      any other ref, and a test asserts that against `main` specifically.
- [ ] **AC-3** — A test asserts, mechanically rather than by eye, that every
      git verb `coder.md`'s allowlist block names is permitted by
      `coderAllowedTools`. `coder.md` calls that function "the authority" and
      its own block "a reader's summary of it" that "must not drift from it";
      nothing currently checks that claim, which is how both gaps above
      survived.
- [ ] **AC-4** — The read-only shell utilities a coder spawn receives are
      defined in `scripts/dispatch/coder-env.mjs` as an exported value, not left
      to each caller. `docs/agent-workflow-design.md`'s "Invocation shape"
      references `$READ_ONLY_SHELL_UTILS` as though it were defined and nothing
      in the repository defines it, so every hand-run has invented its own set.
- [ ] **AC-5** — No entry in that utilities set can write. `sed` is the trap:
      `sed -n` reads and `sed -i` writes, so `Bash(sed:*)` does not belong in a
      list described as read-only. A test asserts the property rather than the
      membership, so adding an entry later cannot quietly break it.
- [ ] **AC-6** — `docs/agent-workflow-design.md`'s "Invocation shape" and
      `.claude/prompts/coder.md`'s allowlist block both match what the module
      returns after this change. A coder cannot edit `.claude/prompts/` (see
      **Context**), so the prompt half is emitted as a diff in the PR body for
      the runner to apply.

## Out of scope

- **Changing the credential model.** `coderEnv` stripping `GH_TOKEN`,
  `GITHUB_TOKEN` and `GH_ENTERPRISE_TOKEN` is OQ-63's delivered guarantee and
  is not in question here. This story widens the *command* allowlist only, and
  never in a direction that reaches GitHub's API.
- **The reviewer's allowlist.** Its gaps are real — every review round of #117
  reported denied commands — but the reviewer's list lives in the design doc
  rather than in a module, and giving it one is OQ-62's territory.
- **Making the coder able to edit `.claude/prompts/`.** That restriction is a
  platform behaviour, not a setting here.

## Constraints

- Push must stay scoped to the assigned branch. The whole reason
  `coderAllowedTools` takes a `branch` argument is that a repo-wide credential
  does not enforce per-branch scope, and AC-2 must not be satisfied by
  loosening to `Bash(git push:*)`.

## Context

Found by running OQ-51 through the loop by hand across four coder rounds
([#117](https://github.com/luplows/tower-workshop-paths/pull/117)), where both
gaps cost real rounds:

- The `git mv` gap was caught before the first spawn and patched into the
  invocation by hand, so it never reached a coder. Unpatched it would have
  failed item 19 after the work was done.
- The push gap was not caught first. Rounds 2 and 3 each finished their work,
  committed, and were refused `git push origin <branch>` — the natural
  spelling, and the one both sessions reached for. Each commit existed only in
  the worktree and would have died with the session; the runner pushed both by
  hand. Round 1 survived only because it happened to pick one of the two
  allowlisted spellings.

That is the failure `coder.md` predicts in its own allowlist block — *"An
allowlist with a hole in it fails at the last step rather than the first"* —
arriving at the last step twice. It is latent today because nothing imports
`coder-env.mjs`; **OQ-65 is what makes it live**, since its AC-2 wires the
module into `spawn.mjs`. Landing this first is cheaper than landing it after a
dispatcher starts losing commits unattended, which is the same failure with
nobody watching.

- `scripts/dispatch/coder-env.mjs` — `coderAllowedTools`, `coderEnv` and
  `CODER_DISALLOWED_TOOLS`
- `.claude/prompts/coder.md`, the allowlist block — the prose that must not
  drift from the module, and which AC-3 makes checkable
- `docs/agent-workflow-design.md`, "Invocation shape" — where
  `$READ_ONLY_SHELL_UTILS` is referenced and never defined
- OQ-63, in `stories/done/` — why `gh` is absent from the list entirely, which
  this story does not revisit
- `docs/agent-workflow-design.md`, "A spawned session cannot edit
  `.claude/prompts/`" — why AC-6's prompt half is emitted rather than applied

## Open questions

*(none)*

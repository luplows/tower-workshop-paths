---
id: OQ-63
title: Stop handing the coder a GitHub credential; let the dispatcher open the PR
tier: fix
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner of the review gate, I need a coder session to be incapable of
clearing its own gate or triggering the landing sweep, so that the two rules the
whole workflow rests on are enforced by what it cannot reach rather than by what
it has been told.

## Acceptance criteria

- [ ] **AC-1** — A coder session cannot set a commit status. Demonstrated
      against a session spawned exactly as a coder is spawned: an attempt to set
      `review/agent` on its own head fails for want of **authorisation**. This
      is the one that matters most — the gate goes pending on every push, so a
      coder that cannot set a status cannot make its own PR mergeable.
- [ ] **AC-2** — A coder session cannot dispatch a workflow, `land-approved.yml`
      above all.
- [ ] **AC-3** — A coder session cannot merge a pull request, comment on one, or
      review one, so the `<!-- agent-review -->` marker is beyond it.
- [ ] **AC-4** — AC-1 to AC-3 hold against the bypass paths, not just the
      obvious commands: `gh api` directly, `node -e` reaching `child_process`,
      and `npm`/`npx` running an arbitrary script. Denying `Bash(gh:*)` patterns
      alone does not satisfy this story.
- [ ] **AC-5** — The coder can still do its job: edit files in its worktree, run
      `npm test`/`lint`/`build`, commit, and **push its own branch**. Pushing to
      `main` or to a branch that is not its own fails.
- [ ] **AC-6** — A pull request still gets opened, with the coder's body text
      intact, without the coder holding a credential — the coder emits the body
      and whatever spawned it creates the PR, mirroring the existing split where
      the reviewer returns a verdict and the runner records it.
- [ ] **AC-7** — The path for a coder to answer a review finding it disagrees
      with still exists. `coder.md` currently tells it to reply on the PR, which
      AC-3 removes; the replacement is stated in `coder.md` rather than left to
      be discovered.
- [ ] **AC-8** — `coder.md`, `docs/agent-workflow-design.md` and `REVIEW.md`
      describe what is then true. The wording added in #109 — that a coder
      session is "trusted, not contained" — is updated rather than left
      describing a gap that has closed.

## Out of scope

- The **reviewer's** capability set. That is OQ-62, and the two are deliberately
  separate: the reviewer needs no GitHub access at all, whereas the coder
  legitimately needs to push.
- A second GitHub identity, which is the full answer to self-marking and sits in
  the design's Phase 5.
- Branch protection changes. `main` is already protected and that is not the
  hole; the hole is that the gate's own status is writable by the thing it
  gates.
- General OS sandboxing of spawned sessions.

## Constraints

- The coder must keep running the project's toolchain, so the answer cannot be
  "remove `npm`/`node` from the allowlist".
- Whatever opens the PR must not also be able to clear the gate, or the problem
  has moved rather than gone.

## Context

Found while re-examining the whole access set after #109, and **confirmed
against this repository** rather than inferred. Probing with deliberately
invalid payloads — which fails validation *after* authorisation, so nothing is
written — the owner's `repo`-scoped token returned HTTP 422 for both creating a
commit status and dispatching `land-approved.yml`. A 403 would have meant
denied; 422 means permitted. No status was created and no workflow ran.

So a coder holding `Bash(gh:*)` can set `review/agent` to `success` on its own
head and then dispatch the sweep that merges it. `CLAUDE.md` states both rules —
*you do not merge your own PR*, and *triggering the sweep is the owner's to do,
not an agent session's* — and neither is enforced by anything but prose.

This is more urgent than OQ-62 and is filed at `tier: fix` for that reason. The
reviewer has the means but no motive: its prompt tells it to post nothing, and
it gains nothing from a merge. The coder has both — its goal is a landed PR, and
`coder.md` was until #109 telling it the blast radius was its own branch.

- `.claude/prompts/coder.md` — the allowlist paragraph, corrected in #109 to
  state the gap rather than close it
- `docs/agent-workflow-design.md`, "Invocation shape" and "Credential
  minimalism" — the reviewer-side split this story copies
- `.github/workflows/review-gate.yml` — `pull_request: [synchronize]` is why the
  gate is pending on every push, which is what makes AC-1 sufficient
- `.github/workflows/land-approved.yml` — `workflow_dispatch` only
- OQ-62 — the same question for the reviewer

## Open questions

*(none)*

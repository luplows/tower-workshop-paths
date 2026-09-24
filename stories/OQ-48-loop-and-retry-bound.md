---
id: OQ-48
title: Close the loop, and enforce the retry bound with something other than an agent remembering
tier: next
kind: workflow
depends_on: [OQ-69, OQ-70]
model: sonnet
blocked: null
---

## Intent

As someone relying on the circuit breaker, I want the loop to run a story from
dispatch to a recorded verdict and retry it under a bound that is enforced
mechanically, so that the breaker counts a real signal rather than one applied
when somebody happens to follow the rule.

## Acceptance criteria

- [ ] **AC-1** — One entry point runs the loop for one story: dispatch the coder
      (OQ-70), review the resulting pull request (OQ-69), and on a `block`
      verdict retry the coder on the same branch with the findings, up to the
      bound in AC-6. It composes those two modules and reimplements neither.
- [ ] **AC-2** — **The round count is derived, never stored**: it is the number
      of blocking verdict markers already on the pull request, read through
      `github.mjs`. A test asserts the bound still holds when the loop is
      restarted mid-story with no memory of prior rounds — a bound that resets
      when a process dies is not a bound. This is what the migration plan
      settled and it answers the first of this story's original open questions.
- [ ] **AC-3** — A retry happens on the **existing branch and pull request**,
      as a new commit, and never opens a second PR. `CLAUDE.md` requires that in
      as many words. A test asserts no PR-creation request is constructed on a
      retry path.
- [ ] **AC-4** — The retry prompt carries the findings as a **bounded injected
      block**, with the same guarantee `{{STORY}}` and `{{PR_BODY}}` get. A test
      uses a findings fixture that quotes marker syntax and heading syntax as
      its subject matter, because that is what real findings do — see
      **Context**.
- [ ] **AC-5** — The retry tells the coder what it cannot otherwise know: which
      round this is, how many remain, that its branch and pull request already
      exist, that the story file has already been moved if it has, and that the
      PR body it emits **replaces** the existing one rather than appending to it.
      A test asserts each of those appears in the assembled prompt.
- [ ] **AC-6** — The bound is **three** blocking verdicts. When it is reached the
      loop sets `blocked:` on the story file with a reason naming the unresolved
      findings, and stops. It **does not write the `review-blocked` label**, and a
      test asserts no label-write request is constructible from this module —
      AC-6b puts that in the workflow instead. The loop *reads* the label, so a
      pull request already carrying one is not retried.
- [ ] **AC-6b** — `.github/workflows/review-gate.yml` counts the blocking verdict
      markers on a pull request and applies `review-blocked` once there are three.
      This is where the rule lives, because the workflow sees **every** pull
      request — including ones no dispatcher ran, which is OQ-48's original
      complaint: the label is applied only when somebody remembers, so the
      breaker counts a signal nothing reliably produces. Applying it here also
      means the bound survives a dispatcher that dies mid-story. The workflow's
      `permissions:` widens from `pull-requests: read` to `write` for this, which
      is the cost and should be stated in the workflow's own comment.
- [ ] **AC-6c** — The label is applied **once** and is never removed by anything
      automated. Removing it is a deliberate human act meaning "I have seen the
      cost, proceed" — so a fourth round dispatched by hand still works, and the
      pull request stays out of the sweep until someone decides otherwise. A test
      asserts the workflow does not remove the label and does not re-apply it to a
      pull request that already carries it.
- [ ] **AC-7** — The loop never triggers `land-approved.yml`, and a test asserts
      no workflow-dispatch request is constructible from this module. A loop that
      could land its own output is the failure `CLAUDE.md` names explicitly.
- [ ] **AC-8** — A `pass` or `pass-with-observations` verdict ends the loop
      successfully with the gate set to `success` and the PR left for the sweep.
      Observations are recorded and are **not** retried — `REVIEW.md` is clear
      that the middle verdict exists precisely for findings deliberately not
      blocked on.

## Out of scope

- **Triggering the landing sweep.** AC-7 makes this a tested prohibition rather
  than an omission.
- **Choosing the story.** `queue.mjs`.
- **The mechanics of spawning, rendering, or GitHub calls.** OQ-65, OQ-51,
  OQ-68.
- **Changing the reviewer's calibration.** OQ-64.
- **A starvation valve for stories that wait too long.** OQ-59.

## Constraints

- Node, ESM, no new runtime dependencies.
- The `review-blocked` label string and the `review/agent` context must stay
  exactly as they are; `land-approved.yml` and the `SessionStart` hook both read
  them.

## Context

Refined out of `Open-Questions.md` on 2026-09-19. The original entry is preserved
here in substance:

> OQ-42 decided that review retries are bounded at two rounds, after which the
> agent states its position, applies a `review-blocked` label and escalates to a
> human. The automation for that lived in `.github/workflows/review.yml`, gated
> behind `REVIEW_ENABLED` — which was never turned on, because the review step it
> gated could not authenticate. So that code never ran, and deleting the file
> removed it. The bound was honoured exactly once, on
> [#96](https://github.com/luplows/tower-workshop-paths/pull/96), by an
> orchestrator following the rule in prose and applying the label by hand. That
> worked, and it is not a mechanism. Today the `review-blocked` label is only ever
> applied manually, which means the circuit breaker in `land-approved.yml` and the
> `SessionStart` hook's banner are both counting a signal that nothing reliably
> produces.

**Its first open question is now answered** and has become AC-2: the count is
derived by counting blocking verdict markers on the pull request, which the
migration plan settled while ordering Phase 1.

**OQ-51 ran this loop by hand and went four rounds against a two-round bound**
([#117](https://github.com/luplows/tower-workshop-paths/pull/117)), which is the
most useful evidence this story has and the reason its remaining open question is
sharper than it was:

- Round 1 blocked on a substitution bug, a test asserting a property it never
  exercised, and a false claim in the PR body.
- Round 2 blocked on a heading-form escape the round-1 fix let through.
- Round 3 blocked on a line-ending escape the round-2 fix let through.
- Round 4 passed, having replaced the whole approach rather than patching a
  fourth construct.

Nothing was caught twice and no finding was wrong on checking. A strict two-round
bound would have stopped that story after round 2 — with two thirds of its real
defects still in the diff, and the pattern underneath them undiagnosed. The owner
extended it twice, each time on the judgement that a round finding something new
is not churn. An unattended loop cannot make that judgement.

**That is why the bound is three, and why it does not stop anything.** Settled
2026-09-19: **the bound exists to surface cost buildup, not to halt work.** Those
are different instruments and conflating them is what made the original two-round
rule feel wrong in practice. Concretely, at three blocking verdicts:

- The loop stops retrying and records `blocked:` on the story — it stops spending
  unattended, which is the point.
- `review-blocked` goes on, which keeps the pull request out of the sweep and
  **counts toward the five-PR circuit breaker** in `land-approved.yml`. That count
  is the actual systemic alarm: one label is one story running long, five means
  something is wrong with the checklist, the reviewer or the prompts.
- Nothing prevents a human dispatching a fourth round. Removing the label is the
  deliberate act that says the cost has been seen.

**One label does not trip the breaker.** `land-approved.yml` requires five open
pull requests carrying `review-blocked` before it narrows what may land, and even
then it exempts a `breaker-override` label or a diff confined to
`.github/workflows/` so the fix for a jam stays landable. Worth stating because it
was described the other way round during OQ-51's run — as though labelling one
pull request halted the repository — and that error made the bound look far more
expensive to hit than it is.

An alternative was considered and set aside: bounding on **rounds that fail to
find anything new**, which is closer to what "churn" means than a round count is.
It needs a machine-applicable definition of "new" that a coder cannot game by
rewording, and nobody has one. A spend ceiling per pull request is now computable
from the cost figures in `docs/agent-workflow-design.md` and would make a
reasonable *second* limit, but not the primary one: cost does not correlate with
whether progress is being made, and OQ-51's cheapest rounds were its most
productive.

Three further things that hand-run established, all feeding the ACs above:

1. **Findings text forges the constructs it describes.** Composing round 2's and
   round 3's findings meant quoting marker syntax and setext headings verbatim,
   and on three separate renders those quoted lines became live markers and live
   headings inside the block meant to contain them. AC-4's fixture exists for
   this. See OQ-74's Context, point 3.
2. **A retry needs context the prompt cannot supply.** All three retries were
   hand-written prose telling the coder the round number, that its branch and PR
   existed, that item 19 was done, and that the body replaces rather than
   appends. AC-5 is that list.
3. **Framing the findings changes the outcome.** Round 4 was deliberately *not*
   handed the line-ending fix as a task; it was given the three-round pattern and
   required to either prove the enumeration closed or change the approach. It
   chose the rewrite. A loop that only ever relays findings verbatim would have
   got a fourth point-fix.

- `docs/migration-plan.md`, "Order within Phase 1" step 6 and the Phase 1 exit
  criteria — this story's scope, and the restart test AC-2 implements
- `REVIEW.md`, "The three verdicts" — AC-8
- `.github/workflows/land-approved.yml` — the breaker AC-6 trips, and the
  exemptions that keep a tripped breaker from being a trap
- `stories/README.md`, "The review round count is deliberately not a field here"
  — why AC-2 derives rather than stores
- OQ-42, in `Completed-Questions.md` — where the two-round bound was decided

## Open questions

*(none)*

<!--
Both of the original entry's remaining questions were resolved on 2026-09-19,
before dispatch, and are recorded in the acceptance criteria and Context rather
than here:

- **Shape of the bound.** Rounds, set to three, and the bound surfaces cost
  buildup rather than halting work — AC-6 and the Context section above. The
  "rounds that find nothing new" variant was set aside for want of a
  machine-applicable definition of "new"; a spend ceiling is a plausible second
  limit, not the primary one.
- **Where the labelling lives.** `review-gate.yml` — AC-6b — because it sees every
  pull request including ones no dispatcher ran, which is what the original
  complaint was about. This module only reads the label (AC-6), so exactly one
  place knows the rule.
-->


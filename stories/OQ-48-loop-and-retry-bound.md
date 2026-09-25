---
id: OQ-48
title: Close the loop, and enforce the retry bound with something other than an agent remembering
tier: next
kind: workflow
depends_on: [OQ-50, OQ-69, OQ-70, OQ-78, OQ-79]
model: sonnet
blocked: null
---

## Intent

As the owner, I want to add ready stories to `stories/` and have one loop run
each of them to completion: dispatched from the latest `origin/main`, retried
on a blocking review or a red CI under a bound that is enforced mechanically,
and landed once it passes. A bound that holds only when somebody remembers to
follow it is the problem this story began with.

## Acceptance criteria

- [ ] **AC-1** — One entry point runs the loop for one story, in this order:
      1. dispatch the coder (OQ-70);
      2. wait for CI on the head (OQ-79). If it is red, retry the coder with
         OQ-79's findings;
      3. if it is green, review the pull request (OQ-69). On a `block`
         verdict, retry the coder with the reviewer's findings;
      4. on a pass, land it (OQ-50).

      Both retries are bounded (AC-6, AC-6b). CI comes before review so that no
      review is spent on a head that cannot land. A pull request the coder
      opened as a draft stops the story and is reported: the coder stopped
      short and has said why. If a retry replaces the PR body without pushing a
      commit, as for a block on the description alone, the re-review uses
      OQ-78's re-review option. The loop composes those modules and
      reimplements none of them.
- [ ] **AC-2** — **The round count is derived, never stored**: it is the number
      of blocking verdict markers already on the pull request, read through
      `github.mjs`. A test asserts the bound still holds when the loop is
      restarted mid-story with no memory of prior rounds — a bound that resets
      when a process dies is not a bound. This is what the migration plan
      settled and it answers the first of this story's original open questions.
- [ ] **AC-3** — A retry happens on the **existing branch and pull request**,
      as new commits (or only a new PR body, for a block on the description
      alone), and never opens a second PR. `CLAUDE.md` requires that in
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
      OQ-80 puts that in `review-gate.yml` instead. The loop *reads* the label,
      so a pull request already carrying one is not retried.
- [ ] **AC-6b** — A red CI is retried like a blocking review, and is bounded
      separately at **three** red CI rounds. The count is derived by OQ-79's
      AC-4 and never stored, so AC-2's restart test covers it too. When the
      bound is reached the loop sets `blocked:` on the story with a reason
      naming the failing jobs, and stops. It applies no label: `review-blocked`
      means the review bound (OQ-80), and the workflow that applies it does not
      see CI rounds.
- [ ] **AC-7** — The loop never merges and never dispatches a workflow itself.
      It lands a pull request only by calling OQ-50's `land.mjs`, which is the
      only module allowed to trigger `land-approved.yml`. A test asserts that no
      merge request and no workflow-dispatch request can be built from the
      loop's own module. Every safety check on landing stays in the sweep.
- [ ] **AC-8** — A `pass` or `pass-with-observations` verdict hands the pull
      request to `land.mjs`. The story is finished when that reports it merged.
      Observations are recorded and are **not** retried — `REVIEW.md` is clear
      that the middle verdict exists precisely for findings deliberately not
      blocked on. Any other `land.mjs` result stops the story and is reported
      with its reason.
- [ ] **AC-9** — Each story is dispatched from the latest `origin/main`,
      including the loop's own code, prompts and queue. Before starting a
      story, and only while no story is in flight, the loop fetches and
      fast-forwards its own checkout to `origin/main`
      (`git merge --ff-only`). If that is not a fast-forward (a local edit or a
      diverged branch), the loop stops with its own status and dispatches
      nothing. It never updates mid-story, so every round of one story runs
      the same dispatcher code. Tests cover a fast-forward, a refusal, and no
      update between rounds.
- [ ] **AC-10** — Stories run one at a time. The next story starts only after
      the previous one is merged or stopped, so every story starts from a
      `main` that includes everything the loop landed before it. The loop runs
      until the queue has no ready story, then stops with `nothing-ready`. A
      test runs two stories and asserts the second's worktree base includes the
      first's merge.
- [ ] **AC-11** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-48 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Merging, or triggering the sweep other than through `land.mjs`.** AC-7 makes
  this a tested prohibition rather than an omission.
- **Choosing the story.** `queue.mjs`, read from `origin/main` by `coder.mjs`
  (OQ-78's AC-10).
- **Running stories in parallel.** Sequential is deliberate for now (AC-10).
  Parallel dispatch needs a merge queue first (`docs/agent-workflow-design.md`,
  "Merge queue") and is OQ-66's. The Constraints below keep the way open.
- **Pull requests the loop did not open**, story-writing PRs among them. OQ-83
  adds those, for authors with write access only (OQ-81).
- **The mechanics of spawning, rendering, or GitHub calls.** OQ-65, OQ-51,
  OQ-68.
- **Changing the reviewer's calibration.** OQ-64.
- **A starvation valve for stories that wait too long.** OQ-59.

## Constraints

- Node, ESM, no new runtime dependencies.
- **Keep the way open to running stories in parallel.** Everything the loop
  knows about a story's progress is derived from that story's own branch and
  pull request (AC-2, AC-6b). The loop keeps no state that spans stories other
  than its checkout, and AC-9 updates that only while nothing is in flight. So
  running several stories at once later changes how many are started, not
  how any one of them is tracked.
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

**Decided 2026-09-25, by the owner.** The loop's job is to take any ready story
to merged without anyone in between. So it lands (AC-7, AC-8, through OQ-50's
trigger rather than by merging), retries a red CI (AC-6b, reading it through
OQ-79), and dispatches every story from the latest `origin/main` (AC-9,
AC-10). It runs one story at a time for now, built so that parallel dispatch
can follow (Constraints). AC-9 came out of #142's review. `coder.mjs` read its
queue from a possibly stale local checkout, and the queue is only one of the
things the loop's own checkout supplies: prompts, `render.mjs` and the dispatch
modules come from it too, and each landing leaves it further behind.

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
- **Where the labelling lives.** `review-gate.yml` — split out on 2026-09-25 as OQ-80 — because it sees every
  pull request including ones no dispatcher ran, which is what the original
  complaint was about. This module only reads the label (AC-6), so exactly one
  place knows the rule.
-->


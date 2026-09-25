---
id: OQ-48
title: Run one story from dispatch to merged, with the retry bounds enforced mechanically
tier: next
kind: workflow
depends_on: [OQ-50, OQ-69, OQ-70, OQ-78, OQ-79, OQ-84, OQ-85, OQ-87]
model: sonnet
blocked: null
---

## Intent

As the owner, I want one command to take one ready story to merged: dispatched,
retried on a blocking review or a red CI under a bound that is enforced
mechanically, and landed once it passes. A bound that holds only when somebody
remembers to follow it is the problem this story began with. Running the whole
queue this way, one story after another, is OQ-86's.

## Acceptance criteria

- [ ] **AC-1** — One entry point runs one story, named by its id, in this
      order:
      1. dispatch the coder (OQ-70);
      2. wait for CI on the head (OQ-79);
      3. review the pull request (OQ-69);
      4. land it (OQ-50).

      A blocking review or a red CI sends the coder back through OQ-85's retry
      entry point, and the run continues from step 2. What each step's result
      leads to is AC-2's. CI comes before review so that no review is spent on
      a head that cannot land. This story composes those modules and
      reimplements none of them. It is runnable by hand for one story id, and
      resumes an existing pull request as AC-9 says.
- [ ] **AC-2** — **Every result either continues the run or stops the story;
      nothing else.** A result continues only where this list says so. Every
      other result stops the story, including a status a module adds later.
      - **Coder dispatch:** `opened`, not a draft, continues to CI. `opened`
        as a draft stops the story: the coder set `blocked:` and said why. Any
        other status stops the story before its pull request exists (AC-8).
      - **CI:** `green` continues to review. `red` whose run concluded
        `failure` continues to a CI retry, unless AC-4's bound is reached.
        Anything else stops (AC-5).
      - **Review:** a `recorded` `pass` or `pass-with-observations` continues
        to landing. A `recorded` `block` continues to a review retry, unless
        AC-3's bound is reached or the pull request carries `review-blocked`.
        Any other `review.mjs` status stops the story, including
        `no-verdict`, `malformed-verdict`, `session-failed` and
        `unrecordable`.
      - **Retry (OQ-85):** a result that reports the coder set `blocked:` or
        asked for a draft stops the story, whatever its status. Otherwise:
        - `retried` continues to CI on the new head;
        - `body-replaced` after a review retry continues to a re-review of
          the same head, through OQ-78's re-review option;
        - `body-replaced` after a CI retry stops the story. The head is
          unchanged, so its CI is still red, and AC-4's count, which counts
          commits, would never grow;
        - any other OQ-85 status stops the story.
      - **Landing:** `merged` finishes the story. Any other `land.mjs` result
        stops it.

      A table-driven test covers each named result and, for each step, a
      status it does not name.
- [ ] **AC-3** — **The review bound is three blocking verdicts, and the count
      is derived, never stored.** The count is the number of blocking verdict
      markers on the pull request whose authors' association is in
      `review.mjs`'s `HONOURED_ASSOCIATIONS` (the gate's set, OQ-78's AC-3),
      read through `github.mjs`. At three, the run stops the story (AC-8)
      with a reason naming the unresolved findings. It **does not write the
      `review-blocked` label**, and a test asserts no label-write request is
      constructible from this module — OQ-80 puts that in `review-gate.yml`
      instead. The run *reads* the label, so a pull request already carrying
      one is not retried. A test kills the run after a block and resumes it
      (AC-9) with no memory of earlier rounds, and asserts the bound still
      holds: a bound that resets when a process dies is not a bound.
- [ ] **AC-4** — A red CI whose run concluded `failure` is retried like a
      blocking review, and is bounded separately at **three** red CI rounds.
      The count is derived by OQ-79's AC-4, which counts exactly those runs,
      and never stored, so AC-3's restart test covers it too. At the bound
      the run stops the story (AC-8) with a reason naming the failing jobs.
      It applies no label: `review-blocked` means the review bound (OQ-80),
      and the workflow that applies it does not see CI rounds.
- [ ] **AC-5** — **Only a `failure` is retried.** A red CI run whose
      conclusion is anything other than `failure` (`cancelled`, `timed_out`,
      or any other), and OQ-79's `timed-out` result (the run did not finish
      within `CI_WAIT_TIMEOUT_MS`), stop the story with a status of their
      own. They are not retried and do not count as red CI rounds. To tell
      them apart, `waitForCi`'s `red` result in `scripts/dispatch/ci.mjs`
      gains the run's `conclusion`: today it carries `failedJobs`, `jobNames`
      and `findings`, and names the conclusion only inside the findings
      text. A test covers each: a `failure` is retried, while `cancelled`,
      `timed_out` and `timed-out` each stop without a retry.
- [ ] **AC-6** — **The round numbers a retry is given are derived the same
      way.** A review retry's round is the review count (AC-3) plus one, and
      a CI retry's is the red CI count (AC-4) plus one. Rounds remaining is
      three minus that round. A test asserts what OQ-85 is passed on rounds 2
      and 3 of each kind.
- [ ] **AC-7** — The run never merges and never dispatches a workflow itself.
      It lands a pull request only by calling OQ-50's `land.mjs`, which is the
      only module allowed to trigger `land-approved.yml`. A test asserts that no
      merge request and no workflow-dispatch request can be built from this
      story's own module. Every safety check on landing stays in the sweep.
      Observations on a passing verdict are recorded and **not** retried —
      `REVIEW.md` is clear that the middle verdict exists precisely for
      findings deliberately not blocked on.
- [ ] **AC-8** — **How a stop is recorded.** When the run stops a story whose
      pull request exists, it does these, in this order:
      1. **Makes the pull request a draft**, through OQ-87, unless it already
         is one. That comes first, so nothing can land the story while the
         rest is done. A draft is what the sweep, `land.mjs` and OQ-83 all
         skip.
      2. **Records `blocked:` with the reason** in the story file on the
         story's own branch, wherever that branch has it (after the coder's
         move, in `stories/done/`). It is one commit on top of the branch's
         tip on `origin`, pushed with OQ-84's `pushBranch`. This is skipped
         when the coder's own `blocked:` is already set there, as for a coder
         that took `coder.md`'s escape route on the first dispatch or on a
         retry. The commit is the run's record, not the coder's work, so
         OQ-84's AC-3 ("The dispatcher never commits on the coder's behalf")
         is not engaged.
      3. **Reports the stop**, with `recorded` true only when both steps
         succeeded, and otherwise with what failed.

      `main`'s copy of the story is not touched. A story that stops before its
      pull request exists records nothing, because there is nothing to record
      on: the run reports the dispatch's status, and OQ-86's AC-3 stops the
      loop for it. Tests cover a stop that makes the pull request a draft and
      commits, a stop where the coder's `blocked:` is already on the branch
      (draft, no commit), a pull request already a draft, a failed conversion,
      a failed push, and a stop before a pull request.
- [ ] **AC-9** — **Resuming.** Given the number of the story's open pull
      request, the entry point resumes it instead of dispatching the coder.
      It first checks that the pull request is open and that its head branch
      is the story's, and stops with its own status otherwise. If the pull
      request is a draft, or the story file at its head has `blocked:` set,
      it reports the story as already stopped and changes nothing. Otherwise
      it derives where the story is from GitHub alone. An honoured verdict
      marker at the head is handled as AC-2's review results are. With no such
      marker, it continues from CI on the head. Nothing is stored. Marking the
      pull request ready and removing `blocked:` is how a person lets a
      stopped story be resumed: the deliberate act that says the cost has been
      seen. The run never does either. Tests cover resuming at each of those
      points, a draft, and `blocked:` at the head.
- [ ] **AC-10** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-48 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **Merging, or triggering the sweep other than through `land.mjs`.** AC-7 makes
  this a tested prohibition rather than an omission.
- **Running the retry itself**: the coder on the existing branch, the retry
  prompt, and replacing the PR body. That is OQ-85's. This story decides
  when a retry happens and with which findings.
- **Running the queue**: choosing the next story, skipping stories that are
  `in-progress`, keeping the checkout current between stories, and running
  until nothing is ready. That is OQ-86's.
- **Running stories in parallel.** Sequential is deliberate for now (OQ-86).
  Parallel dispatch needs a merge queue first (`docs/agent-workflow-design.md`,
  "Merge queue") and is OQ-66's. The Constraints below keep the way open.
- **Pull requests the loop did not open**, story-writing PRs among them. OQ-83
  adds those, for authors with write access only (OQ-81).
- **The mechanics of spawning, rendering, or GitHub calls.** OQ-65, OQ-51,
  OQ-68, and OQ-87 for converting a pull request to draft.
- **Changing the reviewer's calibration.** OQ-64.
- **A starvation valve for stories that wait too long.** OQ-59.

## Constraints

- Node, ESM, no new runtime dependencies.
- **Keep the way open to running stories in parallel.** Everything the run
  knows about a story's progress is derived from that story's own branch and
  pull request (AC-3, AC-4, AC-8, AC-9). It keeps no state that spans
  stories. So
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

**Its first open question is now answered** and has become AC-3: the count is
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

- The run stops retrying and records `blocked:` on the story — it stops spending
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

What else that hand-run established about the retry itself (findings that
forge markers, the context a retry needs, how findings are framed) is in
OQ-85's Context.

**Decided 2026-09-25, by the owner.** The loop's job is to take any ready story
to merged without anyone in between. So it lands (AC-2, AC-7, through OQ-50's
trigger rather than by merging), retries a red CI (AC-4, reading it through
OQ-79), and dispatches every story from the latest `origin/main` (OQ-86). It
runs one story at a time for now, built so that parallel dispatch can follow
(Constraints).

- `docs/migration-plan.md`, "Order within Phase 1" step 6 and the Phase 1 exit
  criteria — this story's scope, and the restart test AC-3 implements
- `REVIEW.md`, "The three verdicts" — AC-7
- `.github/workflows/land-approved.yml` — the breaker AC-3 trips, and the
  exemptions that keep a tripped breaker from being a trap
- `stories/README.md`, "The review round count is deliberately not a field here"
  — why AC-3 derives rather than stores
- OQ-42, in `Completed-Questions.md` — where the two-round bound was decided

**Amended 2026-09-25, by the owner, from the dispatch and review of OQ-79
(#149).** Two gaps in this story's part of the loop:

- **Where a stop is recorded (AC-8).** `blocked:` had no stated home. The owner
  chose the story's own branch, as the coder already uses, over deriving the
  stop with nothing written, or a second pull request against `main`. Keeping
  a stopped story out of the queue, which still reads it `ready` on `main`, is
  OQ-86's.
- **Cancelled and timed-out CI (AC-5).** When this was written, `ci.yml` set
  neither `concurrency` nor `timeout-minutes`. Its runs on GitHub had
  concluded `success` 318 times and `failure` 7 times, and never `cancelled`
  or `timed_out`. The last 100 took 62 seconds at the median and 97 at most.
  So nothing cancels a run automatically, and a cancelled run on the head is
  somebody's deliberate act. GitHub times a job out only at its default limit,
  hours away, long after OQ-79's own wait has returned `timed-out`, so
  `timed_out` is not expected at all. And a run that does not finish within
  that wait points at GitHub (a queue, an outage) rather than the code, since
  Vitest and Playwright each time out a single test. None of these is
  anything a coder retry can fix. Retrying them would also not advance the
  red-CI bound, since OQ-79's AC-4 counts only `failure`. Raised in both
  the runner's notes and the review of #149.

**Split 2026-09-25, by the owner, before dispatch.** This story had grown to
sixteen criteria (AC-1 to AC-15, and AC-6b). It keeps running one story to
merged, with the bounds that belong to it. OQ-85 took the retry itself, and
OQ-86 took running the queue.
The criteria were renumbered, since the story had not been dispatched. Before
the split the retry was AC-3, AC-4, AC-5 and AC-15, and the queue was AC-9,
AC-10 and AC-12. Stories in `stories/done/` that cite those numbers (OQ-79's
"OQ-48's AC-4") refer to the numbering of that time.

**Revised 2026-09-25 after the third review of #151,** which found that a
retried coder taking `coder.md`'s escape route (`blocked:` and a request for
a draft) was never stopped, and its pull request stayed ready to land. Walking
every result of every step then found more of the same kind. So:

- AC-2 lists what each result leads to, and makes every result it does not
  name a stop. This covers a retry that reports `blocked:`, a draft or a
  failure; a review that records no verdict; and a body-only retry after red
  CI, which would otherwise have retried without end.
- AC-8 makes a stopped story's pull request a draft, through OQ-87, before
  anything else. That keeps the rule `coder.md` and OQ-70's AC-8 rely on: a
  `blocked:` story is always a draft, and a draft is what keeps the sweep off
  it. The owner chose a draft over closing the pull request, and over leaving
  it ready. OQ-87 was split out because it adds the first GraphQL request to
  `github.mjs`'s allowlist.
- AC-9 resumes an existing pull request. That is what makes AC-3's restart
  test possible, since a first dispatch returns `branch-exists` once the
  branch exists.
- AC-6 defines the round numbers a retry is given.

## Open questions

*(none)*

<!--
Both of the original entry's remaining questions were resolved on 2026-09-19,
before dispatch, and are recorded in the acceptance criteria and Context rather
than here:

- **Shape of the bound.** Rounds, set to three, and the bound surfaces cost
  buildup rather than halting work — AC-3 and the Context section above. The
  "rounds that find nothing new" variant was set aside for want of a
  machine-applicable definition of "new"; a spend ceiling is a plausible second
  limit, not the primary one.
- **Where the labelling lives.** `review-gate.yml` — split out on 2026-09-25 as OQ-80 — because it sees every
  pull request including ones no dispatcher ran, which is what the original
  complaint was about. This module only reads the label (AC-3), so exactly one
  place knows the rule.
-->

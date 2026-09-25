---
id: OQ-50
title: Trigger the landing sweep from the dispatcher once a pull request is landable
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I need a PR that has passed review to land promptly, so that the
loop's throughput is bounded by how fast work gets reviewed rather than by when
somebody remembers to trigger the sweep by hand. The dispatch loop (OQ-48) calls
this once a story's pull request has passed. It is also usable on its own for
one pull request.

## Acceptance criteria

- [ ] **AC-1** — A new module, `scripts/dispatch/land.mjs`, has one entry point
      that takes a pull request number. It waits until the PR is landable, then
      triggers `land-approved.yml` through `workflow_dispatch` and waits until
      the PR is merged. Landable means: not a draft, no `review-blocked` label,
      `mergeable_state` `clean`, and `review/agent` = `success` on its current
      head SHA. It **never merges anything itself**; the sweep remains the only
      thing that merges. A test asserts no merge request (`PUT …/pulls/<n>/merge`)
      can be built from this module.
- [ ] **AC-2** — Each reason a PR cannot become landable returns its own
      `status` rather than waiting indefinitely:
      - it is a draft;
      - it carries `review-blocked`;
      - `review/agent` is `failure`, or still pending past a bound;
      - `mergeable_state` is `blocked` past a bound, which is how a failed
        required check shows here (reading CI is OQ-79's, and OQ-48 waits for
        green before reviewing, so this is a backstop);
      - `mergeable_state` is `dirty`;
      - the head moved while waiting.
      A test covers each.
- [ ] **AC-3** — `unknown` is waited through, not treated as final. It
      re-reads `mergeable_state` after a delay, and re-triggers the sweep while
      the PR is still open after a triggered run, which covers both a sweep that
      skipped it as `unknown` and a sweep that landed an older PR first. Attempts
      and total wait are bounded, and both bounds are constants named in the
      module. A test replays the #123/#125 sequence below: skipped as `unknown`
      once, landed on the re-trigger.
- [ ] **AC-4** — `land.mjs` sends only what it needs, enforced like
      `github.mjs`'s `send`: an allowlist checked before any network call. The
      only write it can send is a `workflow_dispatch` of `land-approved.yml` on
      `main`, with no inputs. A test asserts that dispatching any other workflow,
      and any other write, is refused before the network. `github.mjs`'s
      allowlist and its OQ-68/AC-3 tests are unchanged, and a test asserts that
      neither `coder.mjs` nor `review.mjs` imports `land.mjs`, so neither half of
      the loop that runs a model can reach the landing trigger.
- [ ] **AC-5** — The time from a PR becoming landable to the sweep being
      triggered is bounded by the module's poll interval, and that bound is
      written down in the module. A PR sitting merge-ready for hours fails this,
      whatever eventually lands it.
- [ ] **AC-6** — `land-approved.yml`'s eligibility and safety logic is
      unchanged: one PR per run, oldest first, `--match-head-commit`,
      `review/agent` re-checked directly rather than trusted via `clean`, and the
      `review-blocked` circuit breaker with its exemptions. The diff changes no
      line of that workflow's steps.
- [ ] **AC-7** — Landing latency is observable after the fact. It is possible
      to answer "how long did the last N PRs wait after becoming landable?"
      without reading Actions logs by hand. A cadence regression must be visible
      rather than silent, which is the failure this story exists because of.
- [ ] **AC-8** — Each statement that triggering `land-approved.yml` is the
      owner's alone is updated to say the owner or `land.mjs` may trigger it, and
      that no agent session does. That includes `CLAUDE.md` ("Branches and pull
      requests") and any other copy a grep finds. Model sessions still never
      trigger it. Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-50 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- Changing what makes a PR landable. The eligibility rules are right; only the
  promptness of acting on them is in question.
- **Retrying a pull request whose CI failed.** This module reports it. OQ-79
  reads the failure, and OQ-48's loop retries.
- **Calling this from the loop.** That is OQ-48's.
- Merge queue. That is a different problem — semantic conflict between
  independently-green PRs — and is deferred until parallel dispatch.
- Removing `land-approved.yml`. Its eligibility and safety logic is correct and
  is what the new trigger drives. A sweep that survives the owner's machine
  being off is still wanted as a backstop; it is the *trigger* that needed
  replacing, not the workflow.

## Constraints

- The mechanism is decided (2026-09-25): **the local dispatcher triggers the
  sweep**, and does not merge. See Open questions for why.
- Node, ESM, no new runtime dependencies.

## Context

Measured on 2026-09-18 against `origin/main`:

- `.github/workflows/land-approved.yml` landed on `main` at **01:46Z** (`0d9189e`, #96) with
  `cron: '*/15 * * * *'`.
- By **17:32Z** — 15.8 hours, ~63 scheduled runs expected — exactly **three**
  had occurred: `07:07Z`, `12:14Z`, `16:30Z`. Roughly **5% of the scheduled
  rate**.
- The gaps are consistent rather than random: **5.3h, 5.1h, 4.3h**. Whatever is
  throttling delivery is doing it steadily — mildly reassuring for
  predictability, no help at all for latency.
- **Every `workflow_dispatch` run has succeeded**, including the two that landed
  #98 and #99. The workflow logic is not the problem; delivery of the `schedule`
  event is.
- `docs/agent-workflow-design.md` already allowed for slippage — "treat `*/15`
  as within the hour" — so an allowance existed. Five hours was well outside it.
- **The `schedule:` trigger was removed on 2026-09-18**, leaving
  `workflow_dispatch` as the only way the sweep runs. A trigger that fires 5% of
  the time is worse than one that never fires on its own: it is too slow to rely
  on, yet automatic enough that nobody notices it has stopped. Landing is now
  explicitly manual, and visibly so, until this story replaces it. That makes
  AC-1 the whole of the work rather than a refinement of it.

- `.github/workflows/land-approved.yml` — the sweep as it stands
- `docs/agent-workflow-design.md`, "Merging" and "Watchdog" — why landing is a
  sweep at all rather than the author's job, and what the backstop covers.

**Added 2026-09-24: `unknown` straight after a merge.** GitHub recomputes
`mergeable_state` after a merge, and until it finishes, other open PRs can
read `unknown`, which the sweep skips. #123 merged at 02:13:42Z. A run at
02:17:14Z skipped #125 as `unknown`, and the next run, at 02:26:30Z, landed
it. Today that costs a manual re-run. For whichever trigger this story
chooses, it is likely to matter more, because both candidates below fire
*close to* a state change: the dispatcher merging right after it posts a
verdict, or a `status` event firing as a check completes. Only the
after-a-merge case has been observed. That GitHub is also still recomputing
at those moments is a reasonable expectation, not a measurement. If the
trigger does not retry after a delay, a burst of merges leaves PRs sitting
landable, which fails AC-2 without anything reporting an error.

## Open questions

*(none)*

<!--
Resolved 2026-09-25 by the owner, before dispatch. The question was where the
merge should happen:

1. The local dispatcher merges.
2. Keep it in Actions, on a `status`-triggered workflow.

Chosen: a variant of 1. The dispatcher *triggers* `land-approved.yml` rather
than merging, so every eligibility and safety check stays in the one workflow
that already has them, and nothing new learns to merge. The cost named for
option 1 still applies: the trigger is on the critical path of a process that
can die. The sweep stays runnable by hand as the backstop. Option 2 was set
aside because whether `status` events fire for the token that posts them is
unverified, and this project has shipped that kind of claim wrong twice.
-->

---
id: OQ-50
title: Land review-passed PRs without depending on GitHub's scheduler
tier: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I need a PR that has passed review to land promptly, so that the
loop's throughput is bounded by how fast work gets reviewed rather than by when
somebody remembers to trigger the sweep by hand.

## Acceptance criteria

- [ ] **AC-1** — A PR that is not a draft, carries no `review-blocked` label,
      reads `mergeable_state` `clean`, and has `review/agent` = `success` on its
      current head SHA is landed without any human triggering anything.
- [ ] **AC-2** — Time from that state being reached to the merge is bounded, and
      the bound is written down. A PR sitting merge-ready for hours fails this
      regardless of what eventually lands it.
- [ ] **AC-3** — Every safety property of today's `land-approved.yml` survives:
      one PR per run, oldest first, `--match-head-commit`, `review/agent`
      re-checked directly rather than trusted via `clean`, and the
      `review-blocked` circuit breaker with its existing exemptions.
- [ ] **AC-4** — Landing latency is observable after the fact — it is possible
      to answer "how long did the last N PRs wait after becoming landable?"
      without reading Actions logs by hand. A cadence regression must be visible
      rather than silent, which is the failure this story exists because of.

## Out of scope

- Changing what makes a PR landable. The eligibility rules are right; only the
  promptness of acting on them is in question.
- Merge queue. That is a different problem — semantic conflict between
  independently-green PRs — and is deferred until parallel dispatch.
- Removing `land-approved.yml`. Its eligibility and safety logic is correct and
  is what any replacement trigger would drive. A sweep that survives the owner's
  machine being off is still wanted as a backstop — it is the *trigger* that
  needs replacing, not the workflow.

## Constraints

*(none — the mechanism is the open question below, and binding it here would
pre-empt the decision)*

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
- `agent-workflow-design.md` (external to this repository) already allowed for
  slippage — "treat `*/15` as within the hour" — so an allowance existed. Five
  hours was well outside it.
- **The `schedule:` trigger was removed on 2026-09-18**, leaving
  `workflow_dispatch` as the only way the sweep runs. A trigger that fires 5% of
  the time is worse than one that never fires on its own: it is too slow to rely
  on, yet automatic enough that nobody notices it has stopped. Landing is now
  explicitly manual, and visibly so, until this story replaces it. That makes
  AC-1 the whole of the work rather than a refinement of it.

- `.github/workflows/land-approved.yml` — the sweep as it stands
- `agent-workflow-design.md` — **external**, in the owner's working directory,
  not this repository. "Merging" and "Watchdog": why landing is a sweep at all
  rather than the author's job, and what the backstop covers.

## Open questions

- **Where should the merge happen?** Two candidates, and the choice decides most
  of the diff:
  1. **The local dispatcher merges.** It already runs locally, already holds an
     authenticated `gh`, and already posts the `review/agent` status — so it is
     present at exactly the moment a PR becomes landable. `land-approved.yml`
     then becomes the backstop for when the machine is off, which is what the
     design's watchdog section already wants it to be. Cost: merging moves onto
     the critical path of a process that can die.
  2. **Keep it in Actions, on a better trigger.** A `status`-triggered workflow
     fires when `review/agent` is set rather than on a clock. Cost: `status`
     events do not fire for every token that posts them, and that needs
     verifying before anything depends on it — exactly the kind of claim this
     project has shipped wrong twice.

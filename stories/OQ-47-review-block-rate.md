---
id: OQ-47
title: Report the review gate's verdict mix, and decide whether it earns its cost
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As someone relying on the agent review gate, I want the verdict mix reported from
the record that already exists, so that I keep paying for the gate on evidence
rather than on faith.

## Acceptance criteria

- [ ] **AC-1** — A script reports the verdict tally across all gated pull
      requests, computed from the marker comments already on them. It adds no
      instrumentation and stores nothing: every verdict is already recorded twice,
      as a `review/agent` commit status and as an
      `<!-- agent-review head=… verdict=… -->` comment.
- [ ] **AC-2** — The report distinguishes all four recorded verdicts —
      `pass`, `pass-with-observations`, `block`, and `fail` as the deprecated
      spelling of `block` — and does **not** collapse `pass-with-observations`
      into `pass`. That distinction is the whole point: reviewers here repeatedly
      found real problems and recorded them as observations, and a tally that
      merges the two understates what review catches.
- [ ] **AC-3** — It reports both a per-verdict count and a per-pull-request count,
      because they answer different questions. A pull request with three blocking
      verdicts is one story that went long, not three defective changes.
- [ ] **AC-4** — Counting is driven by the same marker pattern
      `.github/workflows/review-gate.yml` matches, so a verdict the gate acted on
      is a verdict this counts. A test asserts the two agree on a fixture set
      including a deprecated `fail` and a malformed marker.
- [ ] **AC-5** — The parsing and tallying are pure exported functions tested
      against fixtures, with the API fetch behind an injectable boundary. Tests
      must not reach the network.
- [ ] **AC-6** — The report is run and its output recorded in the PR body, with
      the owner's read on the question the story exists to answer: is the gate
      worth its cost. That conclusion is a human judgement and belongs in the pull
      request, not in the script.

## Out of scope

- **Changing the reviewer's calibration.** Whether the gate blocks on the right
  things is OQ-64.
- **Building a logger, a dashboard, or storing the tally.** The record already
  exists; a second copy of it would be a thing to maintain and could drift.
- **Enforcing anything on the basis of the rate.** This story measures and
  reports.
- **Spend-per-pull-request figures.** Cost data lives in
  `docs/agent-workflow-design.md`; correlating it with verdicts is separate work.

## Constraints

- Node, ESM, no new runtime dependencies, consistent with `scripts/dispatch/`.

## Context

Refined out of `Open-Questions.md` on 2026-09-19. OQ-42 shipped with the
instruction to check this after roughly 20 gated pull requests.

**That threshold is well past, and the tally the backlog entry recorded is stale.**
It read "9 verdicts across 5 PRs, 2 of them `fail`". Recomputed from the marker
comments on 2026-09-19, across the 60 most recent pull requests:

| | Count |
|---|---|
| Gated pull requests (carrying at least one marker) | 29 |
| Verdicts recorded | 44 |
| `pass` | 17 |
| `pass-with-observations` | 20 |
| `block` | 4 |
| `fail` (deprecated spelling) | 3 |
| Blocking verdicts | 7 of 44 — 15.9% |

Blocking verdicts are concentrated in four pull requests: #117 (three), #112,
#96 (two, both the deprecated spelling) and #89. **These figures are a starting
point for AC-1's script to reproduce, not a substitute for it** — they were
produced by an ad-hoc command, and the story's point is a repeatable report.

Two things the numbers already settle, which narrow what this story is for:

1. **The original worry is answered.** The concern was that a zero block rate
   would mean the gate is latency rather than a gate. It is not zero, and the
   blocking verdicts were real — a circuit breaker reimplemented without the
   exemption its own story mandated, which would have deadlocked the repository;
   a pull request body describing the pre-fix version of its own change; and
   #117's three rounds, each finding a distinct defect.
2. **`pass-with-observations` is the modal verdict**, at 20 of 44 — more common
   than a clean `pass`. Any reading of this gate that treats the middle state as
   a rounding error is reading past the majority of what it produces.

- `REVIEW.md`, "Recording a verdict" and "The three verdicts" — the marker format
  and the vocabulary AC-2 preserves
- `.github/workflows/review-gate.yml` — the pattern AC-4 must agree with
- `stories/OQ-64-reviewer-block-calibration.md` — the calibration question this
  story deliberately does not answer
- OQ-42, in `Completed-Questions.md` — where the check was mandated

## Open questions

*(none)*

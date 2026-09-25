---
id: OQ-80
title: Apply the review-blocked label from the review gate when a pull request reaches the round bound
tier: next
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As someone relying on the circuit breaker, I want `review-blocked` applied
mechanically whenever a pull request reaches the round bound, so that the
breaker counts a real signal rather than one applied when somebody happens to
follow the rule.

## Acceptance criteria

- [ ] **AC-1** — `.github/workflows/review-gate.yml` counts the blocking verdict
      markers on a pull request and applies `review-blocked` once there are three.
      This is where the rule lives, because the workflow sees **every** pull
      request — including ones no dispatcher ran, which is OQ-48's original
      complaint: the label is applied only when somebody remembers, so the
      breaker counts a signal nothing reliably produces. Applying it here also
      means the bound survives a dispatcher that dies mid-story. The workflow's
      `permissions:` widens from `pull-requests: read` to `write` for this, which
      is the cost and should be stated in the workflow's own comment.
- [ ] **AC-2** — The label is applied **once** and is never removed by anything
      automated. Removing it is a deliberate human act meaning "I have seen the
      cost, proceed" — so a fourth round dispatched by hand still works, and the
      pull request stays out of the sweep until someone decides otherwise. A test
      asserts the workflow does not remove the label and does not re-apply it to a
      pull request that already carries it.
- [ ] **AC-3** — Only markers the gate itself honours are counted: a
      well-formed marker, from an author association the gate accepts, with
      `verdict=block` (or the deprecated `fail`). The count uses the same rules
      the "Apply verdict from marker" step uses to read a verdict, and a test
      shows that a malformed marker, or one from an account without write
      access, is not counted.
- [ ] **AC-4** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-80 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- **The dispatch loop**, which reads the label and stops retrying (OQ-48's
  AC-6). This story only applies it.
- **Changing the breaker's threshold or exemptions** in `land-approved.yml`.
- **Counting red CI rounds.** OQ-48's AC-6b bounds those separately and applies
  no label.

## Constraints

- The `review-blocked` label string must stay exactly as it is:
  `land-approved.yml` and the `SessionStart` hook both read it.
- The bound, three blocking verdicts, is OQ-48's. It is restated in AC-1 for
  readability, and must not drift from OQ-48's AC-6.

## Context

Split out of OQ-48 on 2026-09-25, where these were AC-6b and AC-6c, to keep
that story a reviewable size. The reasoning for the bound, and for why a label
does not halt work, is in OQ-48's Context. The label does not depend on the
loop: it applies to every pull request, including hand-run ones.

- `.github/workflows/review-gate.yml`: the "Apply verdict from marker" step,
  whose marker and association rules AC-3 reuses.
- `.github/workflows/land-approved.yml`: the breaker the label feeds, and its
  exemptions.

## Open questions

*(none)*

---
id: OQ-115
title: Move the dispatch workflow to a repository of its own, and use it from this one
tier: normal
kind: workflow
depends_on: [OQ-80, OQ-117, OQ-118, OQ-122, OQ-123]
model: sonnet
blocked: null
---

## Intent

As the owner, I want the dispatch workflow in a repository of its own, so that
I can use it in other projects and this repository stays about the product.
Goals 1 and 4 in `docs/agent-workflow-design.md`, "Portability".

**This is a placeholder for refinement, not a dispatchable story.** It will be
split before anything here is `ready`. The ACs below state the outcome only;
the real ones come from the answers to the open questions.

Narrowed 2026-10-08 (`docs/agent-workflow-design.md`, "The move, in order"): creating
`luplows/steward` and extracting the code is a bootstrap the owner and Session A do by hand, and
this story becomes adopting steward from this repository once that exists.

## Acceptance criteria

- [ ] **AC-1** — Provisional: a second project can run the workflow (queue,
      coder, reviewer, gate and landing) with its own repository, stories and
      review items, and no copy of the workflow's code.
- [ ] **AC-2** — Provisional: this repository runs the same workflow from the
      new one, and keeps only its product, its stories and its own
      configuration.
- [ ] **AC-3** — Every `**Planned (…)**` marker in
      `docs/agent-workflow-design.md` that names OQ-115 is resolved as that
      document's "Reading this document" note says.

## Out of scope

- Supporting other companies' models. That is OQ-114.
- Changing what the gate decides: verdicts, the round bound, landing.

## Constraints

*(none)*

## Context

- `docs/agent-workflow-design.md`, "Portability": the goals, what ties the
  workflow to this repository today, and the open questions.
- `DEFAULT_REPO` in `scripts/dispatch/coder.mjs`, `land.mjs`, `loop.mjs`,
  `review.mjs` and `story.mjs`.
- `.github/workflows/ci.yml`, `land-approved.yml` and `review-gate.yml`, and
  `scripts/land/`: the gate as this repository's own workflows.
- OQ-94: naming each CI check's command where the coder and reviewer read it.
  It bears on R3.
- OQ-101: the scheduled task the loop runs from. R5 (revised 2026-10-08):
  the move comes before OQ-73 and OQ-101, so both are built in the
  workflow's repository.

## Open questions

R1 to R10, in
`docs/agent-workflow-design.md`, "Portability", "Open questions". Answers are
recorded there as they are made.

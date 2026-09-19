---
id: OQ-66
title: Interleave or parallelise workflow and product work
tier: later
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want workflow work and product work to make progress against
each other rather than the conveyor consuming every slot, so that building the
loop does not quietly become the project.

## Acceptance criteria

*(provisional — the first open question decides whether this story is built at
all, and the second decides what it is allowed to read. Written down so the
shape is arguable, not because it is settled.)*

- [ ] **AC-1** — Whatever mechanism is chosen, `stories/README.md` states it,
      including what it may and may not read. If the answer is a change to the
      `kind` rule, that paragraph is rewritten rather than contradicted.
- [ ] **AC-2** — The selection rule remains deterministic and testable without a
      repository in any particular state, as `queue.mjs` is today. "Alternating"
      must not mean "depends on what ran last", because that is state nobody
      stores and a restart would lose.
- [ ] **AC-3** — Every selection reports which rule chose the story, extending
      OQ-59's AC-5 rather than adding a second reporting mechanism.
- [ ] **AC-4** — If concurrency is in scope, a story touching the machinery —
      `.claude/prompts/`, `scripts/dispatch/` — cannot run concurrently with any
      other story, and a test exercises that exclusion against a real pair.

## Out of scope

- The merge queue and the `merge_group` bridge. Those are Phase 4 step 1 in the
  migration plan and are a prerequisite for concurrency, not part of this.
- Changing tiers by hand. That already works and is the documented valve.
- `queue.mjs`'s existing tier-then-id ordering, which stays the default whatever
  this adds.

## Constraints

- Node, ESM, no new runtime dependencies.

## Context

Raised 2026-09-19, after Phase 1 had produced eight workflow stories against
five product ones and the product backlog had not moved in that time. That is a
deliberate choice — tooling first — rather than a defect, but it is the point at
which the imbalance is worth a mechanism instead of attention.

**The `kind` rule is the live tension.** `stories/README.md` says, in as many
words: *"Nothing in the dispatcher reads it, and nothing in the ordering may.
That is stated as a rule because a field that exists eventually attracts a sort:
ordering by `kind` should be a visible violation of something written down
rather than a natural-looking extension."* Alternating workflow and product **is**
ordering by `kind`. The rule exists to make this proposal surface as a decision,
and it has done its job; what it does not do is decide the answer.

**Concurrency here is not ordinary parallel dispatch.** The design's Phase 4
warns about semantic conflict between independently-green PRs. This split is
worse than that: the workflow flow modifies the machinery the product flow is
running on. A workflow story that edits `coder.md`, `render.mjs` or `spawn.mjs`
changes the contract for a coder that is already mid-flight. That is not
hypothetical — during the OQ-63 hand-run, `stories/OQ-51-*.md` was a live fixture
for `queue.test.mjs`, and editing it broke merged tests three separate times.
Hence AC-4: parallel in dispatch, serialised at the machinery boundary.

- `stories/README.md`, "**`kind` is for people, not the dispatcher**" — the rule
  this story must either honour or deliberately rewrite
- `stories/OQ-59-promote-starved-story.md` — the age-based valve, which may
  already deliver this outcome without reading `kind` at all
- `docs/migration-plan.md`, Phase 4 — parallel dispatch, and why the merge queue
  comes first
- `docs/agent-workflow-design.md` — Phase 3 before Phase 4: *"throughput without
  a human checkpoint is how the mental model degrades fastest"*

## Open questions

- **Does OQ-59 make this unnecessary?** Its valve promotes the longest-untouched
  ready story regardless of tier. Product stories sit untouched while workflow
  work lands, so they become the oldest and get pulled forward on their own — no
  `kind` read, no rule change, nothing new to build. That is not strict
  alternation, but it may be the whole of the outcome wanted. **This story should
  not be built until OQ-59 has run for long enough to show whether it does.** If
  it does, delete this rather than demote it.
- **Should the `kind` rule change at all?** If alternation is wanted explicitly,
  the paragraph in `stories/README.md` has to be rewritten, and whatever replaces
  it needs to say why a `kind` sort is acceptable here when the original
  reasoning — that a field which exists eventually attracts a sort — has not
  stopped being true. A second axis added to ordering is much harder to remove
  than to add.
- **What counts as machinery, and how is exclusivity enforced?** AC-4 names
  `.claude/prompts/` and `scripts/dispatch/`, but a story can touch `REVIEW.md`
  or `CLAUDE.md` and change the contract just as much. Enforcement could be a
  lock the dispatcher holds, a declared field on the story, or path inspection of
  the diff — and the last one cannot be known before the work is done.
- **Is concurrency wanted before Phase 3 exists?** The design says release review
  should come first, because throughput without a human checkpoint degrades the
  mental model fastest. Interleaving is cheap and needs none of that;
  concurrency needs the merge queue and arguably Session B. Splitting this story
  in two along that line may be better than answering both at once.

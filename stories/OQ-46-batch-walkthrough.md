---
id: OQ-46
title: Walk the owner through a batch of changes, roughly every 10 PRs
tier: normal
kind: workflow
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the person this project belongs to, I want to be walked through what has
actually changed after roughly every ten merged pull requests, so that dropping
the per-pull-request human gate does not cost me the mental model of my own app.

## Acceptance criteria

- [ ] **AC-1** — Something raises a flag when a batch is due, without a human
      remembering to count. What holds the marker is **Open questions**.
- [ ] **AC-2** — The walkthrough covers **UI changes, shown rather than
      described** — a before/after of every screenshot baseline in
      `e2e/__screenshots__/` that moved across the batch.
- [ ] **AC-3** — It covers **functionality changes**: a recap of what the tool
      does now that it did not at the last checkpoint.
- [ ] **AC-4** — It covers **docs changes**: what moved in `README.md`,
      `Project-Outline.md` and the story files, including which stories were
      completed into `stories/done/`.
- [ ] **AC-5** — It **does not gate anything**. No merge is blocked, no agent is
      stopped, and nothing waits on the owner having read it. A walkthrough that
      halts progress while it waits for a human stops being run — the same call
      OQ-42 made for blocked pull requests, for the same reason. A test or a
      structural argument in the PR body must show that nothing in the
      implementation can block the landing sweep.
- [ ] **AC-6** — A finding from a walkthrough becomes an ordinary story in
      `stories/`, with no special status or handling.

## Out of scope

- **Reinstating a per-pull-request human gate**, in any form. This story exists
  because that gate was removed deliberately.
- **Replacing the automated guards.** The screenshot assertions, the palette work
  and the review gate stay exactly as they are; this adds a periodic human read
  on top of them, and does not relax any of them.
- **Changing what the review gate does.**

## Constraints

*(none binding until the open questions below are settled — they decide the
mechanism.)*

## Context

Refined out of `Open-Questions.md` on 2026-09-19, with its open questions intact
and unresolved. It is `draft` until they are answered, which is correct: the
mechanism is genuinely undecided, and dispatching it would make a coder's guess a
permanent unreviewed decision.

Removing the pre-merge visual-inspection gate traded per-pull-request human
attention for automated guards — the screenshot assertions from OQ-40, the
palette work in OQ-44, and the agent review gate from OQ-42, all in
`Completed-Questions.md`. **Those guards are all regression detectors.** They
compare the app to what it was and they pass when a change is self-consistent.
None of them can tell the owner that the tool now does something he never
pictured, or that ten small, individually-reasonable changes have added up to a
different product. This story puts the human read back at a tenth of the
frequency.

- `e2e/__screenshots__/` — the baselines AC-2 draws its before/after from
- `.claude/hooks/session-start.sh` — already counts `review-blocked` pull
  requests, so it has machinery relevant to AC-1
- OQ-40, OQ-42, OQ-44, in `Completed-Questions.md` — the guards this supplements

## Open questions

- **What counts to ten, and where does the count live?** Merged pull requests
  since the last checkpoint is the intent, but something has to hold the marker
  and raise the flag: a scheduled workflow counting merges since a tag, a pinned
  issue, or the `SessionStart` hook, which already counts `review-blocked` pull
  requests and so has the machinery. AC-1 cannot be checked until this is
  settled.

- **What form does the walkthrough take?** An issue with embedded before/after
  images, a generated page, or an interactive session that presents it and takes
  questions. The images make a static artifact attractive; "walk me through it"
  implies something conversational. This decides whether AC-2 to AC-4 describe a
  document or a script for a session.

- **Should "roughly ten" be time-based instead?** Ten pull requests could be a
  week or a month depending on how hard the project is being pushed, and the
  thing being protected — the owner's mental model — decays with time rather than
  with merge count.

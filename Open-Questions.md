# Open Questions / In Progress

Outstanding tasks and open questions for the project, written as user stories — each one a single testable unit of work. See `Project-Outline.md` for goals and definitions.

**This is the idea backlog, and nothing dispatches from it.** The refined, dispatchable queue is [`stories/`](stories/README.md) — one file per story, with enumerated acceptance criteria a reviewer can check a diff against. An entry here crosses over when it is next picked up, acquiring acceptance criteria as it goes: there is no bulk migration, and nothing here is rewritten in advance. Entries resolved directly from this file still move to `Completed-Questions.md` as they always have.

Each story has a permanent number (e.g. "OQ-7") for easy reference. Numbers are never reused or renumbered, even when a story is resolved and moves out to [`Completed-Questions.md`](Completed-Questions.md) — so a number always points to the same story.

## Outstanding

Roughly ordered by priority within each tier below; re-evaluate as work lands. A story's number never changes, only its position in this list.

### Foundational correctness

**OQ-1. Verify Workshop upgrade per-level cost accuracy**
As a player, I want the coins/cash cost shown for each Workshop upgrade level to match the current patch, so that the buy-order algorithm (OQ-2) recommends real spending, not stale numbers.
**Mostly resolved via OQ-39's Phase 1 migration:** Workshop upgrade costs now come directly from mytower.app (`src/data/workshopLevels.js`) rather than `tower-idle-toolkit` — the source itself changed, not just a cross-check layer bolted on top of it. This fixed a real, confirmed-wrong data point (Wall Health, OQ-38) and closed the old 4-upgrade cost-data gap entirely — every level 0..quantity-1 now has a real cost, nothing left to report as `unknownCost` for missing Workshop data. **Still genuinely open:** "Max level confirmed" — no upgrade's max level has been checked against the real, current-patch game directly. mytower.app's own max level matched this project's existing value for all 48 upgrades (a byte-identical structural snapshot), which is reassuring but not the same as independent in-game confirmation. **Tracking checklist:** [`OQ-1-Checklist.md`](OQ-1-Checklist.md) — now primarily useful for that remaining max-level task. Re-running `scripts/verify-workshop-costs.mjs` going forward checks for *drift* from mytower.app's own live data (e.g. after a future patch changes a cost before this project re-extracts it), not independent cross-validation — our data comes from the same place it's being checked against now.

**OQ-45. Extend scheduled drift detection to Enhancement data**
As a player, I want Enhancement costs to get the same patch-drift protection Workshop costs now have (OQ-43), so that a stale `src/data/enhancementLevels.js` doesn't silently skew the buy-order the same way a stale Workshop table would.
OQ-43 scoped this out deliberately rather than leaving it implicit: Enhancement data has no verify script today, only `extract:enhancement-data` (a full re-sync tool, not a lightweight spot-check), so extending the same treatment means writing a `verify:enhancement-costs` counterpart to `scripts/verify-workshop-costs.mjs` first, then wiring it into (or alongside) `.github/workflows/detect-drift.yml`.

### Depends on the above being mature

**OQ-8. Recommend a full workshop buy-out from lifetime coins**
As a player who doesn't want to enter every current level by hand, I want to enter my lifetime coins and coins spent on Labs and get a full recommended buy order simulated from zero, so that I can see the whole plan at once.
Offer two views of the same underlying purchase sequence: a granular step-by-step list (e.g. 100 Health, 100 Regen, 100 Health, ...) and a simplified rollup grouping consecutive/total purchases per upgrade (e.g. 5000 Health, 5000 Regen) — the simplified view should be a group-by of the granular sequence, not a separate calculation, so the two can't drift out of sync. OQ-2, OQ-4, OQ-5, OQ-6, and OQ-7 are all done now, so this is fully unblocked on the buy-order side.

### Anytime — no dependencies

**OQ-9. Verify the UI on a real mobile device**
As a player who checks this tool while actually playing on my phone, I want the phone-mimicking layout to work correctly on a real touch device, so that it's usable in the situation it's designed for.
Only checked in a desktop browser at a fixed width so far.

### Project health and workflow

Not player-facing features, but they decide how safely and cheaply everything above can be built. OQ-40 and OQ-44, which closed the appearance gaps that removing the pre-merge visual-inspection gate opened, are resolved; see `Completed-Questions.md`.

**OQ-46. Walk the owner through a batch of changes, roughly every 10 PRs**
As the person this project belongs to, I want to be walked through what has actually changed after roughly every 10 merged PRs, so that dropping the per-PR human gate doesn't cost me the mental model of my own app.
Removing the pre-merge visual-inspection gate traded per-PR human attention for automated guards — the screenshot assertions from OQ-40 and the palette work in OQ-44 (both in `Completed-Questions.md`), plus the agent review gate from OQ-42 (also resolved, in `Completed-Questions.md`). Those guards are all *regression* detectors: they compare the app to what it was, and they pass when a change is self-consistent. None of them can tell the owner that the tool now does something he never pictured, or that ten small, individually-reasonable changes have added up to a different product. This story puts the human read back in at a tenth of the frequency — a batch walkthrough rather than a per-change gate. Three things it should cover: **UI changes**, shown rather than described (the baselines in `e2e/__screenshots__/` are the obvious raw material — a before/after of every baseline that moved across the batch); **functionality changes**, a short recap of what the tool does now that it didn't at the last checkpoint; and **docs changes**, what moved in `README.md`, `Project-Outline.md`, and the OQ files, including which stories were resolved.
**Explicitly not a gate.** It does not block merges and does not stop agents — same call as OQ-42's blocked-PR handling, and for the same reason: a review that halts all progress while it waits for a human stops being run. If the walkthrough finds something wrong, that becomes an ordinary OQ like anything else.
**Open questions:** what counts to 10 and where the count lives — merged-PR count since the last checkpoint is the intent, but something has to hold the marker and raise the flag (a scheduled workflow counting merges since a tag, a pinned issue, or the `SessionStart` hook, which already counts `review-blocked` PRs and so has the machinery); what form the walkthrough actually takes (an issue with embedded before/after images, a generated page, or an interactive session that presents it and takes questions) — the images make a static artifact attractive, but "quick recap" implies something conversational; and whether "roughly 10" should instead be time-based, since 10 PRs could be a week or a month depending on how hard the project is being pushed.

**OQ-47. Check the review block rate once ~20 PRs have been gated**
As someone relying on the agent review gate (OQ-42), I want evidence that it is catching things rather than just adding latency, so that I keep paying for it on merit rather than on faith.
OQ-42 shipped with the instruction to check this after roughly 20 gated PRs. The tally so far is **9 verdicts across 5 PRs, 2 of them `fail`** — both real: a circuit breaker reimplemented without the exemption its own story had already mandated, which would have deadlocked the repository at five blocked PRs; and a PR body that still described the pre-fix version of its own change. So the original worry, that a zero block rate would mean the gate is latency rather than a gate, is already answered in the negative and this story is now about the *trend* rather than the existence of one.
**No instrumentation is needed.** Every verdict is recorded twice — as a `review/agent` commit status on the head SHA, and as a marker comment on the PR — so the rate is computable from the REST API at any time. Building a logger would add a thing to maintain for data that already exists.
**What to actually look at, beyond the raw ratio.** Reviewers have repeatedly found real problems and classified them as *observations* rather than failures: a tool named as the primary method that did not exist in the container, an undescribed rider in a diff. Those were right to surface and arguably right not to block, but `pass`/`fail` had no way to say so, which meant the verdict record understated what review catches. **That part is now settled:** `pass-with-observations` exists and maps to a `success` status, so the record distinguishes a clean pass from one that found something. The trend check should read that distinction rather than collapsing it.

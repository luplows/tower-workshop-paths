---
id: OQ-1
title: Confirm Workshop max levels against the live game
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want each Workshop upgrade's maximum level confirmed against the
real, current-patch game, so that the buy-order plans against a ceiling somebody
has actually seen rather than one inherited from a third party.

> **This story cannot be delivered by a spawned coder.** Its work is opening the
> game and reading 48 numbers off the screen. Everything automatable about OQ-1
> already shipped. See **Context**.

## Acceptance criteria

- [ ] **AC-1** — Every Workshop upgrade in `src/data/workshopLevels.js` has its
      maximum level checked against the live game, and the result recorded per
      upgrade in [`OQ-1-Checklist.md`](../OQ-1-Checklist.md) — confirmed, or the
      observed value where it differs.
- [ ] **AC-2** — The checklist records **when** the confirmation was made and
      against **which game version**, because the answer expires: a patch can
      raise a ceiling, and a confirmation with no date cannot be told from a
      stale one.
- [ ] **AC-3** — Any upgrade whose real maximum differs from the stored value is
      filed as its own story for correcting the data. This story records the
      observation; it does not change `src/data/workshopLevels.js`.
- [ ] **AC-4** — If any upgrade cannot be confirmed — not yet unlocked on the
      account doing the checking, for instance — that is recorded as such, with
      the reason, rather than left blank or assumed correct.

## Out of scope

- **Cost verification.** Per-level costs are covered: they come from mytower.app
  via `src/data/workshopLevels.js`, and `npm run verify:workshop-costs` plus
  `.github/workflows/detect-drift.yml` watch them for patch drift.
- **Correcting the data.** AC-3 files that separately, so a correction is
  reviewed as a data change rather than buried in a verification pass.
- **Enhancement maximums.** Workshop only.
- **Automating this.** The value here is specifically that it is *not* sourced
  from mytower.app — see **Context**.

## Constraints

- The confirmation must come from the game itself. Checking against mytower.app
  would restate the source the data already comes from, which is the gap this
  story exists to close.

## Context

Refined out of `Open-Questions.md` on 2026-09-19, reduced to the part that is
still genuinely open.

**Most of OQ-1 is resolved.** OQ-39's Phase 1 migration moved Workshop upgrade
costs to come directly from mytower.app rather than `tower-idle-toolkit` — the
source changed, rather than a cross-check being bolted on top. That fixed a
confirmed-wrong data point (Wall Health, OQ-38) and closed the old four-upgrade
cost-data gap entirely: every level `0..quantity-1` now has a real cost, with
nothing left reporting `unknownCost`.

**What remains is the max-level ceiling**, and the reason it cannot be automated
is worth stating precisely. mytower.app's own maximum matched this project's
existing value for all 48 upgrades — a byte-identical structural snapshot. That
is reassuring, but it is agreement between two copies of the same lineage, not
independent confirmation. Re-running `verify-workshop-costs.mjs` checks for
*drift* from mytower.app's live data; it cannot cross-validate data that came
from mytower.app in the first place. Only the game can.

- [`OQ-1-Checklist.md`](../OQ-1-Checklist.md) — the tracking file AC-1 fills in,
  now useful primarily for this remaining task
- `src/data/workshopLevels.js` — the stored maximums under check
- `scripts/verify-workshop-costs.mjs` — what already covers costs, and why it
  cannot cover this
- OQ-38, OQ-39, OQ-43, in `Completed-Questions.md` — the resolved portions

## Open questions

*(none)*

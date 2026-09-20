---
id: OQ-8
title: Recommend a full Workshop buy-out simulated from zero
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player who does not want to enter every current level by hand, I want to
enter my lifetime coins and the coins I have spent on Labs and get a full
recommended buy order simulated from zero, so that I can see the whole plan at
once.

## Acceptance criteria

- [ ] **AC-1** — The tool accepts a lifetime-coins figure and a coins-spent-on-Labs
      figure, and computes the coin budget available to the Workshop from them.
- [ ] **AC-2** — From that budget it produces a purchase sequence simulated from
      level zero, using the existing buy-order scoring rather than a second
      algorithm.
- [ ] **AC-3** — Two views of that sequence are presented: a **granular** list of
      individual purchases in order, and a **simplified rollup** grouping
      consecutive purchases of the same upgrade.
- [ ] **AC-4** — **The rollup is derived from the granular sequence, not computed
      separately.** A test asserts this by construction — expanding the rollup
      reproduces the granular sequence exactly — so the two cannot drift apart.
      This is the one implementation decision the story fixes, because two
      independent calculations of the same plan is the failure it exists to avoid.
- [ ] **AC-5** — The sequence stops when the budget is exhausted, and the interface
      states what the budget was and how much of it the plan spends.
- [ ] **AC-6** — An input that cannot produce a plan — coins spent on Labs
      exceeding lifetime coins, a non-numeric or negative entry — is reported
      clearly rather than producing an empty or misleading plan.
- [ ] **AC-7** — Unit tests cover the budget computation, the sequence generation
      and the rollup derivation. A Playwright test covers the real user flow:
      entering both figures and reading a plan out of both views.
- [ ] **AC-8** — This does not change the existing per-upgrade entry flow. A player
      who enters current levels by hand gets exactly what they get today, and a
      test asserts the existing flow still produces its current result.

## Out of scope

- **Changing the buy-order scoring algorithm.** AC-2 consumes it as it stands. If
  simulating from zero exposes a defect in it, report that rather than fixing it
  here.
- **Enhancement buy-out.** Workshop only.
- **Persisting the two new inputs** beyond whatever the existing `localStorage`
  pattern gives for free.
- **Importing lifetime coins from a save file.** That is OQ-53's territory.

## Constraints

*(none — the existing React + Vite app, client-only, per `Project-Outline.md`.)*

## Context

Refined out of `Open-Questions.md` on 2026-09-19. The entry recorded that OQ-2,
OQ-4, OQ-5, OQ-6 and OQ-7 are all complete, so this is unblocked on the buy-order
side; that is why `depends_on` is empty.

The two-views requirement is quoted almost verbatim from the original entry, which
gave the example of a granular list reading *"100 Health, 100 Regen, 100 Health, …"*
against a rollup reading *"5000 Health, 5000 Regen"*. AC-4 is the part worth
getting right: the entry was explicit that the simplified view "should be a
group-by of the granular sequence, not a separate calculation, so the two can't
drift out of sync."

- `Project-Outline.md` — goals, scope, and the buy-order definitions
- `src/data/workshopLevels.js` — per-level costs the simulation consumes
- `e2e/` — the Playwright suite AC-7 extends
- OQ-2, OQ-4, OQ-5, OQ-6, OQ-7, in `Completed-Questions.md` — the scoring work
  this builds on

## Open questions

*(none)*

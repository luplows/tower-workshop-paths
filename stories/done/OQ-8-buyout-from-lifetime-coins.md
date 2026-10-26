---
id: OQ-8
title: Recommend a full buy-out of Workshop upgrades and Enhancements, simulated from zero
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: "ci-setup-failed: CI failed in setup step(s) Setup: Playwright browsers, outside the repository; a coder retry cannot fix it"
---

## Intent

As a player who does not want to enter every current level by hand, I want to
enter my lifetime coins and the coins I have spent on Labs and get a full
recommended buy order simulated from zero, so that I can see the whole plan at
once: every purchase in order, and a short summary of where the coins go.

## Acceptance criteria

- [x] **AC-1** — The tool accepts a lifetime-coins figure and a coins-spent-on-Labs
      figure, and computes the coin budget from them: lifetime coins less coins
      spent on Labs.
- [x] **AC-2** — From that budget it produces a purchase sequence simulated from
      level zero, covering Workshop upgrades, their unlock groups, the
      Workshop Enhancements Lab and Enhancements. Each purchase is chosen by
      the existing buy order, `getPrioritizedNextUpgrades` in
      `src/utils/cheapestNextUpgrades.js`, which this story does not change.
      The plan prices purchases with the Workshop and Enhancement discount-Lab
      levels the player has entered in the tool, and with none if none are
      entered.
- [x] **AC-3** — Each purchase in the plan is applied to the state the buy
      order reads (levels, unlocked groups, the Enhancements Lab) before the
      next one is chosen, so a gate the plan opens takes effect for the
      purchases after it. A unit test runs the plan with a budget larger than
      the cost of everything. It asserts that every upgrade listed under
      `WORKSHOP_CATEGORIES` and every Enhancement listed under
      `ENHANCEMENT_CATEGORIES` (each tree's `upgrades`) either reaches its max
      level in the plan, or is listed as unpriced (AC-6).
- [x] **AC-4** — Two views of the plan are presented:
      - a **granular** list of the purchases in order, each with what is
        bought, the levels it goes from and to, and its cost, from which every
        purchase in the plan can be reached. It need not show them all at once
        (Out of scope, "How the granular list is presented");
      - a **per-upgrade summary**, with one row per upgrade bought, keyed by
        the buy order's `source` and `name`, giving its level before its first
        purchase in the plan, its level after its last, how many purchases it
        took, and their total cost. Rows are in the order of each upgrade's
        first purchase in the plan.
- [x] **AC-5** — **The summary is computed from the granular list alone**, by a
      function that takes the list and nothing else. A unit test asserts, for a
      plan with at least two upgrades bought more than once:
      - the summary's purchase counts add up to the granular list's length;
      - its total costs add up to the plan's total spend;
      - each row's levels equal the first and last granular entries for that
        upgrade.
- [x] **AC-6** — The plan ends in one of two ways, and the interface says
      which, with the budget, the amount spent and the amount left:
      - **the budget runs out**: the plan stops before the first recommended
        purchase that costs more than what is left;
      - **everything is bought**: nothing priceable is left to buy.

      Anything the buy order reports in `unknownCost` is listed as unpriced,
      in both cases.
- [x] **AC-7** — An input that cannot produce a plan is reported clearly, and
      no plan is shown: coins spent on Labs exceeding lifetime coins, or a
      non-numeric or negative entry.
- [x] **AC-8** — Unit tests cover the budget computation, the sequence
      generation, AC-3's full buy-out and the summary's derivation. A
      Playwright test covers the real user flow: entering both figures and
      reading a plan out of both views.
- [x] **AC-9** — This does not change the existing flows. A player who enters
      current levels by hand gets exactly what they get today on Input, Path and
      Labs, and the existing tests of those flows pass unmodified.

## Out of scope

- **Changing the buy-order scoring.** AC-2 consumes it as it stands. If
  simulating from zero exposes a defect in it, report that rather than fixing
  it here.
- **Reading or changing the player's entered levels.** The plan starts from
  zero, whatever is entered on Input, and writes nothing back. Only the
  discount Labs are read (AC-2).
- **Skipping an unaffordable purchase to buy a cheaper later one.** The plan
  follows the recommended order and stops at the first purchase it cannot pay
  for (AC-6).
- **Persisting the two new inputs** beyond what the existing
  `useLocalStorageState` pattern gives for free.
- **Importing lifetime coins from a save file.** That is OQ-53's territory.
- **Where the buy-out sits in the app.** The coder chooses, within AC-9.
- **How the granular list is presented.** A full buy-out is 9281 purchases
  (Context). Paging, collapsing, a cap with a way to show the rest, or a
  virtualised list are the coder's choice, as long as every purchase in the
  plan can be reached in the interface, as AC-4 requires. The PR body names
  the choice. Left to the coder on 2026-10-12, after #255's review.

## Constraints

*(none — the existing React + Vite app, client-only, per `Project-Outline.md`.)*

## Context

Refined out of `Open-Questions.md` on 2026-09-19. The entry recorded that OQ-2,
OQ-4, OQ-5, OQ-6 and OQ-7 are all complete, so this is unblocked on the buy-order
side; that is why `depends_on` is empty.

**Refined again on 2026-10-12, after #252.** The first dispatch (#252, closed
unmerged, its branch deleted at the owner's request) stopped after three
blocking verdicts. Its reviews found two defects in the story, not in the code:

- The old AC-2 required the existing combined buy order, while Out of scope
  said "Enhancement buy-out. Workshop only." The combined order spends almost
  everything on Enhancements: in #252's simulation, more than 99.99% of a full
  buy-out's coins. The owner chose Workshop and Enhancements together, so the
  title and AC-2 now say so.
- The old AC-3's rollup grouped *consecutive* purchases of the same upgrade.
  The buy order interleaves upgrades, so that took a full buy-out from 9281
  entries to 8967. The owner chose a per-upgrade summary instead (AC-4). It
  cannot be expanded back into the sequence, so the old AC-4's "expanding the
  rollup reproduces the granular sequence" becomes AC-5's sums.

Also from #252's reviews: run once from zero, `getPrioritizedNextUpgrades`
reached only 6 of the 48 Workshop upgrades. It builds its candidates from the
gates in its input (`buildCandidateCursors`), and a purchase it ranks does not
open a gate within the same call, hence AC-3. #252's later head reported a full
buy-out of 9281 purchases, so the granular list is long.

The owner chose, on 2026-10-12, to price with the entered discount Labs (AC-2),
and to leave the placement to the coder.

The original entry gave the example of a granular list reading *"100 Health,
100 Regen, 100 Health, …"* against a summary reading *"5000 Health, 5000
Regen"*, and said the simplified view "should be a group-by of the granular
sequence, not a separate calculation, so the two can't drift out of sync". AC-5
keeps that.

- `Project-Outline.md` — goals, scope, and the buy-order definitions
- `src/utils/cheapestNextUpgrades.js` — `getPrioritizedNextUpgrades`, and the
  row shape it returns (`name`, `source`, `currentLevel`, `nextLevel`,
  `levels`, `cost`)
- `src/App.jsx` — the sections
- `src/components/LabsInputs.jsx` (lines 48 and 56) — owns the `localStorage`
  keys `workshopDiscountLabs` and `enhancementDiscountLabs`.
  `src/components/UpgradePath.jsx` (lines 37–38) reads them with
  `useLocalStorageState`, the pattern AC-2's discount pricing follows.
  `src/App.jsx` names them only to clear them (lines 58–59).
- `src/data/workshopLevels.js`, `src/data/enhancementLevels.js` — the costs
- `e2e/` — the Playwright suite AC-8 extends
- OQ-2, OQ-4, OQ-5, OQ-6, OQ-7, in `Completed-Questions.md` — the scoring work
  this builds on

## Open questions

*(none)*

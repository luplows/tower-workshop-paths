---
id: OQ-145
title: Apply a Respec plan to the stored levels in one step, after confirming
tier: normal
kind: product
depends_on: [OQ-143]
model: sonnet
blocked: null
---

## Intent

As a player who has just respecced in the game by following the plan, I want
one button that sets the tool's levels to the plan's result, so that I don't
have to type every level back in to bring the tool up to date.

## Acceptance criteria

- [ ] **AC-1** — `simulateBuyOut` also returns the plan's end state:
      - the Workshop level of every upgrade;
      - the Enhancement level of every Enhancement;
      - the set of unlocked groups;

      after the last purchase. Absent means zero or not unlocked. A Vitest
      test checks that the end state equals the result of applying every
      purchase in order.
- [ ] **AC-2** — Once a plan is shown, the Respec view offers **Apply plan**.
      Pressing it opens a confirmation dialog, built as `HeaderMenu`'s "Clear
      all levels" confirmation is (an `alertdialog`, with confirm and cancel
      buttons). The dialog says that it replaces every Workshop level,
      Enhancement level and unlocked group, and that Labs are not changed.
- [ ] **AC-3** — Confirming writes the end state to `workshopLevels`,
      `enhancementLevels` and `workshopUnlockedGroups`, replacing what was
      stored.
      - A level the plan leaves at zero is stored as zero, even where it was
        higher before.
      - `enhancementLabLevel`, `workshopDiscountLabs`,
        `enhancementDiscountLabs` and the two Buy-out inputs are not changed.
      - Cancelling changes nothing.
- [ ] **AC-4** — After applying, Input and Buy order show the new levels
      without a reload. The view says the plan was applied.
- [ ] **AC-5** — Playwright:
      - seed levels;
      - plan, apply and confirm, then see Input show the plan's levels, with
        a seeded level the plan lowered now lower;
      - see the Labs unchanged;
      - a second run cancels instead, and sees nothing changed.

## Out of scope

- Undo. The confirmation is the guard.
- Applying part of a plan.
- Changing Labs, which a respec does not reset.

## Constraints

*(none)*

## Context

- The owner's request of 2026-10-26: a "buy plan button to catch up the
  values all at once". Confirmed the same day:
  - it overwrites all Workshop levels, Enhancement levels and unlocked
    groups, lowering where needed;
  - Labs are untouched;
  - it asks for confirmation first.
- `src/utils/buyOutPlan.js`, `simulateBuyOut` (line 44 at 75e723e), holds
  `workshopLevels`, `enhancementLevels` and `unlockedGroups` while it runs,
  and returns only `purchases`, `unpriced`, `budget`, `spent`, `remaining`
  and `endedBy`.
- `src/App.jsx`'s "Clear all levels" removes these keys and remounts the
  screens through `resetNonce`. That is one way to make AC-4's screens
  re-read storage.
- `src/components/HeaderMenu.jsx`: the confirmation dialog to match.
- Depends on OQ-143, which moves the plan into Path's Respec view.

## Open questions

*(none)*

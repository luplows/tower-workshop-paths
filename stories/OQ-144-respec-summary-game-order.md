---
id: OQ-144
title: Group the Respec summary by the game's tabs, in game order, and hide the purchase list
tier: normal
kind: product
depends_on: [OQ-143]
model: sonnet
blocked: null
---

## Intent

As a player working through a respec in the game, I want the plan's summary
laid out the way the game's Workshop is, tab by tab and top to bottom, so
that I can go down the list buying as I go. I don't need the full purchase
sequence on screen.

## Acceptance criteria

- [ ] **AC-1** — The summary is grouped under headings, in this order:
      - Workshop Attack, then Defense, then Utility;
      - then Enhancements Attack, Defense and Utility.

      A heading with no rows is left out.
- [ ] **AC-2** — Within each group, rows are in the game's order, as
      `WORKSHOP_CATEGORIES` and `ENHANCEMENT_CATEGORIES` list the upgrades.
      Purchase order no longer decides it. Unlock-group purchases come first
      in their Workshop tab's group, before its upgrades, in the order
      `WORKSHOP_UNLOCK_GROUPS` lists them.
- [ ] **AC-3** — The ordering is a function of the summary rows and the
      category data alone, tested in Vitest: a plan bought out of game order
      summarises in game order, and unlock rows come first in their tab, in
      the order `WORKSHOP_UNLOCK_GROUPS` lists them.
      `summarisePurchases` still derives the rows from the purchase list
      alone (OQ-8's AC-5).
- [ ] **AC-4** — The "Purchases in order" list, and its "Show more"
      paging, appear only when the page URL carries `?debug`. Without it,
      neither is rendered. The plan's ending (budget, spent, left, and how it
      ended) and the unpriced list show either way.
- [ ] **AC-5** — Playwright:
      - the summary's group headings appear in AC-1's order;
      - the purchase list is absent without `?debug` and present with it.

      `e2e/buy-out.spec.js`'s existing purchase-list assertions run with
      `?debug`, and so does the purchase-list assertion in
      `src/components/BuyOutPlan.test.jsx`.

      The summary's new layout changes OQ-143's Respec screenshots. The pull
      request deletes `respec-mobile.png` and `respec-mobile-dark.png` and says
      why, as `CLAUDE.md`'s Testing section requires, and
      `update-screenshots.yml` regenerates them.

## Out of scope

- Where the Respec view lives, and its styling (OQ-143).
- "Apply plan" (OQ-145).
- Changing what the summary rows contain.

## Constraints

*(none)*

## Context

- The owner's feedback of 2026-10-26:
  - "The summary should be grouped by workshop upgrade tab and then
    enhancement tab, to make it easy to go down the list when buying
    upgrades";
  - within each tab, the game's order: "it would be easiest to buy
    top->bottom";
  - the long purchase list "is not really useful to a user, but is useful to
    verify the expected path in testing … I don't need it on the screen";
  - a debug flag in the URL was chosen over removing the list or collapsing
    it.
- The owner's decision of 2026-11-04 on unlock rows: "At the beginning of the
  buyout summary by tab - you can't buy an upgrade for something that is not
  unlocked."
- This replaces part of `stories/done/OQ-8-buyout-from-lifetime-coins.md`'s
  AC-4: what the summary shows is no longer in first-purchase order, and the
  granular list is no longer shown by default. `summarisePurchases` itself keeps
  first-purchase order, so its tests in `src/utils/buyOutPlan.test.js` do not
  change. `src/components/BuyOutPlan.test.jsx` line 30 at 4d0b44a reads the
  purchase list, so that test needs `?debug`.
- `src/data/workshopUnlockGroups.js`: `WORKSHOP_UNLOCK_GROUPS`, keyed by category
  id, lists each tree's groups in the fixed order they unlock. An unlock row's
  `name` is its group's name, and its `categoryId` is the tree's.
- `src/utils/buyOutPlan.js`, `summarisePurchases` (line 104 at 75e723e): one
  row per upgrade, in the order first bought, each carrying `source`,
  `name` and `categoryId`.
- `src/data/workshopCategories.js` and `src/data/enhancementCategories.js`:
  the categories `attack`, `defense` and `utility`, in that order, each
  listing its upgrades in the game's order.
- Depends on OQ-143, which moves this component into Path.

## Open questions

*(none)*

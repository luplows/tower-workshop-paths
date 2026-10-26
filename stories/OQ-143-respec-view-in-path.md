---
id: OQ-143
title: Move the Buy-out Plan into Path as a Respec view, with the Enhancements Lab at its top
tier: normal
kind: product
depends_on: [OQ-142]
model: sonnet
blocked: null
---

## Intent

As a player about to respec my Workshop in the game, I want the Buy-out Plan
beside the buy order, styled like the rest of the tool, so that I can plan
where every Workshop coin goes, using the Labs I really have.

## Acceptance criteria

- [ ] **AC-1** — Path has two views, **Buy order** (today's list) and
      **Respec** (the Buy-out Plan), switched by a tab bar under the header.
      - The tab bar is a `tablist`, and each view is a `tabpanel`, as
        `AppSectionTabs` and `ModeTabBar` do it.
      - Buy order is the default, and the chosen view is remembered in
        `localStorage`.
      - Buy order is unchanged.
- [ ] **AC-2** — The Buy-out Plan is no longer on the Labs page. Labs shows
      only its Lab inputs.
- [ ] **AC-3** — The Respec view's first control is the **Enhancements Lab**,
      the same setting as on the Labs page: the same stored key,
      `enhancementLabLevel`, so changing it in either place changes both. The
      plan uses it as set.
      - With the Lab bought, Enhancements are part of the plan.
      - Without it, they are not, and the view says the Lab is needed for
        them.

      The plan never buys the Lab out of the Workshop budget, because a respec
      gives back Workshop coins, not Lab coins. Today `simulateBuyOut` starts
      the Lab at 0 and buys it (`source === 'lab'`).
- [ ] **AC-4** — Below the Lab, **Lifetime coins** and **Coins spent on
      Labs** sit together, under a line saying both are on the game's
      settings screen. The discount Labs are used as stored, as they are today.
- [ ] **AC-5** — The view uses the classes and colours the other screens
      already use:
      - its button is styled like Path's Buy button;
      - its rows are styled like the Path list's;
      - its headings are styled like the rest of the tool's;
      - its error text uses a theme colour from `index.css`, not the fixed
        `#b3261e`.

      `e2e/appearance.spec.js` gains two screenshots of the Respec view with
      a plan shown, `respec-mobile.png` in the light theme and
      `respec-mobile-dark.png` in the dark. CI's `update-screenshots.yml`
      creates their baselines.
- [ ] **AC-6** — Vitest covers AC-3's simulation: with the Lab at 0, no
      purchase has `source: 'lab'` and no Enhancement is bought. With it at 1
      and a budget large enough to buy everything, Enhancements are bought,
      and the Lab still is not.
- [ ] **AC-7** — Playwright:
      - `e2e/buy-out.spec.js` reaches the plan through Path → Respec, not
        Labs;
      - a test sets the Enhancements Lab in the Respec view and sees it set
        on the Labs page;
      - a test reloads and sees Respec still chosen.

      The Path screenshot baselines (`path-desktop.png`, `path-mobile.png`,
      `path-desktop-dark.png`) change because of the new tab bar. The pull
      request deletes them and says why, as `CLAUDE.md`'s Testing section
      requires, and `update-screenshots.yml` regenerates them.

## Out of scope

- The summary's order and the purchase list (OQ-144), and an "Apply plan"
  button (OQ-145).
- Simulating from the player's current levels. The Respec view always starts
  the Workshop from zero, because that is what a respec does (owner,
  2026-10-26).
- The header (a separate draft, if the owner wants one).

## Constraints

*(none)*

## Context

- The owner's feedback of 2026-10-26 on the Buy-out Plan (OQ-8), and the
  answers that followed:
  - it should not live on Labs, whose page is too long;
  - it belongs as a view inside Path;
  - it is mostly a respec simulator, since the game lets the player
    reallocate every coin spent in the Workshop;
  - Lab levels should be respected, and the Enhancements Lab surfaced at its
    top;
  - lifetime coins and Lab spend both come from the game's settings screen;
  - the other screens share styling, and this one should too.

  The view names "Buy order" and "Respec" are "good enough for now".
- `src/utils/buyOutPlan.js`, `simulateBuyOut`, at 75e723e:
  `let enhancementLabLevel = 0`, and `if (next.source === 'lab')
  enhancementLabLevel = 1` after buying it.
- `src/App.jsx` at 75e723e: the Labs panel renders `<LabsInputs>` then
  `<BuyOutPlan>` (line 111). The Path panel renders `<UpgradePath>`.
  `src/components/BuyOutPlan.css`: the fixed `#b3261e`, and a button with no
  class of its own.
- `e2e/appearance.spec.js` takes `path-${name}.png` (line 84) and
  `path-desktop-dark.png` (line 130). This is the first change to a captured
  screen since OQ-138. That story pushes one empty commit after
  `update-screenshots.yml` commits the new baselines, so CI re-runs against
  them.
- OQ-141 classifies every `localStorage` key, so AC-1's new key is classified
  there as an interface setting, if OQ-141 has landed first.
- Depends on OQ-142 because both change `BuyOutPlan.jsx`'s inputs.

## Open questions

*(none)*

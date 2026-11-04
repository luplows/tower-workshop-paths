---
id: OQ-147
title: Stop the Workshop drift check missing rows when mytower's table runs past the purchase cap
tier: fix
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As the owner, I want the weekly Workshop cost check to find every level it
looks for, so that it can pass again, and a real failure stands out. It has
failed every week since 2026-10-12 on rows it could not find, not on any
difference in cost.

## Acceptance criteria

The script is `scripts/verify-workshop-costs.mjs`, and its tests are in
`scripts/verify-workshop-costs.test.mjs`. Neither the tests nor the module's
import reach the network.

- [x] **AC-1** — The script exports `levelFromCellText(text)`, which returns the
      level number at the end of a level cell's text, or `null` if the text does
      not end in a number. `'3000'` gives `3000`, `'Legendary8000'` gives `8000`
      and `'Ancestral10000'` gives `10000`. `''`, `'—'` and `'Ancestral'` give
      `null`.
- [x] **AC-2** — The script exports `scrollTopForLevel(level, scrollHeight,
      lastLevel)`, which returns `level * (scrollHeight / (lastLevel + 1))`. A
      test checks it with the values measured on Damage's table:
      `scrollTopForLevel(3000, 320160, 10000)` is within 1 of `96038`.
- [x] **AC-3** — Once for each upgrade's page, before reading any cost, the
      script scrolls the grid to its bottom and passes the last level cell's text
      through `levelFromCellText`. `readMytowerCost` works out where to scroll
      with `scrollTopForLevel`, given that last level and not the `M` value from
      `readMaxLevelOnPage`.
- [x] **AC-4** — If AC-3 cannot read the last level, the script records an
      `ERROR` result for that upgrade with the detail `could not read table end`,
      reads no costs for it, and moves on to the next upgrade.
      `exitCodeForResults` does not change, so this exits 1, as `could not read
      page` does.
- [x] **AC-5** — The `M` value stays the purchase cap, and rows past it stay
      unchecked. The `MAX LEVEL DRIFT` comparison still compares `M` with the
      upgrade's `quantity`, `checklistLevels` still takes `quantity`, and a table
      whose last level is above `M` produces no result of its own.
- [x] **AC-6** — The comment above `readMytowerCost` says that a table's rows can
      run past `M`, with no coin cost shown on those rows, and that `M` is the
      purchase cap. It no longer says that only about 17 rows exist in the DOM.
- [x] **AC-7** — The script still makes one navigation per upgrade: this story
      adds no `page.goto`. The pull request's Verification gives the result lines
      of one run of `npm run verify:workshop-costs -- Damage Health "Health
      Regen"`, each `MATCH` or `NEAR (rounding)`, and that command's exit code,
      `0`. The script is not run against the site for all upgrades.

## Out of scope

- **Adding levels past 6000 to the tool, or reporting them as drift.** The rows
  past the cap have no coin cost, so they are not drift (the owner, 2026-11-03).
- **Accepting a label on a level the check looks up.** `readMytowerCost` still
  matches the level cell exactly. On Damage, the rows at 3000 and 6000 have no
  label. If a checked row gains one, the check reports `row not found`, and
  that is a story of its own.
- **`extractFullCostCurve` in `scripts/lib/mytower-scrape.mjs`.** It works out
  its row height from `M` in the same way, and skips a labelled row, because
  `parseInt` gives `NaN`. Nobody has run it against the longer table. It reports
  any level it did not capture in `missing`, so a problem shows up when someone
  next re-extracts. File it separately if that happens.
- **The cadence of the check, and what a run that could not complete reports.**
  Those are OQ-45's Open questions and `detect-drift.yml`'s header.

## Constraints

None.

## Context

- Runs on `main` that failed like this: 38287239809 (2026-10-12), 39279172556
  (2026-10-19), 40346809122 (2026-10-26) and 41499730957 (2026-11-02). The last
  pass was 37346171748 (2026-10-05). In all four logs, the same six checks fail
  on both attempts with `row not found`: levels 2999 and 5999 of Damage, Health
  and Health Regen. Those are the three upgrades with a `quantity` of 6000 in
  `src/data/workshopUpgradeList.js`. The other 137 checks are `MATCH` or
  `NEAR (rounding)`.
- Measured by loading Damage's page twice on 2026-11-03. Health and Health
  Regen were not loaded, and AC-7's run covers them.
  - The page shows `M 6000`, and the table's last level cell reads
    `Ancestral10000`. The `scrollHeight` is about 320160.
  - `readMytowerCost` today divides by `M + 1`. Asking for level 3000 landed on
    rows 4991 to 5026, and level 6000 on rows 9980 to 10000.
  - Dividing by `10000 + 1` instead, level 3000 landed on rows 2991 to 3026,
    and level 6000 on rows 5993 to 6028.
  - Costs read that way: level 3000 shows `276.51M`, and level 6000 shows
    `5.10T`. Our indices 2999 and 5999 format as `276.51M` and `5.1T`. `classify`
    gives those `MATCH` and `NEAR (rounding)`.
  - Rows 6001, 7999, 8000 and 10000 show `—` for the coin cost. Row 8000 reads
    `Legendary8000`.
- From the owner, 2026-11-03: the purchase cap is still 6000. A module lets
  in-game values reach 10000 through free upgrades, and those levels have no coin
  cost a player can pay. `Project-Outline.md`, "Inputs", records this.
- `.github/workflows/detect-drift.yml` — runs the script weekly. Exit 1 gets one
  retry and files no issue, so these failures showed only as failed runs, through
  GitHub's failure notification (the header, lines 25-29 at 3936389).
- OQ-43, in `Completed-Questions.md` — why the check exists.

## Open questions

*(none)*

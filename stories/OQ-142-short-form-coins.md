---
id: OQ-142
title: Accept short-form coin amounts, like 1.18q, in the Buy-out Plan's inputs
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want to type coin amounts the way the game shows them, like
`1.18q` or `66.5T`, so that entering numbers this large is quick and I can
copy them straight from the game's settings screen.

## Acceptance criteria

- [ ] **AC-1** — A new `parseCoins(text)` in `src/utils/` reads a coin
      amount from a number, optionally followed by one of `formatCoins.js`'s
      suffixes. `1.18q` is `1.18 × 10^15` and `66.5T` is `66.5 × 10^12`.
      - Suffixes are case-sensitive, as the game uses them: `q` is
        quadrillion and `Q` quintillion, `s` sextillion and `S` septillion.
      - Any other letter, including `K`, is rejected.
      - Plain numbers are still accepted, as `Number()` reads them today.
      - Leading and trailing spaces are ignored.
- [ ] **AC-2** — `parseCoins` takes its suffixes and their values from the
      same table `formatCoins` uses, exported from `formatCoins.js`, so the
      two cannot drift apart. A test checks that
      `parseCoins(formatCoins(x))` returns `x`, for one value in each tier,
      to `formatCoins`'s two-decimal truncation.
- [ ] **AC-3** — `computeBuyOutBudget` reads both inputs with `parseCoins`.
      An amount it rejects gives an error naming the input and listing the
      accepted suffixes, in place of today's "must be a number". The other
      errors (empty, negative, Lab spend above lifetime coins) do not change.
- [ ] **AC-4** — Each input stores the text exactly as typed, as it does today
      (`buyOutLifetimeCoins` and `buyOutLabCoinsSpent`), so `1.18q` is shown
      as `1.18q` on reload.
- [ ] **AC-5** — Vitest tests cover AC-1 to AC-3, including:
      - `q` against `Q`;
      - a rejected `K`;
      - a plain number;
      - a decimal with each suffix;
      - spaces around the amount.
- [ ] **AC-6** — A Playwright test in `e2e/buy-out.spec.js` enters `1.18q`
      and `66.5T`, plans, and sees `Budget 1.11q`, which is
      `1.18q − 66.5T = 1.1135 × 10^15` as `formatCoins` shows it.

## Out of scope

- Moving the Buy-out Plan, its styling, or its summary. Those are in the
  Path-view story the owner described on 2026-10-26.
- Level inputs, which take whole levels, not coin amounts.
- Commas or other digit grouping in the input.

## Constraints

*(none)*

## Context

- The owner's feedback of 2026-10-26 on the Buy-out Plan (OQ-8): "Input
  should be able to be short form (1.18q lifetime coins, 66.5T lab spend,
  etc). The numbers get so large in this game that it really does save time
  and is more clear." Suffixes must be case-sensitive, as the game uses them.
  Plain numbers stay accepted (Session A's default, not contradicted).
- The player reads both figures from the game's settings screen (owner,
  2026-10-26).
- `src/utils/buyOutPlan.js`, `computeBuyOutBudget` (line 15 at 69db298):
  its `parse` uses `Number(text)`, so `1.18q` is rejected today as "must be
  a number".
- `src/utils/formatCoins.js`: `TIERS`, not yet exported, holds `k`, `M`, `B`,
  `T`, `q`, `Q`, `s`, `S` and `O`, from `1e3` to `1e27`. `formatCoins`
  truncates to two decimals.
- `e2e/buy-out.spec.js`: the existing flow enters `1500000` and `500000` and
  expects `Budget 1M coins`. Those tests keep passing.
- OQ-141 (#266) carries these inputs as strings in share links, so a typed `1.18q`
  travels as typed.

## Open questions

*(none)*

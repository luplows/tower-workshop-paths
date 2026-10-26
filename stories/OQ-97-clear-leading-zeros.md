---
id: OQ-97
title: Select a level input's contents on focus, and never show a leading zero
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want tapping a level input to let me type over what is there,
and to see exactly the number that is stored, never `05`, so that entering
levels is quick and what I see is what is stored.

## Acceptance criteria

- [ ] **AC-1** — Focusing a level input selects its whole contents, so the
      next digit typed replaces them. Clicking into an input showing `123`
      and typing `7` leaves it showing `7`.
- [ ] **AC-2** — A level input never shows leading zeros. With the caret
      placed after an existing `0` (focus, then `End`), typing `5` leaves it
      showing `5`, not `05`, and the stored level is `5`.
- [ ] **AC-3** — Emptying a level input while it has focus leaves it showing
      blank, not `0`, and stores `0` at once, as `clampLevel('')` does today.
      When the input then loses focus, it shows `0`.
- [ ] **AC-4** — A value above the upgrade's max is clamped, both stored
      and shown: typing `7000` into Damage (max 6000) stores `6000` and
      shows `6000`.
- [ ] **AC-5** — Playwright tests in `e2e/workshop-inputs.spec.js` cover
      AC-1 to AC-4. Each asserts both the input's displayed value
      (`inputValue()`) and the stored level, read from the `workshopLevels`
      key in `localStorage`.

## Out of scope

- Changing `clampLevel` itself.
- `BuyOutPlan.jsx`'s two inputs (Lifetime coins, Coins spent on Labs). They
  are `type="text"` and store the raw string, so they always show what was
  typed.
- The sticky highlight on tapped buttons, which is OQ-139.

## Constraints

*(none)*

## Context

- `src/components/UpgradeLevelInput.jsx` holds the level input. It is a
  controlled `<input type="number">` with `value={level}`, and its
  `onChange` stores `clampLevel(event.target.value, upgrade.quantity)`.
  `LabsInputs.jsx` and `WorkshopCategoryPanel.jsx` both render it, so a fix
  there reaches every level input. At b844534 the app's only other
  `<input>`s are BuyOutPlan's two (`git grep -n '<input' -- 'src/*.jsx'`).
- **The cause is confirmed.** Session A reproduced it on 2026-10-26 with a
  Playwright script against a dev server at b844534, in Chromium:
  - Damage's input starts at `0`.
  - Typing `5` after the `0` shows `05`, while `workshopLevels` stores
    `{"Damage":5}`.
  - The input still shows `05` after it loses focus.
  - Clearing the input shows `0` at once.

  The new value, 5, equals `"05"` as a number, so React leaves the displayed
  text alone. Showing the right text means the input's displayed value has
  to be kept separately from the stored level, or written explicitly.
- Also seen on a phone, in OQ-9's real-device pass on 2026-10-26: an iPhone
  16 Pro, running Chrome 156.0.8078.54 (WebKit), against the live site built
  from 2d6e966. A typed level kept its leading zero. The owner had thought
  this was fixed on desktop, but nothing on main changes it:
  `git log origin/main -i --grep='leading zero'` finds only #164, which
  added this draft. So it is not specific to mobile.
- The owner's answers of 2026-10-26:
  - Select on focus: yes, because overwriting is the usual case.
  - An emptied input shows blank while editing, and `0` once editing ends.
  - Confirming the cause was left to Session A, as above.
- Storing `0` while the input is blank (AC-3) keeps today's stored value for
  an emptied input. It is Session A's choice, not the owner's.
- WebKit, and so iOS, is not covered by CI's Playwright, which runs
  Chromium. Selecting on focus is known to behave differently on iOS, so the
  owner rechecks AC-1 on the phone once this lands.
- Raised by the owner on 2026-09-28 as a draft.

## Open questions

*(none)*

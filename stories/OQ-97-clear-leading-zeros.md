---
id: OQ-97
title: Drop leading zeros when a level is typed into an input
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want typing a level into an input that shows `0` to give me
the number I typed, not a number with a leading zero, so that entering
levels is quick and what I see is what is stored.

## Acceptance criteria

*Barebones: to be refined in a planning session.*

- [ ] **AC-1** — Typing `5` into an input showing `0` leaves the input
      showing `5`, not `05`.
- [ ] **AC-2** — A Playwright test types into a level input and asserts the
      displayed value.

## Out of scope

- Changing how levels are clamped to their max (`clampLevel`).

## Constraints

*(none)*

## Context

- `src/components/UpgradeLevelInput.jsx`: a controlled
  `<input type="number">` with `value={level}`, whose `onChange` stores
  `clampLevel(event.target.value, upgrade.quantity)`.
- `src/utils/clampLevel.js`: `Number.parseInt(rawValue, 10)`, so `"05"` is
  stored as `5`. The stored value is right; what is shown is the question.
  A controlled number input can keep displaying `05` when the parsed value
  is unchanged. That is the likely cause, but it is not yet confirmed here.
- It is the app's only `<input>` (`grep -rn "<input" src --include=*.jsx`
  on 2026-09-28), so a fix there reaches every level input.
- Raised by the owner on 2026-09-28 as a draft.

## Open questions

1. Confirm the cause.
2. Should an input that shows `0` select its contents on focus, so typing
   replaces it? That would be an alternative, or an addition, to stripping
   the zero.
3. What should an emptied input show while the player is typing: blank, or
   `0` straight away?

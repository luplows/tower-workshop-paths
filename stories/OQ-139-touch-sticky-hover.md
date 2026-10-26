---
id: OQ-139
title: Stop a tapped button staying highlighted on a touch screen
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player using the tool on my phone, I want a button to look normal again
once I have tapped it, so that a highlight never marks a button I did not
just press, after the screen around it has changed.

## Acceptance criteria

- [ ] **AC-1** — Every `:hover` rule under `src/` applies only where the
      device can hover: it sits inside an `@media (hover: hover)` block. On a
      device that can hover, every control looks as it does today.
- [ ] **AC-2** — A Vitest test reads every `.css` file under `src/` and fails
      if any `:hover` selector is outside an `@media (hover: hover)` block.
      It names the file and the selector, so a `:hover` rule added later
      cannot bring the defect back unnoticed.
- [ ] **AC-3** — A Playwright test runs in a touch-emulating context
      (`hasTouch: true, isMobile: true`). It first asserts that
      `matchMedia('(hover: none)').matches` is true, so that it fails rather
      than passing vacuously if the emulation stops producing a touch device.
      On Path, it taps the first entry's Buy button, which buys at once with
      no confirmation, because no earlier row repeats that upgrade. It then
      asserts that the Buy button now in that position has the computed
      `background-color` of an unhovered Buy button.
- [ ] **AC-4** — No screenshot baseline in `e2e/__screenshots__/` changes.
      `e2e/appearance.spec.js` moves the pointer away before each shot, so
      none should, and a baseline that does change is a finding.

## Out of scope

- Leading zeros in a level input: that is OQ-97, also seen in OQ-9's pass.
- Focus outlines, and any change to keyboard behaviour. There are no
  `:focus` rules under `src/` today.
- Any other change to how a button looks on a device that can hover.

## Constraints

*(none)*

## Context

Found in OQ-9's real-device pass on 2026-10-26: an iPhone 16 Pro (6.3-inch,
402×874 CSS pixels by Apple's published specification, not measured),
running Chrome 156.0.8078.54, against the live site built from 2d6e966.
Pressing a button left it highlighted, even after the content around it had
changed. Chrome on iOS renders with WebKit, which applies `:hover` on a tap
and keeps it until the next tap elsewhere. CI's Playwright runs Chromium,
which is why the existing suite does not see it.

- The nine `:hover` rules on main, at 2d6e966
  (`grep -rn ':hover' src --include=*.css`). None sits inside an
  `@media (hover: hover)` block, and there are no `:focus` or `:active`
  rules:
  - `src/components/EnhancementInputs.css:37` — `.enhancement-lock__unlock`
  - `src/components/HeaderMenu.css:44` — `.header-menu__item`
  - `src/components/HeaderMenu.css:145` and `:155` — the "Clear all levels"
    confirmation's buttons
  - `src/components/UpgradePath.css:108` — `.upgrade-path__buy`
  - `src/components/UpgradePath.css:159`, `:169` and `:180` — the Buy
    confirmation's buttons
  - `src/components/WorkshopInputs.css:90` — `.category-panel__unlock`
- The Path list is the likely clearest case. Buying re-renders the list, so
  another entry's Buy button can take the place of the one just tapped.
  `handleBuyClick` in `src/components/UpgradePath.jsx` buys at once unless the
  same upgrade appears earlier in the list, and then it asks first.
- Under Playwright 1.63.0, a context with `hasTouch: true, isMobile: true`,
  or `devices['iPhone 13']`, reports `(hover: none)` and `(pointer: coarse)`.
  Session A checked this on 2026-10-26 with a throwaway script, so AC-3's
  emulation does produce a non-hovering device.
- `e2e/appearance.spec.js`, `settle()` — already moves the pointer off the
  page before a screenshot, for the same reason.

## Open questions

1. Should a tapped button show brief pressed feedback instead, through an
   `:active` style, or no feedback at all? If `:active`, AC-1 to AC-3 gain a
   criterion for it, and AC-3 has to tell a held press from a finished one.

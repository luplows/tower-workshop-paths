---
id: OQ-139
title: Show a button pressed while it is held on a touch screen, not highlighted after
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player using the tool on my phone, I want a button to look pressed while
I hold it and normal again once I let go, so that I can see my tap register,
and a highlight never marks a button I did not just press, after the screen
around it has changed.

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
      With the app loaded, it walks `document.styleSheets`, descending into
      `@media` rules. It asserts that no rule whose selector contains
      `:hover` applies: each must sit inside an `@media` rule whose
      `conditionText` does not match. It names any that do. On main at
      c48dadd, all nine of today's `:hover` rules apply, so it fails there.
- [ ] **AC-4** — No screenshot baseline in `e2e/__screenshots__/` changes.
      `e2e/appearance.spec.js` moves the pointer away before each shot, so
      none should, and a baseline that does change is a finding.
- [ ] **AC-5** — Every selector that has a `:hover` rule also has an
      `:active` rule, outside any `@media (hover: …)` block, with the same
      declarations as its `:hover` rule. So a press shows the hover look on
      every device, but only while the button is held.
- [ ] **AC-6** — AC-2's Vitest test also fails if a selector with a `:hover`
      rule has no matching `:active` rule, or if the two rules'
      declarations differ, and names the selector.
- [ ] **AC-7** — `src/main.jsx` adds one passive, empty `touchstart`
      listener on `document`, with a comment saying it is there so that iOS
      WebKit applies `:active` on a tap.

## Out of scope

- Leading zeros in a level input: that is OQ-97, also seen in OQ-9's pass.
- Focus outlines, and any change to keyboard behaviour. There are no
  `:focus` rules under `src/` today.
- Any other change to how a button looks on a device that can hover.
- A Playwright test of `:active`. Chromium in Playwright gives no reliable
  way to observe it (see Context), so AC-6 guards it statically, and the
  owner rechecks pressed feedback on the phone once this lands.

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
- Why AC-3 checks the stylesheets rather than a tap. Review of #261 doubted
  that its first wording, which tapped a Buy button, could fail on main.
  Session A's probes on 2026-10-26, under Playwright 1.63.0 with
  `hasTouch: true, isMobile: true`, bore that out:
  - A tap does leave an unguarded `:hover` on the element that was tapped.
  - An element that replaces the tapped one in the same spot is not
    hovered, which is unlike WebKit.
  - Path's rows are keyed by `${entry.source}-${entry.name}-${entry.currentLevel}`,
    so a purchase replaces the Buy button.
  - The menu item, the dialogs' buttons and the Enhancement lock's Unlock
    button all unmount when tapped. The category Unlock button
    (`WorkshopCategoryPanel.jsx`) has no `key`, so React may keep the same
    element when the next group becomes purchasable. That case was not
    probed, and it depends on the levels entered.

  So a tap-based test would rest on that one state-dependent case. The
  stylesheet walk does not: run against a dev server at c48dadd, it listed all
  nine rules as applying.
- Under Playwright 1.63.0, a context with `hasTouch: true, isMobile: true`,
  or `devices['iPhone 13']`, reports `(hover: none)` and `(pointer: coarse)`.
  Session A checked this on 2026-10-26 with a throwaway script, so AC-3's
  emulation does produce a non-hovering device.
- The owner's recheck on the phone, once this lands, is the only test of the
  tapped-then-replaced case itself.
- `e2e/appearance.spec.js`, `settle()` — already moves the pointer off the
  page before a screenshot, for the same reason.
- Pressed feedback (AC-5 to AC-7) is the owner's answer of 2026-10-26: a
  tapped button should show feedback while it is pressed.
- AC-7 rests on WebKit's long-standing behaviour of not applying `:active`
  on iOS unless a `touchstart` listener is registered. This is not verified
  here: Session A has no iOS device, and the owner's recheck is the test.
- Why there is no Playwright test of `:active`: Session A probed it on
  2026-10-26 with Playwright 1.63.0, and every route failed.
  - In a context with `hasTouch: true, isMobile: true`, a CDP
    `Input.dispatchTouchEvent` `touchStart` did not apply `:active`, even
    after 300 ms.
  - CDP `Emulation.setEmulatedMedia` with `hover: none` left
    `matchMedia('(hover: none)')` false.
  - With a mouse, the `:hover` look shows anyway.

## Open questions

*(none)*

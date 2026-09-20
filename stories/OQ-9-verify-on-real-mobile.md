---
id: OQ-9
title: Verify the UI on a real mobile device
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player who checks this tool while actually playing on my phone, I want the
phone-mimicking layout to work on a real touch device, so that it is usable in
the situation it is designed for.

> **This story cannot be delivered by a spawned coder.** Its work is holding a
> phone. An emulated viewport is what has already been checked, and re-checking
> it in an emulator would answer a question nobody asked. See **Context**.

## Acceptance criteria

- [ ] **AC-1** — Every screen the tool has is opened on a real touch device and
      the result recorded per screen: usable, or what specifically was wrong.
- [ ] **AC-2** — The record names the device, its screen size, the browser and
      the date, because "works on mobile" without those is not reproducible and
      expires silently.
- [ ] **AC-3** — Touch-specific behaviour is exercised rather than assumed:
      every control is reachable and operable by tapping, scrolling works within
      any scrollable region, and nothing depends on hover to be discoverable.
      Hover is the failure an emulated viewport driven by a mouse cannot find.
- [ ] **AC-4** — Each defect found becomes its own story in `stories/`, with the
      device details from AC-2 attached. This story observes; it does not fix.
- [ ] **AC-5** — If the pass finds nothing, that is recorded as a dated result
      too. A verification with no written outcome is indistinguishable from one
      nobody ran.

## Out of scope

- **Fixing anything found.** AC-4 files those separately, so a layout fix is
  reviewed as a change rather than as a side-effect of a verification pass.
- **Adding mobile emulation to the Playwright suite.** `e2e/appearance.spec.js`
  already runs mobile-width appearance assertions, and more emulation does not
  answer this story's question.
- **Native app packaging, or any change to the phone-mimicking layout's design.**

## Constraints

- The check must be on physical hardware. The gap this story closes is precisely
  the one an emulator leaves.

## Context

Refined out of `Open-Questions.md` on 2026-09-19. The original entry recorded the
whole of the state: *"Only checked in a desktop browser at a fixed width so
far."*

The app is a phone-mimicking layout for a mobile game, so the target situation is
a player holding a phone while playing. Emulated mobile viewports are already
covered — `e2e/appearance.spec.js` asserts mobile-width screenshots on a CI
runner — which is what makes the remaining gap specifically about touch,
real-device rendering, and anything that only shows up at true pixel density or
under a real browser chrome.

- `e2e/appearance.spec.js` and `e2e/__screenshots__/` — the emulated coverage
  that already exists, and the reason AC-3 is about touch rather than layout
- `Project-Outline.md` — the scope statement describing the intended use

## Open questions

*(none)*

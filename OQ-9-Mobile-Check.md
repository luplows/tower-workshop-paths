# OQ-9 record: the UI on a real mobile device

The result of [OQ-9](stories/done/OQ-9-verify-on-real-mobile.md)'s pass on
physical hardware. The owner ran it, and Session A recorded it from the
owner's reports.

## Device (AC-2)

| | |
|---|---|
| Date | 2026-10-26 |
| Device | iPhone 16 Pro |
| Screen | 6.3-inch, 402×874 CSS pixels: Apple's published specification, not measured |
| Browser | Chrome 156.0.8078.54 for iOS, which renders with WebKit |
| Site | The live site, <https://luplows.github.io/tower-workshop-paths/>, deployed from 2d6e966 |

This result is for that build. Screens added since then are not covered. The
buy-out plan from OQ-8, #260, had not landed. Since b844534 it sits on the Labs
tab, below the Labs inputs (`src/App.jsx:111` at a743b37), and its two text
inputs have not been checked on a real device. The owner checks them on the
phone together with the rechecks OQ-139 and OQ-97 ask for once they land.

## Per screen (AC-1, AC-3)

| Screen | What was exercised | Result |
|---|---|---|
| Header, on every screen | Input, Path and Labs tabs; the ⋯ menu; Auto, Light and Dark theme; "Clear all levels", opened and cancelled | Usable |
| Input → Upgrade | Upgrade and Enhance tabs; Attack, Defense and Utility tabs; typing levels with the number keypad; the max cap; scrolling under the sticky header | Usable |
| Input → Upgrade, unlock rows | The next-to-unlock row's Unlock button | Usable |
| Input → Enhance | The lock screen or the tree tabs, and level inputs | Usable |
| Labs | Discount Lab levels, the Workshop Enhancements unlock, and the Enhancement discount Labs | Usable |
| Path | Scrolling; Buy; the Buy-all confirmation, and cancelling it | Usable |

The two defects below were reported for buttons and level inputs in general,
not screen by screen. Each comes from code that several screens use: the
`:hover` rules in four components' CSS, and the one level input component.

Touch (AC-3): every control could be reached and tapped without zooming,
scrolling worked, and nothing depended on hover to be found.

## Defects (AC-4)

- **A tapped button stays highlighted**, even after the content around it
  changes. New story
  [OQ-139](stories/OQ-139-touch-sticky-hover.md): a draft when this was
  written, and made ready in #261.
- **A typed level keeps its leading zero.** This was already
  [OQ-97](stories/OQ-97-clear-leading-zeros.md), whose Context records this
  sighting. It was a draft when this was written, and #261 refined it to
  ready. It is not specific to mobile.

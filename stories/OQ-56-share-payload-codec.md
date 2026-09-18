---
id: OQ-56
title: Encode tower levels into a shareable URL payload
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
mechanisms:
  - the share payload format and its codec
---

## Intent

As a player, I want my Workshop and Enhancement levels to compress into a short
URL-safe string, so that sharing my tower means pasting a link into a chat rather
than sending a file. The format is the expensive part to change later — a shared
link lives in someone else's message history long after the code moves on — so it
is versioned and tested before anything produces or consumes one.

## Acceptance criteria

- [ ] **AC-1** — `encodeTower(levels)` returns a string safe to place in a URL
      with no percent-encoding, and `decodeTower` returns a value deeply equal to
      the input for any valid input. The round trip is property-tested, not only
      example-tested.
- [ ] **AC-2** — The payload carries a format version. `decodeTower` rejects an
      unknown version with a distinguishable error rather than mis-parsing it, and
      a test pins the version-1 encoding of a fixed tower as a literal string, so
      a change to the format cannot pass silently.
- [ ] **AC-3** — A tower with every Workshop and Enhancement level at maximum
      encodes to a payload that keeps the complete share URL at or under 2,000
      characters. The test asserts this against the real item set, so it fails if
      the item set later grows past the budget.
- [ ] **AC-4** — `decodeTower` rejects a truncated, corrupted, or non-payload
      string with an error and never returns a partially populated tower.
- [ ] **AC-5** — A payload always carries a complete level set, including levels
      at zero. A payload missing any known level is rejected under AC-4 rather
      than defaulted, so "absent" is never a state the decoder interprets and the
      format cannot inherit the ambiguity OQ-53 is still resolving.

## Out of scope

- Producing a link, consuming one, or any UI at all. This story is the codec and
  its tests.
- Buy-order targets, settings, or any state beyond Workshop and Enhancement
  levels. AC-2's version field is what makes adding them cheap later; adding them
  now is not needed for the advice use case and would spend the URL budget.
- Any server-side storage or link shortening. Client-only per `Project-Outline.md`.

## Constraints

- No new runtime dependency for compression. If the budget in AC-3 cannot be met
  without one, stop and set `blocked:` rather than adding a library — bundle size
  on every page load is a decision for Session A.

## Context

- `src/state/` — where entered levels live today; the shape the codec consumes.
- `stories/OQ-53-import-player-info.md` — the other path that writes levels from
  outside. AC-5 deliberately sidesteps its open questions rather than waiting on
  them.
- The design doc names `fast-check` and "identical input gives identical output"
  as natural invariants for this domain. AC-1 is the first place that pays off.
- OQ-25 in `Completed-Questions.md` — the backlog entry this refines, with OQ-57
  and OQ-58. Its open question about how large a link gets is what AC-4's size
  budget answers.

## Open questions

*(none)*

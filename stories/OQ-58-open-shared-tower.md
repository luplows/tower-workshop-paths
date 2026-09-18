---
id: OQ-58
title: Open a shared tower read-only
tier: normal
kind: product
depends_on: [OQ-56]
model: sonnet
blocked: null
mechanisms:
  - share link detection and decoding on load
  - the read-only tower view
---

## Intent

As someone asked for advice, I want to open a link and see another player's tower
exactly as they have it, so that I can tell them what to buy next — without
touching my own data or being able to edit theirs by accident.

## Acceptance criteria

- [ ] **AC-1** — Opening a URL carrying a valid share payload displays those
      levels read-only. No level input on the shared view accepts entry.
- [ ] **AC-2** — Opening a shared link neither reads nor writes the recipient's
      stored levels. A test seeds the recipient's state, opens a share link, and
      asserts the stored state is identical afterwards.
- [ ] **AC-3** — An invalid, truncated, or unknown-version payload reports that
      the link is the problem and leaves the recipient on their own tower — never
      a blank view and never a half-populated one.
- [ ] **AC-4** — The shared view states that it is someone else's tower, so a
      recipient cannot mistake it for their own, and offers a way back to their
      own tower.
- [ ] **AC-5** — Reloading the shared URL shows the same shared tower. The URL is
      the source of truth and nothing about the shared tower is persisted.
- [ ] **AC-6** — A shared link opens correctly for a recipient who has never used
      the app and has no stored levels. Nothing on the shared view requires their
      own data to exist, and no empty-state or first-run flow interrupts it.

## Out of scope

- **Adopting a shared tower into your own data.** Its own story, and framed as a
  second *source* into the same import path as `playerInfo.dat` rather than as a
  share feature — a complete overwrite of the recipient's levels, differing from
  OQ-53 only in where the complete level set comes from. Sequenced after OQ-53 so
  the two cannot answer the overwrite question differently. This story ships
  read-only with no adopt control at all; a control that does nothing is worse
  than no control.
- Editing the shared tower, commenting on it, or sending anything back.
- Showing the shared tower against the recipient's own side by side. That is the
  compare use case, and it needs the payload to carry more than levels.

## Constraints

- **The shared tower is its own route**, not the main view flipped into a
  read-only mode by the presence of a query parameter. This is what makes AC-2
  structural: a view that never mounts the level-entry components cannot write to
  stored levels, so there is no read-only flag for a future input to forget to
  respect. AC-4's way back is therefore navigation to the recipient's own route.
- If the app has no router, **stop and set `blocked:`** rather than adding one.
  Introducing routing is a larger decision than this story, and a third mechanism
  beyond the two declared.

## Context

- `stories/OQ-56-share-payload-codec.md` — supplies `decodeTower` and the
  version-rejection behaviour AC-3 surfaces.
- `stories/OQ-57-create-share-link.md` — produces the links this consumes.
- OQ-25 in `Completed-Questions.md` — the backlog entry this refines, with OQ-56
  and OQ-57. Its open question — overwrite the recipient's levels, or show a
  read-only view — is the one this story settles.

## Open questions

*(none)*

---
id: OQ-57
title: Create and copy a share link for the current tower
tier: normal
kind: product
depends_on: [OQ-141]
model: sonnet
blocked: null
---

## Intent

As a player, I want one action that gives me a link to my current tower, so that I
can paste it to someone who will tell me what to buy next without my describing
every level to them.

## Acceptance criteria

- [ ] **AC-1** — A share control on the tower view builds a URL carrying the
      encoded payload for the current tower, every tower-data key OQ-141's
      AC-1 names, and writes it to the
      clipboard, with visible confirmation that it was copied.
- [ ] **AC-2** — The URL is absolute and carries the deployed base path, so it
      resolves when pasted into a chat regardless of which page it was generated
      from.
- [ ] **AC-3** — Generating a share link does not modify the user's stored
      data. A test seeds state, shares, and asserts stored state is
      unchanged.
- [ ] **AC-4** — If the share URL would exceed the 2,000-character budget from
      OQ-56 AC-3, which OQ-141 keeps, the control reports why and produces no link, rather than
      emitting a truncated URL that fails on the recipient's side.
- [ ] **AC-5** — When the clipboard write is refused or unavailable, the URL is
      displayed for manual copying instead of the action silently doing nothing.

## Out of scope

- Consuming a share link. That is OQ-58; this story's output is verifiable
  against OQ-141's decoder in tests without a viewer existing.
- Shortening, QR codes, or any share target beyond the clipboard.
- Sharing interface settings (OQ-141's AC-1): the theme, the open tab and the
  like.

## Constraints

## Context

- `stories/done/OQ-56-share-payload-codec.md` — the size budget AC-4 enforces.
- `stories/OQ-141-share-format-stable-ids.md` — supplies `encodeTower`, and
  replaced OQ-56's format before any link was shared. Owner, 2026-10-26: this
  story waits for it, and a link carries every piece of data the tool stores.
- OQ-25 in `Completed-Questions.md` — the backlog entry this refines, with OQ-56
  and OQ-58.

## Open questions

*(none)*

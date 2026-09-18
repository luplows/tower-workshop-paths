---
id: OQ-60
title: Document the playerInfo.dat level format
tier: next
kind: product
depends_on: []
model: sonnet
blocked: null
mechanisms:
  - the format investigation and its write-up
---

## Intent

As the person refining the import and share stories, I need the structure of
`playerInfo.dat` written down, so that OQ-53 and the share-adopt story can specify
behaviour against a known format instead of leaving a coder to invent a parse that
no reviewer can check. One question decides the shape of both: does a save hold a
complete level set, or only the levels a player has bought?

## Acceptance criteria

- [ ] **AC-1** — A document at `docs/playerinfo-format.md` records the on-disk
      structure: text or binary, the container and encoding, and how Workshop and
      Enhancement levels are keyed. Sufficient that someone could write a parser
      from the document alone, without access to a sample file.
- [ ] **AC-2** — The document states whether a save stores a complete level set
      including levels at zero, or omits unpurchased items — and if it omits them,
      whether omission is per item or per whole category. This is the answer OQ-53
      AC-5 and the share-adopt story both wait on.
- [ ] **AC-3** — The document lists the ways a file can be malformed and says
      which are detectable: truncation, wrong header or magic bytes, missing keys,
      and values outside the valid level range. This is the input to OQ-53 AC-2.
- [ ] **AC-4** — The document names every field that identifies a player or an
      account, so that a test fixture can later be built without publishing
      personal data. If no such field exists, it says so explicitly rather than
      leaving it unaddressed.

## Out of scope

- Writing a parser, or any code at all. This story produces one document; OQ-53
  implements against it.
- Committing a real save file, or building a fixture. See Constraints — the
  fixture is a follow-up once AC-4 names what has to be stripped.
- Editing OQ-53 or any other story. Answering its open questions from this
  document is Session A's work, not this story's.

## Constraints

- **The sample `playerInfo.dat` is read locally and must not be committed.** The
  repository is public, and a save file may carry account identifiers. Only a
  synthetic or redacted fixture may ever be committed, and building one needs
  AC-4's answer first.
- The deliverable is documentation. No parser, no test, no change to application
  code.
- If no sample file is available at dispatch, **set `blocked:` and exit.** The
  format cannot be derived from the app's own source, which today has no reader
  for it.

## Context

- `stories/OQ-53-import-player-info.md` — open questions 1 to 4 are exactly what
  AC-1 to AC-3 answer.
- `stories/OQ-56-share-payload-codec.md` — its AC-5 already fixes share payloads
  as a complete level set. If `playerInfo.dat` is partial, that divergence is the
  finding that matters most, because it means import and share-adopt cannot share
  one path.
- OQ-24 in `Completed-Questions.md` — the original investigation. Read it before
  reverse-engineering anything; it may already answer AC-1 in part.

## Open questions

*(none)*

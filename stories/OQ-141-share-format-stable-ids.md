---
id: OQ-141
title: Make share payloads carry everything the tower stores, by stable ID, and survive game patches
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player sharing my tower, I want a link to carry everything the tool
stores about it, and to keep opening after a game patch changes the data, so
that whoever opens it sees my tower and my recommendations, not a partial
copy, and an old link never stops working.

## Acceptance criteria

- [ ] **AC-1** — Every `localStorage` key the app uses is named once, in one
      module, as either **tower data** or an **interface setting**:
      - Tower data: `workshopLevels`, `enhancementLevels`,
        `workshopDiscountLabs`, `enhancementDiscountLabs`,
        `enhancementLabLevel`, `workshopUnlockedGroups`,
        `buyOutLifetimeCoins` and `buyOutLabCoinsSpent`.
      - Interface settings: `appSection`, `workshopMode`,
        `activeCategoryId` and `themePreference`.

      Every read, write and removal in `src/` takes its key from that module.
      A test fails, naming the file and line, if any non-test file under
      `src/` (any file not named `*.test.*`) passes
      a key as a string literal to `useLocalStorageState`, to a
      `localStorage` method, or through a `storageKey` prop.
- [ ] **AC-2** — Every stored item has a permanent numeric ID, in one table:
      - each Workshop upgrade and each Enhancement;
      - each Workshop and Enhancement discount Lab;
      - the Enhancements Lab level;
      - each Workshop unlock group;
      - each Buy-out input.

      IDs are only ever added. A test pins the table and fails if an ID is
      removed, reused, or given to a different item. A second test fails if
      any item in the data files, or any AC-1 tower-data key, has no ID.
- [ ] **AC-3** — A payload is `[format version][data revision][records][CRC-16]`,
      encoded as unpadded base64url. The format version stays `1`: no v1
      payload has been shared, because OQ-57 is not built.
      - A record starts with a varint key, `ID × 4 + type`. The type says how
        long the value is, so a decoder can skip a record whose ID it does not
        know:
        - `0`: a varint (a level, a Lab level);
        - `1`: no value (a set member, such as an unlocked group);
        - `2`: a varint length, then that many bytes (a string, such as a
          Buy-out input, in UTF-8).

        Type `3` is reserved. A record with an unknown type is `malformed`.
      - Items at zero, empty or absent are left out. On decode, an absent item
        is zero or empty. **This replaces OQ-56's AC-5**, under which a
        payload carried every level and a missing one was rejected. See
        Context for why.
      - The checksum is CRC-16/CCITT-FALSE over every byte before it.
- [ ] **AC-4** — The data revision is a number in the codec. A test pins a
      fingerprint of the item table: every item's ID, name and current max.
      It fails, saying to raise the data revision, when the data files change
      the fingerprint without the revision changing.
- [ ] **AC-5** — Decoding never fails because the game data has changed. A
      payload whose data revision differs from the app's decodes, and the
      result says so (`stale: true`). Unknown IDs are skipped and listed in
      the result. A level above the item's current max is clamped to it and
      listed. Unchanged from OQ-56: a payload that is malformed, truncated,
      or fails its checksum, or whose format version is unknown, throws
      `ShareCodecError` with the same codes, and never returns a partial
      tower.
- [ ] **AC-6** — Tests cover:
      - round trips for an empty tower, an all-max tower with every Lab,
        unlock and Buy-out input set, and a mixed one;
      - a pinned literal for one fixed tower, replacing OQ-56's;
      - a changed byte anywhere, including `0x00` and `0xFF` swapped,
        failing the checksum;
      - each case in AC-5;
      - a record of each type with an unknown ID, skipped, and a record of
        type `3`, rejected as `malformed`.

      The all-max payload keeps the complete share URL at or under 2,000
      characters, OQ-56's AC-3 budget, and a test reports the payload's
      length.
- [ ] **AC-7** — `encodeTower` and `decodeTower` keep their names. They take
      and return every tower-data key from AC-1, not only levels.

## Out of scope

- The share control (OQ-57) and the shared view, with its banner for a stale
  link (OQ-58).
- Adopting a shared tower as your own, which OQ-58's Out of scope describes
  as a story of its own.
- Interface settings. AC-1 names them only so that a new key has to be
  classified.
- Compression.

## Constraints

*(none)*

## Context

- Decided by the owner on 2026-10-26, from Session A's review of OQ-56's
  codec before any link ships:
  - links carry every piece of data the tool stores;
  - a link from older game data opens, under a banner saying the data
    might be wrong (OQ-58);
  - this story replaces OQ-56's format, and OQ-57 and OQ-58 wait for it.
- **What v1 does**, in `src/utils/shareCodec.js` at 69db298:
  - It packs 48 Workshop and 18 Enhancement levels, 534 bits, into a fixed
    94-character payload (counted with `vite-node`).
  - It derives that schema from the live data files: bits per level from
    each max, in category order.
  - It decodes only `FORMAT_VERSION`, so a patch that changes a max or adds
    an upgrade makes every older link `unknown-version`.
  - It carries no Labs, unlocks or Buy-out inputs. Path uses the discount
    Labs, the Enhancements Lab and the unlocked groups, so a recipient would
    get different recommendations.
- **Its checksum's blind spot**, from #264's review: `(a + byte + 1) % 255`
  (line 57) maps `0x00` and `0xFF` to the same value.
- **Where the keys are**, at 69db298:
  - literals in `App.jsx`, `BuyOutPlan.jsx`, `EnhancementInputs.jsx`,
    `LabsInputs.jsx`, `UpgradePath.jsx` and `WorkshopInputs.jsx`;
  - `storageKey` props from `WorkshopInputs.jsx` and
    `EnhancementInputs.jsx` to `CategoryLevelInputs.jsx`;
  - `removeItem` calls in `App.jsx`'s "Clear all levels", lines 55–60.

  The 12 keys in AC-1 are every one found by
  `grep -rhoE "useLocalStorageState\(\s*'[A-Za-z]+'|localStorage\.(get|set|remove)Item\('[A-Za-z]+'|readStored\('[A-Za-z]+'"`
  plus the multi-line calls and `storageKey` props read by hand.
- **Size**: each record is about 3 bytes, so a fully maxed tower is a few
  hundred characters, and a typical one is shorter, since zeros are left out.
- `stories/done/OQ-56-share-payload-codec.md`: the format this replaces.
- **Why AC-3 reverses OQ-56's AC-5.** OQ-56 rejected a missing level so
  that "absent" would never be something the decoder had to interpret,
  because OQ-53 had not settled what a partial import means. A sparse format
  is what keeps old links working across patches, so absent has to mean
  something. Here it means zero, and the data revision says when it might
  not: an item added after a payload was made is absent from it, and decodes
  as zero with `stale: true`. The encoder still writes every non-zero item,
  so a current payload is still complete. Session A proposed this on
  2026-10-26; #266's review found that the first wording claimed to keep
  AC-5 rather than reverse it.

## Open questions

*(none)*

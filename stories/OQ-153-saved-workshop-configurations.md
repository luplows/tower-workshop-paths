---
id: OQ-153
title: Save and switch named Workshop configurations
tier: later
kind: product
depends_on: [OQ-145, OQ-150]
model: sonnet
blocked: null
---

## Intent

As a player using several Workshop presets and extra experimental setups, I want to save and switch between named configurations in Tower Workshop Paths, so that I can inspect and maintain each without re-entering its levels.

## Acceptance criteria

- [ ] **AC-1** — Players can create and name multiple locally persisted configurations, marked either as an in-game Workshop preset slot (at most five such slots) or as an additional saved setup (not counted toward that five-slot limit).

- [ ] **AC-2** — The current single-configuration user's entered state is preserved as a named default configuration when the feature is introduced; the migration does not zero or silently overwrite existing levels.

- [ ] **AC-3** — An explicit current-configuration selector distinguishes game slots from additional saved setups and indicates that switching in this tool does not switch the player's preset inside the game.

- [ ] **AC-4** — Input, Buy order, and the confirmed Apply plan action from OQ-145 read and write only the active saved configuration; switching configurations does not overwrite an inactive configuration.

- [ ] **AC-5** — Players can return to an earlier saved configuration after reload with exactly the saved relevant levels and unlock state. Confirmed delete and overwrite actions cannot silently discard another configuration.

- [ ] **AC-6** — Recommendation-profile selection remains independent from saved-configuration selection; choosing a configuration does not silently change the current strategy.

## Out of scope

- Automatic control of in-game Workshop preset slots, account sync, or server storage.
- Generating a buy list for a saved target; OQ-154 covers rebuilding.
- Changing the semantics of existing share links (OQ-57/OQ-58) without an explicit compatibility decision.

## Constraints

*(none)*

## Context

- `src/storageKeys.js`, `src/App.jsx`, `src/components/WorkshopInputs.jsx`, and `src/components/EnhancementInputs.jsx` — currently one set of localStorage-backed levels.
- `stories/OQ-145-apply-respec-plan.md` — Apply plan currently targets stored single-tower levels.
- `stories/done/OQ-141-share-format-stable-ids.md` and `stories/OQ-57-create-share-link.md` — established tower-data vs interface-setting boundaries.
- Tech Tree Games, v29 patch notes (2026-08-26) — Workshop preset switching and two starter slots: https://techtreegames.zendesk.com/hc/en-us/articles/54972978743707-v29-Patch-Notes-2026-08-26

## Open questions

1. Exactly which fields belong to a saved Workshop configuration versus global tower state? Verify in-game preset behavior for Enhancements and unlock groups; do not assume Labs or coin-history inputs are per-preset.
2. When creating a new setup, is its initial state copied from the active configuration or empty, and may a saved additional setup be assigned to a game-slot number later?
3. How should existing share/export/import stories operate with several configurations: active-only or all, and which existing payload contract remains stable?
4. What is the required backup/recovery behavior for an accidental overwrite or delete, including when the active configuration is deleted?

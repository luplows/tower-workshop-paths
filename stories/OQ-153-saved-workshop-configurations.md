---
id: OQ-153
title: Save and switch named Workshop configurations
tier: later
kind: product
depends_on: [OQ-145, OQ-150, OQ-151]
model: sonnet
blocked: null
---

## Intent

As a player using multiple Workshop presets and experimental setups, I want to preserve their Workshop state and associated curated strategies together, so that switching configurations restores the right recommendations and recorded levels.

## Acceptance criteria

- [ ] **AC-1** — Players can create and name multiple locally persisted configurations, marked either as an in-game Workshop preset slot (at most five) or as an additional saved setup (not counted toward that limit). Each has exactly one associated registered curated recommendation profile. Creation offers both **New** (an empty, zero-level Workshop configuration with the default `ehp` profile) and **Copy current** (a separate configuration duplicating the active configuration's saved levels, unlock state, and associated profile).

- [ ] **AC-2** — When the feature is introduced, existing single-configuration Workshop state and its OQ-151 profile association become a named default configuration. Migration must not zero levels, discard unlocks, or silently replace an existing valid associated profile.

- [ ] **AC-3** — An explicit current-configuration selector distinguishes game slots from additional saved setups. Switching configurations immediately activates the selected configuration's associated profile and recalculates visible Buy order recommendations without a reload, while doing nothing to the player's in-game preset. Tests inject a second profile to verify differing recommendations.

- [ ] **AC-4** — Input, Buy order, and OQ-145's confirmed Apply plan action read and write only the active configuration. Switching configurations does not overwrite inactive configurations, and a previously generated Respec plan cannot be applied to a newly selected configuration without recalculation.

- [ ] **AC-5** — Editing the active configuration's recommendation-profile association updates its visible recommendations immediately without changing its Workshop/Enhancement levels, unlocks, or shared Labs. Other configurations retain their own associated profiles.

- [ ] **AC-6** — After reload, each saved configuration restores its persisted levels, relevant unlock state, and associated profile. Overwriting or deleting a configuration requires confirmation and cannot silently discard another configuration.

- [ ] **AC-7** — A player can assign an additional saved setup to an available in-game slot (one of slots 1–5) without recreating it. The setup retains its identity, name, recorded levels, unlock state, and associated recommendation profile; it is subsequently shown under that game slot rather than counted as an additional setup, including after reload. Occupied slots cannot be silently overwritten, and assigning in the app does not switch or modify any in-game Workshop preset.

## Out of scope

- Automatic control of in-game Workshop preset slots, account sync, or server storage.
- Generating a buy list for a saved target; OQ-154 covers rebuilding.
- Changing the semantics of existing share links (OQ-57/OQ-58) without an explicit compatibility decision.

## Constraints

*(none)*

## Context

- `src/storageKeys.js`, `src/App.jsx`, `src/components/WorkshopInputs.jsx`, and `src/components/EnhancementInputs.jsx` — currently one set of localStorage-backed levels.
- `stories/OQ-145-apply-respec-plan.md` — Apply plan currently targets stored single-tower levels.
- `stories/OQ-151-recommendation-profile-selection.md` — supplies the per-configuration association that this story must preserve during migration and switching.
- Owner decisions, 2026-11-25 — offer both a blank new configuration and a copy of the active configuration, including its associated profile; allow an additional saved setup to be assigned to an available in-game slot without rebuilding it.
- `stories/done/OQ-141-share-format-stable-ids.md` and `stories/OQ-57-create-share-link.md` — established tower-data vs interface-setting boundaries.
- Tech Tree Games, v29 patch notes (2026-08-26) — Workshop preset switching and two starter slots: https://techtreegames.zendesk.com/hc/en-us/articles/54972978743707-v29-Patch-Notes-2026-08-26

## Open questions

1. Exactly which fields belong to a saved Workshop configuration versus global tower state? Verify in-game preset behavior for Enhancements and unlock groups; do not assume Labs or coin-history inputs are per-preset.
2. How should existing share/export/import stories operate with several configurations: active-only or all, and which existing payload contract remains stable?
3. What is the required backup/recovery behavior for an accidental overwrite or delete, including when the active configuration is deleted?
4. How should stored configuration/profile associations respect OQ-141's share payload and tower-data key contracts?

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

- [ ] **AC-1** — Players can create and name multiple locally persisted configurations, marked either as an in-game Workshop preset slot (at most five) or as an additional saved setup (not counted toward that limit). Each has exactly one associated registered curated recommendation profile. Creation offers both **New** (zero Workshop and Enhancement levels, with the default `ehp` profile) and **Copy current** (a separate configuration with copies of the active configuration's Workshop levels, Enhancement levels, and associated profile). Unlock-group handling follows the still-open scope decision.

- [ ] **AC-2** — Introducing multiple configurations preserves the existing user's Workshop levels, Enhancement levels, and OQ-151 profile association as one named default configuration. Migration does not zero either level set, discard previously recorded unlock state, alter global Labs, or silently replace a valid saved profile.

- [ ] **AC-3** — An explicit selector distinguishes in-game slots from additional saved setups. Switching configurations restores its Workshop levels, Enhancement levels, and associated profile in Input and Buy order, immediately recalculates visible recommendations without reload, and leaves global Lab values unchanged. It does not switch anything in the game; tests use a second fixture profile to confirm the advice changes.

- [ ] **AC-4** — Input, Buy order, and OQ-145's confirmed Apply plan action read and write only the active configuration. Switching configurations does not overwrite inactive configurations, and a previously generated Respec plan cannot be applied to a newly selected configuration without recalculation.

- [ ] **AC-5** — Editing the active configuration's recommendation-profile association updates its visible recommendations immediately without changing its Workshop/Enhancement levels, unlocks, or shared Labs. Other configurations retain their own associated profiles.

- [ ] **AC-6** — After reload, each configuration restores its Workshop levels, Enhancement levels, and associated profile, with unlock-group state handled according to the resolved scope rule. All configurations read the same global Lab values. Overwriting or deleting a configuration requires confirmation and cannot silently discard another configuration.

- [ ] **AC-7** — A player can assign an additional saved setup to an available in-game slot (1–5) without recreating it. The setup retains its identity, name, Workshop levels, Enhancement levels, and associated profile, and is then shown under that game slot after reload. Occupied slots cannot be silently overwritten, and assigning in the app never changes the player's in-game preset. Unlock-group handling follows the same resolved scope rule.

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
- Owner confirmation, 2026-11-25 — Workshop upgrade levels, Workshop Enhancement levels, and recommendation profile are preset-specific; Labs are global. Enhancement levels switch with Workshop presets in the game, as reported by the owner.
- Owner decisions, 2026-11-25 — offer both a blank new configuration and a copy of the active configuration, including its associated profile; allow an additional saved setup to be assigned to an available in-game slot without rebuilding it.
- `stories/done/OQ-141-share-format-stable-ids.md` and `stories/OQ-57-create-share-link.md` — established tower-data vs interface-setting boundaries.
- Tech Tree Games, v29 patch notes (2026-08-26) — Workshop preset switching and two starter slots: https://techtreegames.zendesk.com/hc/en-us/articles/54972978743707-v29-Patch-Notes-2026-08-26

## Open questions

1. **Workshop unlock groups:** Are the purchased upgrade-unlock groups shared across in-game Workshop presets or owned separately by each? Until confirmed, do not store unlock-group flags per-preset by assumption. Workshop levels, Enhancement levels, and recommendation-profile association are already confirmed per-preset, and discount/Enhancements Labs are global. Separately decide whether Respec lifetime-coin and Lab-spending input values are global settings or specific to the planning session.
2. How should existing share/export/import stories operate with several configurations: active-only or all, and which existing payload contract remains stable?
3. What is the required backup/recovery behavior for an accidental overwrite or delete, including when the active configuration is deleted?
4. How should stored configuration/profile associations respect OQ-141's share payload and tower-data key contracts?

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

- [ ] **AC-1** — Players can create and name multiple locally persisted configurations, marked either as an in-game Workshop preset slot (at most five) or as an additional saved setup (not counted toward that limit). Each has exactly one associated registered curated recommendation profile. Creation offers both **New** (zero Workshop and Enhancement levels, no purchased Workshop unlock groups, with default `ehp` profile) and **Copy current** (a distinct configuration copying the active configuration's Workshop levels, Enhancement levels, purchased unlock groups, and associated profile).

- [ ] **AC-2** — Introducing multiple configurations preserves the existing user's Workshop levels, Enhancement levels, purchased Workshop unlock groups, and OQ-151 profile association as one named default configuration. Migration does not zero or discard any of that state, alter global Labs, or silently replace a valid associated profile.

- [ ] **AC-3** — An explicit selector distinguishes in-game slots from additional saved setups. Switching configurations restores that configuration's Workshop levels, Enhancement levels, purchased unlock groups, and associated profile in Input and Buy order, immediately recalculating visible recommendations without reload. Global Labs, lifetime coins, and coins spent on Labs stay unchanged; switching in the tool does nothing inside the game. Tests use a second fixture profile to verify differing recommendations.

- [ ] **AC-4** — Input, Buy order, and OQ-145's confirmed Apply plan action read and write the active configuration's Workshop levels, Enhancement levels, and purchased unlock groups only. Switching configurations does not overwrite inactive configurations, and a previously generated Respec plan cannot be applied to a different configuration without recalculation.

- [ ] **AC-5** — Editing the active configuration's recommendation-profile association updates visible Buy order recommendations immediately without changing its Workshop/Enhancement levels, purchased unlock groups, or global Labs. Other configurations retain their own associated profiles.

- [ ] **AC-6** — After reload, each configuration restores its Workshop levels, Enhancement levels, purchased unlock groups, and associated profile. All configurations use the same persisted global Lab values, lifetime coins, and coins spent on Labs; editing either Respec budget input while viewing one configuration updates that single global value used by all. Overwriting or deleting a configuration requires an explicit confirmation before any stored configuration is discarded. Confirmation is the only required recovery safeguard for this first version; no Undo, automatic backup, or restore flow is provided.

- [ ] **AC-7** — A player can assign an additional saved setup to an available in-game slot (1–5) without recreating it. The setup retains its identity, name, Workshop levels, Enhancement levels, purchased unlock groups, and associated profile; it then appears under that game slot, including after reload. Occupied slots cannot be silently overwritten, and assigning it in the tool never changes the player's in-game preset.

- [ ] **AC-8** — Sharing is scoped to the currently active configuration. When the current tower-data share format is used, the shared snapshot contains the active preset's Workshop and Enhancement levels and purchased Workshop unlock groups, together with the relevant global Lab and Respec budget values; values from inactive saved configurations are never included. A test with differing values in two presets verifies the active-only snapshot. Adding the associated recommendation profile to the share payload requires a separately reviewed, compatible codec decision (Open question 2); this story does not silently change OQ-141's shipped format.

- [ ] **AC-9** — Deleting the final remaining saved configuration requires explicit confirmation and immediately creates and persists one new active default configuration, with zero Workshop and Enhancement levels, no purchased Workshop unlock groups, and the default `ehp` recommendation profile. Existing shared Lab levels/unlocks, lifetime coins, and coins spent on Labs remain stored and unchanged. After reload, the new default configuration is still active, and the app never has zero saved configurations. Tests cover deletion of the last configuration and preservation of global data.

- [ ] **AC-10** — When a player confirms deletion of the active configuration and at least one other configuration remains, the application selects and persists as active the **first remaining configuration in the selector's displayed order**. It immediately shows that configuration's Workshop levels, Enhancement levels, purchased unlock groups, and associated recommendation profile, recalculates recommendations, and invalidates any Respec plan for the deleted configuration; it does not create an extra default or alter shared global values. Deleting an inactive configuration leaves the current active selection unchanged. Tests cover active deletion with other presets, inactive deletion, and reload after the fallback selection.

## Out of scope

- Undo after confirmed deletion or overwrite, automatic backups, and deleted-configuration restore functionality.
- Automatic control of in-game Workshop preset slots, account sync, or server storage.
- Generating a buy list for a saved target; OQ-154 covers rebuilding.
- Sharing or importing the entire collection of saved configurations; the initial sharing scope is the active preset only. Do not change OQ-141's codec or OQ-57/OQ-58's established share-link behavior without an explicit compatible follow-up decision.

## Constraints

- For future import/adopt functionality after saved configurations exist, the default destination is a **new** saved configuration; importing must not silently overwrite the active or any other configuration. This is a product rule for later integration, not an instruction for this story to implement import.
- `stories/OQ-53-import-player-info.md` currently specifies replacing the imported level fields, and `stories/OQ-58-open-shared-tower.md` explicitly defers adoption of a shared tower. Preserve those story boundaries until the import destination and compatibility contract are reconciled.

## Context

- `src/storageKeys.js`, `src/App.jsx`, `src/components/WorkshopInputs.jsx`, and `src/components/EnhancementInputs.jsx` — currently one set of localStorage-backed levels.
- `stories/OQ-145-apply-respec-plan.md` — Apply plan currently targets stored single-tower levels.
- `stories/OQ-151-recommendation-profile-selection.md` — supplies the per-configuration association that this story must preserve during migration and switching.
- Owner confirmations, 2026-11-25 — Workshop upgrade levels, Workshop Enhancement levels, purchased Workshop unlock groups, and the recommendation profile are preset-specific; Labs are global. Enhancement levels and purchased Workshop unlock groups are linked to the specific preset in the game, as reported by the owner.
- Owner decisions, 2026-11-25 — offer both a blank new configuration and a copy of the active configuration, including its associated profile; allow an additional saved setup to be assigned to an available in-game slot without rebuilding it. Lifetime coins and coins spent on Labs are global across all presets.
- `stories/done/OQ-141-share-format-stable-ids.md` and `stories/OQ-57-create-share-link.md` — established tower-data vs interface-setting boundaries. OQ-141's existing payload has stable ids for the eight current tower-data keys, but not yet an id for a recommendation-profile association.
- Owner decisions, 2026-11-25 — share only the active preset initially, not every saved configuration; when future imports/adoptions are offered, **New configuration** is the default destination so existing presets are preserved. Deleting the last configuration leaves a newly saved default configuration; previously saved global values remain available. When the active configuration is deleted with others remaining, activate the first remaining configuration in displayed selector order. Explicit confirmation alone is sufficient for deletion/overwrite in the initial version, without Undo or backup recovery.
- Tech Tree Games, v29 patch notes (2026-08-26) — Workshop preset switching and two starter slots: https://techtreegames.zendesk.com/hc/en-us/articles/54972978743707-v29-Patch-Notes-2026-08-26

## Open questions

1. **Import integration:** With **New configuration** agreed as the default destination, how should OQ-53's existing replace-levels criteria apply within that new destination, and how will the separately deferred OQ-58 shared-tower adoption be added? Is an optional, explicitly confirmed **Replace active configuration** action needed later? Do not change either existing story's implementation scope implicitly.
2. How should the saved configuration/profile association be encoded compatibly with OQ-141's existing v1 share-payload contract? The shared tower should explain which recommendation strategy generated its advice, but the currently shipped stable-ID codec does not yet encode an associated profile. Do not silently change its on-wire format.

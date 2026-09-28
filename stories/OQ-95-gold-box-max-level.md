---
id: OQ-95
title: Show when an item is at max level ("gold-boxing")
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want an item at its max level to look different, as it does
in the game, where a maxed item is "gold-boxed", so that I can see what is
finished at a glance.

## Acceptance criteria

*Barebones: to be refined in a planning session.*

- [ ] **AC-1** — An item whose entered level equals its max level shows a
      visual indicator that an item below max does not.
- [ ] **AC-2** — The indicator appears and disappears as the level is
      changed to and from max.

## Out of scope

- Changing how max levels are defined. The data files own them, and OQ-1
  confirms them against the game.

## Constraints

*(none)*

## Context

- `src/components/UpgradeLevelInput.jsx`: renders one level input with
  `/ {upgrade.quantity}` beside it when the upgrade has a finite max. It is
  the app's only `<input>`, so every level input goes through it.
- `CLAUDE.md`, **Testing**: an appearance change deletes the stale
  screenshot baselines and says why in the PR body.
- Raised by the owner on 2026-09-28 as a draft.

## Open questions

1. What should the indicator look like: a gold border, a background, an
   icon? Is there a reference screenshot from the game?
2. Which items does it apply to: Workshop upgrades, Enhancements, Labs, or
   all three? Do items with no finite max ever count as maxed?
3. Should the buy order (the path view) show maxed items the same way, or
   only the inputs?

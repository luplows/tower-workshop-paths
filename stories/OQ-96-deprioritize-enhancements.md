---
id: OQ-96
title: Let the player de-prioritise specific Enhancements in the buy order
tier: normal
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As a player, I want to push specific Enhancements down, or out of, the
recommended path, so that the buy order reflects what I actually want to
buy rather than only the default ratios.

## Acceptance criteria

*Barebones: to be refined in a planning session.*

- [ ] **AC-1** — The player can mark an Enhancement as de-prioritised, and
      the recommended path changes accordingly.
- [ ] **AC-2** — Un-marking it restores the default ordering.

## Out of scope

- Editing the default ratios themselves.

## Constraints

*(none)*

## Context

- `src/data/enhancementPriority.js`: `ENHANCEMENT_PRIORITY_RATIOS` (the
  default buy-order ratios, anchored to Coin Bonus), `RANKED_PRIORITY_ORDER`
  for tie-breaks, and the shared fallback ratio for unranked items.
- `src/utils/cheapestNextUpgrades.js`: the buy-order scoring.
  `CLAUDE.md` names the buy-order scoring algorithm as the highest testing
  priority.
- `src/components/UpgradePath.jsx`: the path view.
- `Project-Outline.md`, "Core Feature: Recommended Buy Order".
- Raised by the owner on 2026-09-28 as a draft.

## Open questions

1. What does de-prioritise mean: excluded from the path entirely, moved to
   the end, or given a lower ratio? Is it one setting or a scale?
2. Enhancements only, or Workshop upgrades too?
3. Where is the control: beside each Enhancement input, in the path view,
   or in a settings panel?
4. Does the choice persist between visits, and should it travel with a
   shared tower link (OQ-56 to OQ-58)?
5. What happens to items that depend on a de-prioritised one, such as an
   unlock group's prerequisite costs?

---
id: OQ-149
title: Restrict eHP buy orders to curated Enhancements
tier: next
kind: product
depends_on: []
model: sonnet
blocked: null
---

## Intent

As an eHP player, I want the recommended buy order to omit Enhancements that the curated eHP priorities do not recommend, so that cheap but irrelevant Enhancement levels do not crowd out worthwhile purchases.

## Acceptance criteria

- [ ] **AC-1** — With the default eHP strategy, the only ordinary Enhancement candidates are the six names in `ENHANCEMENT_PRIORITY_RATIOS`: Coin Bonus, Enemy Level Skip, Cells/Kill Bonus, Health Regen, Health, and Orb Size. An Enhancement not in that set is absent from the automatically ranked purchase rows, even when it has a lower next-level cost.

- [ ] **AC-2** — The filter does not hide Enhancements from Input or discard entered levels. Existing levels still determine costs, tree spending, thresholds, and max-level status; excluded Enhancements simply are not ordinary Path purchases.

- [ ] **AC-3** — Preserve the existing Coin Bonus prerequisite handling: when its Lab or Utility spending gate is unmet, the next required Lab or Cash Bonus purchase may enter the Path even though Cash Bonus has no eHP ratio. Do not extend this story to compute new unlock routes for other prioritized Enhancements.

- [ ] **AC-4** — All eligible base Workshop upgrades, Workshop unlock-group purchases, and their existing discount/batch rules continue competing under the current fallback ratio. For eligible Enhancements, the existing ratio-weighted cost score and tie breaking remain unchanged.

- [ ] **AC-5** — The normal Buy order and the from-zero Respec simulation share this eligibility behavior. In a test state where a cheap Attack Enhancement previously outranked a more expensive eHP Enhancement, that Attack Enhancement is excluded in both workflows; the Respec simulation retains its established rule that it never purchases the Enhancement Lab.

- [ ] **AC-6** — Vitest exercises an eligible Enhancement, an excluded but cheap Enhancement, the Coin Bonus prerequisite path, and a base Workshop candidate. Playwright verifies that Input still shows an excluded Enhancement while Path does not recommend it.

## Out of scope

- Player-controlled deprioritization or opt-out controls; `stories/OQ-96-deprioritize-enhancements.md` remains separate and unresolved.
- New scoring ratios, actual stat-benefit modeling, and a new global save-versus-spend algorithm.
- General-purpose optimization of prerequisites to arbitrary future Enhancement unlocks; existing Coin Bonus behavior is retained.

## Constraints

*(none)*

## Context

- `src/data/enhancementPriority.js` — the six sourced eHP ratios and shared fallback ratio.
- `src/utils/cheapestNextUpgrades.js` — candidate construction, ratio scoring, Coin Bonus anchor/prerequisites, and Path simulation.
- `src/utils/buyOutPlan.js` — Respec simulation from zero; `src/components/UpgradePath.jsx` and `src/components/BuyOutPlan.jsx` — current presentation.
- `stories/OQ-96-deprioritize-enhancements.md` — a different, manually controlled idea that must not be silently implemented here.
- `Project-Outline.md` — product design of record; this story implements its planned strict-eHP rule.

## Open questions

*(none)*

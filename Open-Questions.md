# Open Questions / In Progress

Outstanding tasks and unresolved questions for the project. See `Project-Outline.md` for goals and definitions.

- Accuracy of `tower-idle-toolkit`'s cost data against the current game version (package is ~3 years stale) — spot-check and correct as needed.
- **Task (in progress):** refresh each upgrade's `quantity` (max level) against actual in-game values. Current-level inputs are hard-capped at `quantity` (`UpgradeLevelInput`, via `clampLevel`), so a stale-too-low value incorrectly blocks valid entries until corrected. Corrections are applied via `WORKSHOP_QUANTITY_OVERRIDES` (`src/data/workshopQuantityOverrides.js`) rather than editing the third-party package. Confirmed so far: Rend Armor Chance (299), Health (6000), Health Regen (6000), Recovery Amount (300), Max Recovery (500). The rest of the ~40 upgrades still use `tower-idle-toolkit`'s original (possibly stale) values.

/**
 * Corrections to tower-idle-toolkit's `quantity` (max level) for upgrades
 * confirmed stale against the current game version -- keyed by upgrade name.
 * Add to this as more are confirmed (see the tracked task in
 * Project-Outline.md); the toolkit itself isn't being modified since it's a
 * third-party dependency.
 */
export const WORKSHOP_QUANTITY_OVERRIDES = {
  'Rend Armor Chance': 299,
  Health: 6000,
  'Health Regen': 6000,
  'Recovery Amount': 300,
  'Max Recovery': 500,
}

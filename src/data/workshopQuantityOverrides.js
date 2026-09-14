/**
 * Corrections to tower-idle-toolkit's `quantity` (max level) for upgrades
 * confirmed stale against the current game version -- keyed by upgrade name.
 * The rest of tower-idle-toolkit's `quantity` values are accepted as correct
 * for the current patch (see Open-Questions.md's OQ-13); add to this if a
 * future patch makes another one stale. The toolkit itself isn't being
 * modified since it's a third-party dependency.
 */
export const WORKSHOP_QUANTITY_OVERRIDES = {
  'Rend Armor Chance': 299,
  Health: 6000,
  'Health Regen': 6000,
  'Recovery Amount': 300,
  'Max Recovery': 500,
}

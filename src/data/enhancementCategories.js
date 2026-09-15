/**
 * The Workshop Enhancements screen's categories -- one free starter category
 * per tree plus five more, each gated behind cumulative coins spent on that
 * tree's own enhancements (see Completed-Questions.md's OQ-6 for the full
 * mechanic and the shared 50B/500B/5T/50T/500T threshold progression).
 *
 * This file (names, `quantity`, `unlocksAt`) is hand-entered from the
 * community Google Sheet credited in README.md -- unlike this tree's own
 * per-level costs (enhancementLevels.js) and every other Workshop data
 * file in this project, which now come from mytower.app (Completed-
 * Questions.md's OQ-39). mytower.app doesn't model the threshold-gating
 * mechanic `unlocksAt` describes at all (confirmed directly, see
 * OQ-39-Data-Source-Migration.md), so there was nothing to migrate here.
 * `quantity` (max level) comes from the Master Sheet tab's "Max level"
 * column (column W) and is accepted as correct for the current patch --
 * see OQ-14.
 */
export const ENHANCEMENT_CATEGORIES = [
  {
    id: 'attack',
    label: 'Attack',
    upgrades: [
      { name: 'Damage', unlocksAt: null, quantity: 600 },
      { name: 'Rend Armor', unlocksAt: 50e9, quantity: 600 },
      { name: 'Critical Factor', unlocksAt: 500e9, quantity: 600 },
      { name: 'Damage/Meter', unlocksAt: 5e12, quantity: 600 },
      { name: 'Super Crit Mult', unlocksAt: 50e12, quantity: 600 },
      { name: 'Attack Speed', unlocksAt: 500e12, quantity: 100 },
    ],
  },
  {
    id: 'defense',
    label: 'Defense',
    upgrades: [
      { name: 'Health', unlocksAt: null, quantity: 600 },
      { name: 'Health Regen', unlocksAt: 50e9, quantity: 600 },
      { name: 'Defense Absolute', unlocksAt: 500e9, quantity: 600 },
      { name: 'Land Mine Damage', unlocksAt: 5e12, quantity: 600 },
      { name: 'Wall Health', unlocksAt: 50e12, quantity: 600 },
      { name: 'Orb Size', unlocksAt: 500e12, quantity: 250 },
    ],
  },
  {
    id: 'utility',
    label: 'Utility',
    upgrades: [
      { name: 'Cash Bonus', unlocksAt: null, quantity: 600 },
      { name: 'Coin Bonus', unlocksAt: 50e9, quantity: 300 },
      { name: 'Cells/Kill Bonus', unlocksAt: 500e9, quantity: 300 },
      { name: 'Free Upgrades', unlocksAt: 5e12, quantity: 150 },
      { name: 'Recovery Package', unlocksAt: 50e12, quantity: 600 },
      { name: 'Enemy Level Skip', unlocksAt: 500e12, quantity: 60 },
    ],
  },
]

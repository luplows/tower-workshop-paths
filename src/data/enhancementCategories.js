/**
 * The Workshop Enhancements screen's categories -- one free starter category
 * per tree plus five more, each gated behind cumulative coins spent on that
 * tree's own enhancements (see Project-Outline.md's "Workshop Enhancements"
 * section for the full mechanic and the shared 50B/500B/5T/50T/500T
 * threshold progression).
 *
 * Unlike WORKSHOP_CATEGORIES, this data isn't sourced from tower-idle-toolkit
 * (which has none of it) -- it's hand-entered from the community Google
 * Sheet referenced in Project-Outline.md. `unlocksAt` is unused until the
 * gating/discount-lab work happens -- see the tracked items in
 * Open-Questions.md. `quantity` (max level) comes from the Master Sheet
 * tab's "Max level" column (column W); the user has flagged these as "a bit
 * inconsistent" in the source sheet and plans to spot-check them against
 * the running app, so treat these as best-effort pending that verification.
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

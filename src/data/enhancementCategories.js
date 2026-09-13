/**
 * The Workshop Enhancements screen's categories -- one free starter category
 * per tree plus five more, each gated behind cumulative coins spent on that
 * tree's own enhancements (see Project-Outline.md's "Workshop Enhancements"
 * section for the full mechanic and the shared 50B/500B/5T/50T/500T
 * threshold progression).
 *
 * Unlike WORKSHOP_CATEGORIES, this data isn't sourced from tower-idle-toolkit
 * (which has none of it) -- it's hand-entered from the community Google
 * Sheet referenced in Project-Outline.md. Per-level costs and max levels
 * aren't in this repo yet, so `upgrades` entries have no `quantity`, and
 * `unlocksAt` is unused until the gating/discount-lab work happens -- see
 * the tracked items in Open-Questions.md.
 */
export const ENHANCEMENT_CATEGORIES = [
  {
    id: 'attack',
    label: 'Attack',
    upgrades: [
      { name: 'Damage', unlocksAt: null },
      { name: 'Rend Armor', unlocksAt: 50e9 },
      { name: 'Critical Factor', unlocksAt: 500e9 },
      { name: 'Damage/Meter', unlocksAt: 5e12 },
      { name: 'Super Crit Mult', unlocksAt: 50e12 },
      { name: 'Attack Speed', unlocksAt: 500e12 },
    ],
  },
  {
    id: 'defense',
    label: 'Defense',
    upgrades: [
      { name: 'Health', unlocksAt: null },
      { name: 'Health Regen', unlocksAt: 50e9 },
      { name: 'Defense Absolute', unlocksAt: 500e9 },
      { name: 'Land Mine Damage', unlocksAt: 5e12 },
      { name: 'Wall Health', unlocksAt: 50e12 },
      { name: 'Orb Size', unlocksAt: 500e12 },
    ],
  },
  {
    id: 'utility',
    label: 'Utility',
    upgrades: [
      { name: 'Cash Bonus', unlocksAt: null },
      { name: 'Coin Bonus', unlocksAt: 50e9 },
      { name: 'Cells/Kill Bonus', unlocksAt: 500e9 },
      { name: 'Free Upgrades', unlocksAt: 5e12 },
      { name: 'Recovery Package', unlocksAt: 50e12 },
      { name: 'Enemy Level Skip', unlocksAt: 500e12 },
    ],
  },
]

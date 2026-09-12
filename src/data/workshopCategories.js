import {
  ATTACK_UPGRADES,
  DEFENSE_UPGRADES,
  UTILITY_UPGRADES,
} from 'tower-idle-toolkit'

const toUpgradeList = (upgrades) => Object.values(upgrades)

/**
 * The Workshop tab's categories, in the same order and grouping shown in-game.
 * Each upgrade's `quantity` (max level) comes from tower-idle-toolkit, which
 * may be stale relative to the current game version -- treat it as a
 * reference, not a hard limit (see Project-Outline.md).
 */
export const WORKSHOP_CATEGORIES = [
  {
    id: 'attack',
    label: 'Attack Upgrades',
    upgrades: toUpgradeList(ATTACK_UPGRADES),
  },
  {
    id: 'defense',
    label: 'Defense Upgrades',
    upgrades: toUpgradeList(DEFENSE_UPGRADES),
  },
  {
    id: 'utility',
    label: 'Utility Upgrades',
    upgrades: toUpgradeList(UTILITY_UPGRADES),
  },
]

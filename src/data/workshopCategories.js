import { WORKSHOP_UPGRADE_LIST } from './workshopUpgradeList'

/**
 * The Workshop tab's categories, in the same order and grouping shown
 * in-game. Each upgrade's `quantity` (max level) comes from mytower.app
 * (see workshopUpgradeList.js, Completed-Questions.md's OQ-39), replacing
 * tower-idle-toolkit -- it's enforced as a hard input limit (see
 * UpgradeLevelInput), so a stale value would incorrectly reject a valid
 * entry -- see Project-Outline.md.
 */
export const WORKSHOP_CATEGORIES = [
  {
    id: 'attack',
    label: 'Attack',
    upgrades: WORKSHOP_UPGRADE_LIST.attack,
  },
  {
    id: 'defense',
    label: 'Defense',
    upgrades: WORKSHOP_UPGRADE_LIST.defense,
  },
  {
    id: 'utility',
    label: 'Utility',
    upgrades: WORKSHOP_UPGRADE_LIST.utility,
  },
]

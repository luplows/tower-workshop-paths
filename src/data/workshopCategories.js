import {
  ATTACK_UPGRADES,
  DEFENSE_UPGRADES,
  UTILITY_UPGRADES,
} from 'tower-idle-toolkit'
import { WORKSHOP_QUANTITY_OVERRIDES } from './workshopQuantityOverrides'

const applyQuantityOverride = (upgrade) => {
  const override = WORKSHOP_QUANTITY_OVERRIDES[upgrade.name]
  return override === undefined ? upgrade : { ...upgrade, quantity: override }
}

const toUpgradeList = (upgrades) => Object.values(upgrades).map(applyQuantityOverride)

/**
 * The Workshop tab's categories, in the same order and grouping shown in-game.
 * Each upgrade's `quantity` (max level) comes from tower-idle-toolkit, corrected
 * where confirmed stale via WORKSHOP_QUANTITY_OVERRIDES. It's enforced as a hard
 * input limit (see UpgradeLevelInput), so an uncorrected stale value will
 * incorrectly reject valid entries -- see Project-Outline.md.
 */
export const WORKSHOP_CATEGORIES = [
  {
    id: 'attack',
    label: 'Attack',
    upgrades: toUpgradeList(ATTACK_UPGRADES),
  },
  {
    id: 'defense',
    label: 'Defense',
    upgrades: toUpgradeList(DEFENSE_UPGRADES),
  },
  {
    id: 'utility',
    label: 'Utility',
    upgrades: toUpgradeList(UTILITY_UPGRADES),
  },
]

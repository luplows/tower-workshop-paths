import { ATTACK_UNLOCKS, DEFENSE_UNLOCKS, UTILITY_UNLOCKS } from 'tower-idle-toolkit'

/**
 * Workshop upgrade-unlock groups, per tree (Project-Outline.md's Inputs
 * section, OQ-5) -- every upgrade in a tree belongs to exactly one ordered
 * group: a free "Default" group (cost 0, always unlocked) plus several paid
 * ones, each gating a handful of specific upgrades behind a one-time coin
 * cost (e.g. Attack's "Multishot Upgrades" group, 400 coins, unlocks
 * "Multishot Chance" and "Multishot Targets"). Keyed by category id to
 * match `WORKSHOP_CATEGORIES`. Confirmed 1:1 against `tower-idle-toolkit`'s
 * `ATTACK_UPGRADES`/`DEFENSE_UPGRADES`/`UTILITY_UPGRADES`: every upgrade
 * appears in exactly one group, no gaps or duplicates.
 */
export const WORKSHOP_UNLOCK_GROUPS = {
  attack: ATTACK_UNLOCKS,
  defense: DEFENSE_UNLOCKS,
  utility: UTILITY_UNLOCKS,
}

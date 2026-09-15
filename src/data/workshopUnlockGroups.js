/**
 * Workshop upgrade-unlock groups, per tree (Project-Outline.md's Inputs
 * section, OQ-5) -- every upgrade in a tree belongs to exactly one ordered
 * group: a free "Default" group (cost 0, always unlocked) plus several paid
 * ones, each gating a handful of specific upgrades behind a one-time coin
 * cost (e.g. Attack's "Multishot Upgrades" group, 400 coins, unlocks
 * "Multishot Chance" and "Multishot Targets"). Keyed by category id to
 * match `WORKSHOP_CATEGORIES`.
 *
 * Previously sourced from tower-idle-toolkit's ATTACK_UNLOCKS/
 * DEFENSE_UNLOCKS/UTILITY_UNLOCKS -- the one remaining piece of that
 * dependency after OQ-39 migrated everything else to mytower.app, which
 * has no equivalent data at all (confirmed by inspecting its Workshop
 * pages directly -- no lock/unlock/group concept appears anywhere, see
 * OQ-39-Data-Source-Migration.md). Hand-transcribed here instead, from
 * tower-idle-toolkit's own values, confirmed correct in-game by the user
 * (2026-09-15) tree by tree -- the same "hand-verified against the real
 * game" status this project's Enhancement category data already had
 * (enhancementCategories.js, OQ-14). tower-idle-toolkit is no longer a
 * dependency of this project at all as of this file's own resolution.
 */
export const WORKSHOP_UNLOCK_GROUPS = {
  attack: [
    { name: 'Default', cost: 0, upgrades: ['Damage', 'Attack Speed', 'Critical Chance', 'Critical Factor'] },
    { name: 'Range Upgrades', cost: 50, upgrades: ['Range', 'Damage / Meter'] },
    { name: 'Multishot Upgrades', cost: 400, upgrades: ['Multishot Chance', 'Multishot Targets'] },
    { name: 'Rapid Fire Upgrades', cost: 1500, upgrades: ['Rapid Fire Chance', 'Rapid Fire Duration'] },
    { name: 'Bounce Shot Upgrades', cost: 10000, upgrades: ['Bounce Shot Chance', 'Bounce Shot Targets', 'Bounce Shot Range'] },
    { name: 'Super Critical Hits', cost: 100000000, upgrades: ['Super Crit Chance', 'Super Crit Mult'] },
    { name: 'Rend Armor', cost: 500000000000, upgrades: ['Rend Armor Chance', 'Rend Armor Mult'] },
  ],
  defense: [
    { name: 'Default', cost: 0, upgrades: ['Health', 'Health Regen'] },
    { name: 'Defense Upgrades', cost: 75, upgrades: ['Defense Percent', 'Defense Absolute'] },
    { name: 'Thorn Upgrades', cost: 500, upgrades: ['Thorns'] },
    { name: 'Lifesteal Upgrades', cost: 2000, upgrades: ['Lifesteal'] },
    { name: 'Knockback Upgrades', cost: 5000, upgrades: ['Knockback Chance', 'Knockback Force'] },
    { name: 'Orbs Upgrades', cost: 15000, upgrades: ['Orb Speed', 'Orbs'] },
    { name: 'Shockwave Upgrades', cost: 100000, upgrades: ['Shockwave Size', 'Shockwave Frequency'] },
    { name: 'Land Mine Upgrades', cost: 400000, upgrades: ['Land Mine Damage', 'Land Mine Chance', 'Land Mine Radius'] },
    { name: 'Death Defy', cost: 1500000, upgrades: ['Death Defy'] },
    { name: 'The Wall', cost: 500000000, upgrades: ['Wall Health', 'Wall Rebuild'] },
  ],
  utility: [
    { name: 'Default', cost: 0, upgrades: [] },
    { name: 'Cash Bonuses', cost: 40, upgrades: ['Cash Bonus', 'Cash / Wave'] },
    { name: 'Coin Bonuses', cost: 100, upgrades: ['Coins / Kill Bonus', 'Coins / Wave'] },
    { name: 'Upgrade Chances', cost: 800, upgrades: ['Free Attack Upgrade', 'Free Defense Upgrade', 'Free Utility Upgrade'] },
    { name: 'Interest / Wave', cost: 5000, upgrades: ['Interest / Wave'] },
    { name: 'Recovery Package', cost: 1500000, upgrades: ['Recovery Amount', 'Max Recovery', 'Package Chance'] },
    { name: 'Enemy Level Skips', cost: 1000000000, upgrades: ['Enemy Attack Level Skip', 'Enemy Health Level Skip'] },
  ],
}

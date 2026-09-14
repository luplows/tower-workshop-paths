# OQ-1 Checklist: Verify Workshop Upgrade Data

Tracking checklist for [Open-Questions.md](Open-Questions.md)'s OQ-1 — working through every Workshop upgrade one by one to confirm its max level and per-level coin costs are correct for the current patch, rather than just trusted from `tower-idle-toolkit`.

## How to verify each upgrade

- **Max level**: in-game, max out the upgrade (or check its listed cap) and compare against the "current data" value noted below for that upgrade. If it differs, add/update an entry in `src/data/workshopQuantityOverrides.js` (see OQ-13 — five upgrades are already corrected there) and update `WORKSHOP_QUANTITY_OVERRIDES`'s snapshot test (`workshopCategories.test.js`) with `vitest -u` after reviewing the diff.
- **Costs**: spot-check a few levels (e.g. level 1, a mid-range level, and the level just before max) against what's shown in-game, comparing to `WORKSHOP_LEVELS[name][level].coins` from `tower-idle-toolkit` — either via `node -e "console.log(require('tower-idle-toolkit').WORKSHOP_LEVELS['<name>']['<level>'])"` or by inspecting `node_modules/tower-idle-toolkit/build/data/workshop.json` directly. There's no override mechanism yet for per-level costs (unlike max level) — if a cost is wrong, note it inline below and flag a new item in `Open-Questions.md`, since a fix will need one designed.
- **Known gap, don't re-discover it**: Health, Health Regen, Recovery Amount, and Max Recovery have *no* cost data at all beyond `tower-idle-toolkit`'s old (lower, pre-correction) idea of max level — see OQ-1 and `src/utils/cheapestNextUpgrades.js`'s handling of it. Their "costs" checkbox here is about the *covered* range (0 up to the old ceiling), not the known-missing tail.
- Check a box only once you've actually compared against the game, not just re-read the code.

Current data quantities below reflect `WORKSHOP_QUANTITY_OVERRIDES`-corrected values (OQ-13) as of this checklist's creation — re-derive from `src/data/workshopCategories.js` if you suspect it's drifted.

## Attack

- [ ] **Damage** (current data max: 6000)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Attack Speed** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Critical Chance** (current data max: 79)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Critical Factor** (current data max: 150)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Range** (current data max: 79)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Damage / Meter** (current data max: 200)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Multishot Chance** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Multishot Targets** (current data max: 7)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Rapid Fire Chance** (current data max: 85)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Rapid Fire Duration** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Bounce Shot Chance** (current data max: 85)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Bounce Shot Targets** (current data max: 7)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Bounce Shot Range** (current data max: 60)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Super Crit Chance** (current data max: 100)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Super Crit Mult** (current data max: 120)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Rend Armor Chance** (current data max: 299 — OQ-13 correction)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Rend Armor Mult** (current data max: 299)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked

## Defense

- [ ] **Health** (current data max: 6000 — OQ-13 correction; known cost-data gap past level 5000, see above)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked (covered range only)
- [ ] **Health Regen** (current data max: 6000 — OQ-13 correction; known cost-data gap past level 5000, see above)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked (covered range only)
- [ ] **Defense Percent** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Defense Absolute** (current data max: 5000)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Thorns** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Lifesteal** (current data max: 80)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Knockback Chance** (current data max: 80)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Knockback Force** (current data max: 40)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Orb Speed** (current data max: 38)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Orbs** (current data max: 4)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Shockwave Size** (current data max: 35)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Shockwave Frequency** (current data max: 40)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Land Mine Chance** (current data max: 50)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Land Mine Damage** (current data max: 200)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Land Mine Radius** (current data max: 50)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Death Defy** (current data max: 75)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Wall Health** (current data max: 1800)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Wall Rebuild** (current data max: 300)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked

## Utility

- [ ] **Cash Bonus** (current data max: 149)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Cash / Wave** (current data max: 149)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Coins / Kill Bonus** (current data max: 149)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Coins / Wave** (current data max: 149)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Free Attack Upgrade** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Free Defense Upgrade** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Free Utility Upgrade** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Interest / Wave** (current data max: 99)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Recovery Amount** (current data max: 300 — OQ-13 correction; known cost-data gap past level 60, see above)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked (covered range only)
- [ ] **Max Recovery** (current data max: 500 — OQ-13 correction; known cost-data gap past level 50, see above)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked (covered range only)
- [ ] **Package Chance** (current data max: 60)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Enemy Attack Level Skip** (current data max: 699)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked
- [ ] **Enemy Health Level Skip** (current data max: 699)
  - [ ] Max level confirmed
  - [ ] Costs spot-checked

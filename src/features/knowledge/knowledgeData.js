export const BUILD_ARCHETYPES = [
  { id: 'ar-crit', name: 'AR Crit DPS', tags: ['weapon damage', 'critical hit chance', 'critical hit damage', 'assault rifle', 'damage to targets out of cover'] },
  { id: 'striker', name: "Striker's DPS", tags: ['striker', 'critical hit chance', 'critical hit damage', 'weapon handling'] },
  { id: 'smg-crit', name: 'SMG Crit DPS', tags: ['smg', 'critical hit chance', 'critical hit damage', 'damage to targets out of cover'] },
  { id: 'lmg', name: 'LMG DPS', tags: ['lmg', 'weapon damage', 'damage to targets out of cover', 'critical hit damage'] },
  { id: 'rifle', name: 'Rifle DPS', tags: ['rifle', 'critical hit chance', 'critical hit damage', 'damage to targets out of cover'] },
  { id: 'headshot', name: 'Headshot DPS', tags: ['headshot damage', 'weapon handling', 'marksman rifle'] },
  { id: 'shotgun', name: 'Shotgun / Hunter', tags: ['shotgun', 'damage to armor', 'damage to targets out of cover', 'critical hit damage'] },
  { id: 'skill-damage', name: 'Turret & Drone', tags: ['skill damage', 'skill haste', 'skill tier'] },
  { id: 'status', name: 'Status Effects', tags: ['status effects', 'skill haste', 'eclipse protocol'] },
  { id: 'healer', name: 'Healer / Support', tags: ['repair skills', 'skill haste', 'skill tier'] },
  { id: 'tank', name: 'Armor / Bruiser', tags: ['armor', 'armor regeneration', 'hazard protection', 'explosive resistance'] },
]

export const ARMOR_SLOTS = ['Mask', 'Chest', 'Holster', 'Backpack', 'Gloves', 'Kneepads']

export const WEAPON_CATEGORIES = [
  'Assault Rifles',
  'SMGs',
  'LMGs',
  'Rifles',
  'Marksman Rifles',
  'Shotguns',
  'Pistols',
]

export const WEAPON_ATTRIBUTES = [
  'Damage to Targets Out of Cover',
  'Damage to Armor',
  'Damage to Health',
  'Critical Hit Chance',
  'Critical Hit Damage',
  'Headshot Damage',
  'Rate of Fire',
  'Weapon Handling',
  'Magazine Size',
  'Optimal Range',
  'Swap Speed',
  'Reload Speed',
]

export const WEAPON_TALENTS = [
  'Optimist', 'Strained', 'Fast Hands', 'Killer', 'Ranger', 'Measured',
  'Flatline', 'In Sync', 'Preservation', 'Breadbasket', 'Close & Personal',
  'Sadist', 'Ignited', 'Eyeless', 'Future Perfect', 'Spike', 'Boomerang',
  'Rifleman', 'Lucky Shot', 'First Blood', 'Determined', 'Pummel',
  'Unhinged', 'Frenzy', 'Steady Handed', 'Outsider', 'Finisher',
]

export const GEAR_RULES = [
  {
    id: 'red-dps-any-slot',
    brands: ['Fenris Group AB', 'Česká Výroba s.r.o.', 'Ceska Vyroba s.r.o.', 'Grupo Sombra S.A.', 'Providence Defense', 'Sokolov Concern', 'Walker, Harris & Co.', 'Overlord Armaments', 'Petrov Defense Group', 'Badger Tuff'],
    slots: ARMOR_SLOTS,
    talents: [], attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 88,
    verdict: 'Keep if the brand fits', tier: 'excellent', builds: ['AR Crit DPS', 'SMG Crit DPS', 'Rifle DPS', 'LMG DPS'],
    reason: 'Double-crit rolls are broadly useful on red weapon-damage brands. Masks, holsters, gloves, and kneepads are especially easy to reuse.',
  },
  {
    id: 'fenris-obliterate', brands: ['Fenris Group AB'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96, verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'A highly reusable AR damage chest. A copy that needs only one recalibration is worth keeping.',
  },
  {
    id: 'ceska-obliterate', brands: ['Česká Výroba s.r.o.', 'Ceska Vyroba s.r.o.'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96, verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'Excellent when a crit build needs help reaching the Critical Hit Chance cap.',
  },
  {
    id: 'grupo-obliterate', brands: ['Grupo Sombra S.A.'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96, verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'A strong all-red damage chest for builds already near the crit chance cap.',
  },
  {
    id: 'vigilance-red', brands: ['Grupo Sombra S.A.', 'Providence Defense', 'Fenris Group AB', 'Česká Výroba s.r.o.', 'Ceska Vyroba s.r.o.'], slots: ['Backpack'], talents: ['Vigilance'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 94, verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', 'Headshot DPS', 'Rifle DPS'],
    reason: 'Vigilance with double-crit rolls is a staple high-end DPS backpack.',
  },
  {
    id: 'skill-any-slot', brands: ['Empress International', 'Hana-U Corporation', 'Wyvern Wear'], slots: ARMOR_SLOTS, talents: [],
    attributes: ['Skill Damage', 'Skill Haste'], score: 88, verdict: 'Keep if useful', tier: 'excellent', builds: ['Turret & Drone'],
    reason: 'Skill Damage plus Skill Haste is the standard reusable roll pair for turret-and-drone pieces in any armor slot.',
  },
  {
    id: 'empress-kinetic', brands: ['Empress International'], slots: ['Chest'], talents: ['Kinetic Momentum'],
    attributes: ['Skill Damage', 'Skill Haste'], score: 95, verdict: 'Keep', tier: 'meta', builds: ['Turret & Drone'],
    reason: 'A core chest combination for turret-and-drone skill builds.',
  },
  {
    id: 'empress-combined', brands: ['Empress International', 'Hana-U Corporation'], slots: ['Backpack'], talents: ['Combined Arms', 'Tech Support'],
    attributes: ['Skill Damage', 'Skill Haste'], score: 93, verdict: 'Keep', tier: 'excellent', builds: ['Turret & Drone'],
    reason: 'A strong skill-damage backpack that is easy to reuse across PvE builds.',
  },
  {
    id: 'status-any-slot', brands: ['Golan Gear Ltd', 'Electrique', 'China Light Industries Corporation'], slots: ARMOR_SLOTS, talents: [],
    attributes: ['Status Effects', 'Skill Haste'], score: 84, verdict: 'Keep one', tier: 'situational', builds: ['Status Effects'],
    reason: 'Status Effects with Skill Haste is useful across crowd-control and damage-over-time builds, including non-chest and non-backpack slots.',
  },
  {
    id: 'healer-any-slot', brands: ['Future Initiative', 'Alps Summit Armament', 'Murakami Industries'], slots: ARMOR_SLOTS, talents: [],
    attributes: ['Repair Skills', 'Skill Haste'], score: 84, verdict: 'Keep one', tier: 'situational', builds: ['Healer / Support'],
    reason: 'Repair Skills plus Skill Haste is the usual support-roll pairing on healer pieces in any slot.',
  },
  {
    id: 'tank-any-slot', brands: ['Belstone Armory', 'Gila Guard', 'Golan Gear Ltd', 'Uzina Getica'], slots: ARMOR_SLOTS, talents: [],
    attributes: ['Armor Regeneration', 'Hazard Protection'], score: 80, verdict: 'Keep selectively', tier: 'situational', builds: ['Armor / Bruiser'],
    reason: 'Armor Regeneration and Hazard Protection can be valuable for tank and bruiser pieces, especially when the core or brand already fits the build.',
  },
  {
    id: 'eclipse-core', brands: ['Eclipse Protocol'], slots: ARMOR_SLOTS, talents: [], attributes: ['Status Effects'], score: 89,
    verdict: 'Keep useful slots', tier: 'set', builds: ['Status Effects'],
    reason: 'Status Effects is the key secondary roll on Eclipse pieces. Keep chest and backpack first, then useful mask, holster, gloves, and kneepads.',
  },
  {
    id: 'striker-core', brands: ["Striker's Battlegear", 'Strikers Battlegear'], slots: ARMOR_SLOTS, talents: [], attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 90,
    verdict: 'Keep useful slots', tier: 'set', builds: ["Striker's DPS"],
    reason: 'Keep well-rolled Striker pieces across every armor slot so you can change which brand or exotic fills the remaining positions.',
  },
  {
    id: 'heartbreaker-core', brands: ['Heartbreaker'], slots: ARMOR_SLOTS, talents: [], attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 86,
    verdict: 'Keep useful slots', tier: 'set', builds: ['Armor / Bruiser', 'AR Crit DPS'],
    reason: 'Heartbreaker pieces with useful crit rolls provide flexible offensive variants across all armor slots.',
  },
]

export const WEAPON_RULES = [
  {
    id: 'ar-dtoc', categories: ['Assault Rifles'], attributes: ['Damage to Targets Out of Cover'],
    talents: ['Optimist', 'Strained', 'Fast Hands', 'Killer', 'Flatline', 'In Sync', 'Preservation'], score: 92,
    verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'Damage to Targets Out of Cover is the most broadly useful third attribute on assault rifles. A strong talent makes the weapon immediately build-ready.',
  },
  {
    id: 'smg-dtoc', categories: ['SMGs'], attributes: ['Damage to Targets Out of Cover'],
    talents: ['Optimist', 'Strained', 'Fast Hands', 'Killer', 'Close & Personal', 'Outsider'], score: 91,
    verdict: 'Keep', tier: 'meta', builds: ['SMG Crit DPS'],
    reason: 'SMGs already supply Critical Hit Chance, so Damage to Targets Out of Cover is usually the most useful flexible third attribute.',
  },
  {
    id: 'lmg-dtoc', categories: ['LMGs'], attributes: ['Damage to Targets Out of Cover'],
    talents: ['Unhinged', 'Frenzy', 'Fast Hands', 'Strained', 'Steady Handed', 'Flatline'], score: 91,
    verdict: 'Keep', tier: 'meta', builds: ['LMG DPS'],
    reason: 'Damage to Targets Out of Cover is a high-value third attribute for general LMG damage builds.',
  },
  {
    id: 'rifle-dtoc', categories: ['Rifles'], attributes: ['Damage to Targets Out of Cover'],
    talents: ['Boomerang', 'Rifleman', 'Lucky Shot', 'Ranger', 'Flatline', 'Determined'], score: 91,
    verdict: 'Keep', tier: 'meta', builds: ['Rifle DPS', 'Headshot DPS'],
    reason: 'Rifles benefit strongly from a multiplicative third attribute and a talent suited to sustained precision fire.',
  },
  {
    id: 'mmr-headshot', categories: ['Marksman Rifles'], attributes: ['Headshot Damage'],
    talents: ['Determined', 'Ranger', 'First Blood', 'Preservation'], score: 91,
    verdict: 'Keep', tier: 'meta', builds: ['Headshot DPS'],
    reason: 'Headshot-focused marksman rifle rolls are valuable when paired with a talent that supports chain kills or long-range damage.',
  },
  {
    id: 'shotgun-dta', categories: ['Shotguns'], attributes: ['Damage to Armor'],
    talents: ['Pummel', 'Close & Personal', 'Optimist', 'Preservation', 'In Sync'], score: 90,
    verdict: 'Keep', tier: 'excellent', builds: ['Shotgun / Hunter'],
    reason: 'Damage to Armor is a strong shotgun third attribute, especially on close-range burst builds.',
  },
  {
    id: 'pistol-general', categories: ['Pistols'], attributes: ['Damage to Targets Out of Cover', 'Damage to Armor'],
    talents: ['Finisher', 'Optimist', 'Ranger', 'Preservation', 'In Sync'], score: 82,
    verdict: 'Keep selectively', tier: 'situational', builds: ['AR Crit DPS', 'Healer / Support'],
    reason: 'Pistols are highly build-dependent. Keep strong third attributes with a talent that serves a specific sidearm or shield setup.',
  },
]

export const NAMED_ITEM_RULES = [
  { names: ['Memento', "Coyote's Mask", 'Scorpio', "St. Elmo's Engine", 'Eagle Bearer', 'The Ravenous', 'Ouroboros', 'Capacitor'], score: 100, verdict: 'Never delete', tier: 'exotic', reason: 'High-value exotic with broad or unique build use. Keep at least one copy.' },
  { names: ['The Gift', 'Contractor’s Gloves', "Contractor's Gloves", 'Fox’s Prayer', "Fox's Prayer", 'Picaro’s Holster', "Picaro's Holster", 'Picaros Holster', 'Closer', 'Punch Drunk', 'The Hollow Man', 'Emperor’s Guard', "Emperor's Guard", 'Chill Out'], score: 96, verdict: 'Keep', tier: 'named', reason: 'Build-defining or unusually efficient named armor item. Keep your best copy.' },
  { names: ['Dark Winter', 'The White Death', 'Baker’s Dozen', "Baker's Dozen", 'The Mop', 'Rock n Roll', 'Lefty', 'Kingbreaker', 'Harmony', 'Test Subject', 'Scalpel'], score: 94, verdict: 'Keep', tier: 'named', reason: 'Useful named weapon with a distinctive perfect talent or attribute. Keep the best rolled copy.' },
]

export const BUILD_ARCHETYPES = [
  {
    id: 'ar-crit',
    name: 'AR Crit DPS',
    tags: ['weapon damage', 'critical hit chance', 'critical hit damage', 'assault rifle'],
  },
  {
    id: 'striker',
    name: "Striker's DPS",
    tags: ['striker', 'critical hit chance', 'critical hit damage', 'weapon handling'],
  },
  {
    id: 'skill-damage',
    name: 'Turret & Drone',
    tags: ['skill damage', 'skill haste', 'skill tier'],
  },
  {
    id: 'status',
    name: 'Status Effects',
    tags: ['status effects', 'skill haste', 'eclipse protocol'],
  },
  {
    id: 'tank',
    name: 'Armor / Bruiser',
    tags: ['armor', 'armor regeneration', 'hazard protection'],
  },
  {
    id: 'headshot',
    name: 'Headshot DPS',
    tags: ['headshot damage', 'weapon handling', 'marksman rifle'],
  },
]

export const GEAR_RULES = [
  {
    id: 'fenris-obliterate',
    brands: ['Fenris Group AB'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96,
    verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'A highly reusable AR damage chest. A copy that needs only one recalibration is worth keeping.',
  },
  {
    id: 'ceska-obliterate',
    brands: ['Česká Výroba s.r.o.', 'Ceska Vyroba s.r.o.'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96,
    verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'Excellent when a crit build needs help reaching the Critical Hit Chance cap.',
  },
  {
    id: 'grupo-obliterate',
    brands: ['Grupo Sombra S.A.'], slots: ['Chest'], talents: ['Obliterate'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 96,
    verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', "Striker's DPS"],
    reason: 'A strong all-red damage chest for builds already near the crit chance cap.',
  },
  {
    id: 'vigilance-red',
    brands: ['Grupo Sombra S.A.', 'Providence Defense', 'Fenris Group AB'], slots: ['Backpack'], talents: ['Vigilance'],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 94,
    verdict: 'Keep', tier: 'meta', builds: ['AR Crit DPS', 'Headshot DPS'],
    reason: 'Vigilance with double-crit rolls is a staple high-end DPS backpack.',
  },
  {
    id: 'empress-kinetic',
    brands: ['Empress International'], slots: ['Chest'], talents: ['Kinetic Momentum'],
    attributes: ['Skill Damage', 'Skill Haste'], score: 95,
    verdict: 'Keep', tier: 'meta', builds: ['Turret & Drone'],
    reason: 'A core chest combination for turret-and-drone skill builds.',
  },
  {
    id: 'empress-combined',
    brands: ['Empress International'], slots: ['Backpack'], talents: ['Combined Arms', 'Tech Support'],
    attributes: ['Skill Damage', 'Skill Haste'], score: 93,
    verdict: 'Keep', tier: 'excellent', builds: ['Turret & Drone'],
    reason: 'A strong skill-damage backpack that is easy to reuse across PvE builds.',
  },
  {
    id: 'belstone-sustain',
    brands: ['Belstone Armory'], slots: ['Backpack'], talents: ['Bloodsucker', 'Adrenaline Rush'],
    attributes: ['Armor Regeneration'], score: 84,
    verdict: 'Keep one', tier: 'situational', builds: ['Armor / Bruiser'],
    reason: 'Useful sustain piece for solo bruiser builds. Keep the best copy rather than multiples.',
  },
  {
    id: 'eclipse-core',
    brands: ['Eclipse Protocol'], slots: ['Backpack', 'Chest'], talents: [],
    attributes: ['Status Effects'], score: 92,
    verdict: 'Keep', tier: 'meta', builds: ['Status Effects'],
    reason: 'The Eclipse chest and backpack are central pieces for status-spread builds.',
  },
  {
    id: 'striker-core',
    brands: ["Striker's Battlegear", 'Strikers Battlegear'], slots: ['Chest', 'Backpack'], talents: [],
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'], score: 92,
    verdict: 'Keep', tier: 'meta', builds: ["Striker's DPS"],
    reason: 'The Striker chest and backpack enable the set’s strongest damage variants.',
  },
]

export const NAMED_ITEM_RULES = [
  { names: ['Memento', "Coyote's Mask", 'Scorpio', "St. Elmo's Engine"], score: 100, verdict: 'Never delete', tier: 'exotic', reason: 'High-value exotic with broad build use. Keep at least one copy.' },
  { names: ['The Gift', 'Contractor’s Gloves', "Contractor's Gloves", 'Fox’s Prayer', "Fox's Prayer", 'Picaro’s Holster', "Picaro's Holster", 'Closer'], score: 96, verdict: 'Keep', tier: 'named', reason: 'Build-defining or unusually efficient named item. Keep your best copy.' },
]

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'public', 'data')
const SOURCE_DIR = path.join(ROOT, 'public', 'catalog', 'sources')
const OUTPUT_DIR = path.join(ROOT, 'public', 'catalog')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'catalog.json')

async function readJson(file, fallback) {
  try {
    await access(file)
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

function clean(value) {
  return String(value ?? '').trim()
}

function slug(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function uniqueByName(items) {
  const map = new Map()

  for (const item of items) {
    const name = clean(item?.name ?? item)
    if (!name) continue

    const key = name.toLocaleLowerCase()
    const existing = map.get(key) ?? {}

    map.set(key, {
      ...existing,
      ...(typeof item === 'string' ? { name } : item),
      name,
      id: existing.id || item?.id || slug(name),
    })
  }

  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  )
}

function rarityText(item) {
  return clean(item?.rarity).toLowerCase()
}

function isNamed(item) {
  return rarityText(item).includes('named')
}

function isExotic(item) {
  return rarityText(item).includes('exotic')
}

const WEAPON_CATEGORY_ALIASES = {
  'assault rifle': 'Assault Rifles',
  'assault rifles': 'Assault Rifles',
  rifle: 'Rifles',
  rifles: 'Rifles',
  smg: 'SMGs',
  smgs: 'SMGs',
  'submachine gun': 'SMGs',
  lmg: 'LMGs',
  lmgs: 'LMGs',
  shotgun: 'Shotguns',
  shotguns: 'Shotguns',
  'marksman rifle': 'Marksman Rifles',
  'marksman rifles': 'Marksman Rifles',
  pistol: 'Pistols',
  pistols: 'Pistols',
  sidearm: 'Pistols',
}

function weaponType(item) {
  const raw = clean(
    item?.weaponType ||
    item?.type ||
    item?.category ||
    item?.class ||
    'Uncategorized',
  )

  return WEAPON_CATEGORY_ALIASES[raw.toLowerCase()] || raw
}

function canonicalWeaponName(item) {
  const name = clean(item?.name)

  if (isNamed(item)) {
    const parts = name.split(/\s+[–—-]\s+/)
    if (parts.length > 1) return parts[0].trim()
  }

  return name
}


function gearSlot(item) {
  return clean(item?.slot || 'Gear')
}

function flattenSkillFamilies(skills = {}) {
  return Object.entries(skills).flatMap(([family, variants]) =>
    (variants ?? []).map((variant) => ({
      name: `${family} — ${variant}`,
      family,
      variant,
    })),
  )
}

const weeklyGear = await readJson(
  path.join(DATA_DIR, 'gear.json'),
  [],
)
const weeklyWeapons = await readJson(
  path.join(DATA_DIR, 'weapons.json'),
  [],
)
const weeklyMods = await readJson(
  path.join(DATA_DIR, 'mods.json'),
  [],
)
const manual = await readJson(
  path.join(SOURCE_DIR, 'manual.json'),
  {},
)

const weeklyNamedGear = weeklyGear
  .filter(isNamed)
  .map((item) => ({
    name: clean(item.name),
    slot: gearSlot(item),
    brand: clean(item.brand),
    source: 'weekly-vendor-seed',
  }))

const GEAR_SLOTS = new Set([
  'mask', 'chest', 'body armor', 'backpack', 'gloves', 'holster', 'kneepads',
])

function isGearExotic(item) {
  return GEAR_SLOTS.has(clean(item?.category).toLowerCase())
}

const weeklyExotics = weeklyGear
  .filter(isExotic)
  .map((item) => ({
    name: clean(item.name),
    category: gearSlot(item),
    source: 'weekly-vendor-seed',
  }))

const weapons = uniqueByName([
  ...weeklyWeapons.map((item) => ({
    name: canonicalWeaponName(item),
    category: weaponType(item),
    rarity: clean(item.rarity),
    source: 'weekly-vendor-seed',
  })),
  ...(manual.weapons ?? []),
])

const namedGear = uniqueByName([
  ...weeklyNamedGear,
  ...(manual.namedGear ?? []),
])

const exotics = uniqueByName([
  ...weeklyExotics,
  ...(manual.exotics ?? []).filter(isGearExotic),
])

const brands = uniqueByName(manual.brands ?? [])
const gearSets = uniqueByName(manual.gearSets ?? [])
const skills = uniqueByName([
  ...flattenSkillFamilies(manual.skills ?? {}),
  ...(manual.skillItems ?? []),
])
const specializations = uniqueByName(
  manual.specializations ?? [],
)

const mods = uniqueByName([
  ...weeklyMods.map((item) => ({
    name: clean(item.name),
    category: clean(item.type || item.category || 'Mod'),
    source: 'weekly-vendor-seed',
  })),
  ...(manual.mods ?? []),
])

const catalog = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  expectedCounts: {
    weapons: {
      total: 271,
    },
    namedGear: 65,
    exotics: 18,
    brands: 37,
    gearSets: 27,
    skills: 43,
    specializations: 6,
  },
  sourceInfo: {
    catalog: 'ProtoTrack Y8S1 snapshot',
    verifiedAt: '2026-07-17',
    notes: 'Weapons include standard, named, and exotic weapons. Exotic Gear excludes exotic weapons to prevent duplicate proficiency entries.',
  },
  sourceSummary: {
    weeklyGear: weeklyGear.length,
    weeklyWeapons: weeklyWeapons.length,
    weeklyMods: weeklyMods.length,
    manualWeapons: (manual.weapons ?? []).length,
    catalogWeaponRecords: weapons.length,
    manualNamedGear: (manual.namedGear ?? []).length,
    manualExotics: (manual.exotics ?? []).length,
    catalogExoticGearRecords: exotics.length,
  },
  categories: {
    weapons,
    namedGear,
    exotics,
    brands,
    gearSets,
    skills,
    specializations,
    mods,
  },
}

await mkdir(OUTPUT_DIR, { recursive: true })
await writeFile(
  OUTPUT_FILE,
  `${JSON.stringify(catalog, null, 2)}\n`,
  'utf8',
)

console.log(`Catalog written to ${OUTPUT_FILE}`)
for (const [name, items] of Object.entries(catalog.categories)) {
  console.log(`${name}: ${items.length}`)
}

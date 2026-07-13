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

function weaponType(item) {
  return clean(
    item?.weaponType ||
    item?.type ||
    item?.category ||
    item?.class ||
    'Uncategorized',
  )
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

const weeklyExotics = [
  ...weeklyGear.filter(isExotic).map((item) => ({
    name: clean(item.name),
    category: gearSlot(item),
    source: 'weekly-vendor-seed',
  })),
  ...weeklyWeapons.filter(isExotic).map((item) => ({
    name: clean(item.name),
    category: weaponType(item),
    source: 'weekly-vendor-seed',
  })),
]

const weapons = uniqueByName([
  ...weeklyWeapons.map((item) => ({
    name: clean(item.name),
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
  ...(manual.exotics ?? []),
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
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceSummary: {
    weeklyGear: weeklyGear.length,
    weeklyWeapons: weeklyWeapons.length,
    weeklyMods: weeklyMods.length,
    manualWeapons: (manual.weapons ?? []).length,
    manualNamedGear: (manual.namedGear ?? []).length,
    manualExotics: (manual.exotics ?? []).length,
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

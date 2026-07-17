import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'public', 'data')
const META_FILE = path.join(DATA_DIR, 'vendor-meta.json')

const SOURCES = {
  gear: 'https://rubenalamina.mx/division/gear.json',
  weapons: 'https://rubenalamina.mx/division/weapons.json',
  mods: 'https://rubenalamina.mx/division/mods.json',
}

function hash(value) {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function fetchJsonArray(label, url) {
  const response = await fetch(
    `${url}?sync=${Date.now()}`,
    {
      headers: {
        'user-agent':
          'division2-companion-vendor-sync/1.0',
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `${label} request failed: ${response.status}`,
    )
  }

  const value = await response.json()

  if (!Array.isArray(value)) {
    throw new Error(
      `${label} response was not a JSON array`,
    )
  }

  return value
}

async function writeJsonAtomically(file, value) {
  const temporaryFile = `${file}.tmp`

  await writeFile(
    temporaryFile,
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  )

  await rename(temporaryFile, file)
}

await mkdir(DATA_DIR, { recursive: true })

const previousMeta = await readJson(META_FILE, {})
const previousData = {
  gear: await readJson(
    path.join(DATA_DIR, 'gear.json'),
    [],
  ),
  weapons: await readJson(
    path.join(DATA_DIR, 'weapons.json'),
    [],
  ),
  mods: await readJson(
    path.join(DATA_DIR, 'mods.json'),
    [],
  ),
}

const checkedAt = new Date().toISOString()

try {
  const [gear, weapons, mods] = await Promise.all([
    fetchJsonArray('gear.json', SOURCES.gear),
    fetchJsonArray('weapons.json', SOURCES.weapons),
    fetchJsonArray('mods.json', SOURCES.mods),
  ])

  const nextData = { gear, weapons, mods }

  const dataChanged =
    hash(previousData) !== hash(nextData)

  await Promise.all([
    writeJsonAtomically(
      path.join(DATA_DIR, 'gear.json'),
      gear,
    ),
    writeJsonAtomically(
      path.join(DATA_DIR, 'weapons.json'),
      weapons,
    ),
    writeJsonAtomically(
      path.join(DATA_DIR, 'mods.json'),
      mods,
    ),
  ])

  const metadata = {
    schemaVersion: 1,
    status: 'success',
    source: 'Ruben Alamina',
    lastCheckedAt: checkedAt,
    lastSuccessfulSyncAt: checkedAt,
    lastChangedAt: dataChanged
      ? checkedAt
      : previousMeta.lastChangedAt ??
        previousMeta.lastSuccessfulSyncAt ??
        checkedAt,
    dataChanged,
    counts: {
      gear: gear.length,
      weapons: weapons.length,
      mods: mods.length,
      total:
        gear.length +
        weapons.length +
        mods.length,
    },
    sourceUrls: SOURCES,
    error: null,
  }

  await writeJsonAtomically(META_FILE, metadata)

  console.log('Vendor synchronization succeeded.')
  console.log(`Data changed: ${dataChanged}`)
  console.log(`Gear: ${gear.length}`)
  console.log(`Weapons: ${weapons.length}`)
  console.log(`Mods: ${mods.length}`)
} catch (error) {
  const failureMetadata = {
    ...previousMeta,
    schemaVersion: 1,
    status: 'error',
    source: 'Ruben Alamina',
    lastCheckedAt: checkedAt,
    sourceUrls: SOURCES,
    error: error.message,
  }

  await writeJsonAtomically(
    META_FILE,
    failureMetadata,
  )

  console.error(
    `Vendor synchronization failed: ${error.message}`,
  )

  process.exitCode = 1
}

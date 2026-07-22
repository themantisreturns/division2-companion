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
const HISTORY_DIR = path.join(DATA_DIR, 'vendor-history')
const HISTORY_INDEX_FILE = path.join(HISTORY_DIR, 'index.json')
const META_FILE = path.join(DATA_DIR, 'vendor-meta.json')
const MAX_HISTORY_ENTRIES = 20

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

function clean(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function itemKey(kind, item) {
  return [
    kind,
    clean(item.vendor),
    clean(item.name),
    clean(item.brand),
    clean(item.slot),
    clean(item.weaponType ?? item.type ?? item.category),
  ].join('|')
}

function itemSignature(kind, item) {
  return hash({
    key: itemKey(kind, item),
    core: clean(item.core),
    attributes: clean(item.attributes),
    attribute1: clean(item.attribute1),
    attribute2: clean(item.attribute2),
    attribute3: clean(item.attribute3),
    talent: clean(item.talent),
    price: clean(item.price),
  })
}

function flatten(data) {
  return [
    ...data.gear.map((item) => ({ kind: 'gear', item })),
    ...data.weapons.map((item) => ({ kind: 'weapon', item })),
    ...data.mods.map((item) => ({ kind: 'mod', item })),
  ]
}

function compareVendorData(previous, next) {
  const previousMap = new Map(
    flatten(previous).map(({ kind, item }) => [
      itemKey(kind, item),
      itemSignature(kind, item),
    ]),
  )
  const nextMap = new Map(
    flatten(next).map(({ kind, item }) => [
      itemKey(kind, item),
      itemSignature(kind, item),
    ]),
  )

  let added = 0
  let removed = 0
  let changed = 0

  nextMap.forEach((signature, key) => {
    if (!previousMap.has(key)) added += 1
    else if (previousMap.get(key) !== signature) changed += 1
  })

  previousMap.forEach((_signature, key) => {
    if (!nextMap.has(key)) removed += 1
  })

  return { added, removed, changed }
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function fetchJsonArray(label, url) {
  const response = await fetch(`${url}?sync=${Date.now()}`, {
    headers: {
      'user-agent': 'division2-companion-vendor-sync/1.8',
    },
  })

  if (!response.ok) {
    throw new Error(`${label} request failed: ${response.status}`)
  }

  const value = await response.json()

  if (!Array.isArray(value)) {
    throw new Error(`${label} response was not a JSON array`)
  }

  return value
}

async function writeJsonAtomically(file, value) {
  const temporaryFile = `${file}.tmp`
  await writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporaryFile, file)
}

function createResetId(timestamp) {
  return timestamp.replaceAll(':', '-').replaceAll('.', '-')
}

await Promise.all([
  mkdir(DATA_DIR, { recursive: true }),
  mkdir(HISTORY_DIR, { recursive: true }),
])

const previousMeta = await readJson(META_FILE, {})
const previousHistory = await readJson(HISTORY_INDEX_FILE, { entries: [] })
const previousData = {
  gear: await readJson(path.join(DATA_DIR, 'gear.json'), []),
  weapons: await readJson(path.join(DATA_DIR, 'weapons.json'), []),
  mods: await readJson(path.join(DATA_DIR, 'mods.json'), []),
}

const checkedAt = new Date().toISOString()

try {
  const [gear, weapons, mods] = await Promise.all([
    fetchJsonArray('gear.json', SOURCES.gear),
    fetchJsonArray('weapons.json', SOURCES.weapons),
    fetchJsonArray('mods.json', SOURCES.mods),
  ])

  const nextData = { gear, weapons, mods }
  const dataChanged = hash(previousData) !== hash(nextData)
  const comparison = compareVendorData(previousData, nextData)

  await Promise.all([
    writeJsonAtomically(path.join(DATA_DIR, 'gear.json'), gear),
    writeJsonAtomically(path.join(DATA_DIR, 'weapons.json'), weapons),
    writeJsonAtomically(path.join(DATA_DIR, 'mods.json'), mods),
  ])

  let historyEntries = Array.isArray(previousHistory?.entries)
    ? previousHistory.entries
    : []
  let resetId = previousMeta.resetId ?? historyEntries[0]?.id ?? null

  if (dataChanged || historyEntries.length === 0) {
    resetId = createResetId(checkedAt)
    const snapshotFilename = `${resetId}.json`
    const snapshot = {
      schemaVersion: 1,
      id: resetId,
      capturedAt: checkedAt,
      counts: {
        gear: gear.length,
        weapons: weapons.length,
        mods: mods.length,
        total: gear.length + weapons.length + mods.length,
      },
      comparison,
      gear,
      weapons,
      mods,
    }

    await writeJsonAtomically(
      path.join(HISTORY_DIR, snapshotFilename),
      snapshot,
    )

    historyEntries = [
      {
        id: resetId,
        capturedAt: checkedAt,
        file: snapshotFilename,
        counts: snapshot.counts,
        comparison,
      },
      ...historyEntries.filter((entry) => entry.id !== resetId),
    ].slice(0, MAX_HISTORY_ENTRIES)

    await writeJsonAtomically(HISTORY_INDEX_FILE, {
      schemaVersion: 1,
      updatedAt: checkedAt,
      entries: historyEntries,
    })
  }

  const metadata = {
    schemaVersion: 2,
    status: 'success',
    source: 'Ruben Alamina',
    resetId,
    lastCheckedAt: checkedAt,
    lastSuccessfulSyncAt: checkedAt,
    lastChangedAt: dataChanged
      ? checkedAt
      : previousMeta.lastChangedAt ?? previousMeta.lastSuccessfulSyncAt ?? checkedAt,
    dataChanged,
    comparison,
    historyCount: historyEntries.length,
    counts: {
      gear: gear.length,
      weapons: weapons.length,
      mods: mods.length,
      total: gear.length + weapons.length + mods.length,
    },
    sourceUrls: SOURCES,
    error: null,
  }

  await writeJsonAtomically(META_FILE, metadata)

  console.log('Vendor synchronization succeeded.')
  console.log(`Data changed: ${dataChanged}`)
  console.log(`History snapshots: ${historyEntries.length}`)
  console.log(`Added: ${comparison.added}; changed: ${comparison.changed}; removed: ${comparison.removed}`)
} catch (error) {
  const failureMetadata = {
    ...previousMeta,
    schemaVersion: 2,
    status: 'error',
    source: 'Ruben Alamina',
    lastCheckedAt: checkedAt,
    sourceUrls: SOURCES,
    error: error.message,
  }

  await writeJsonAtomically(META_FILE, failureMetadata)
  console.error(`Vendor synchronization failed: ${error.message}`)
  process.exitCode = 1
}

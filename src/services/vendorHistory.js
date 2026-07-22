const HISTORY_INDEX_PATH = 'data/vendor-history/index.json'

let cachedIndex = null

function getUrl(path) {
  return `${import.meta.env.BASE_URL}${path}`
}

function normalizeEntry(entry) {
  return {
    id: String(entry?.id ?? ''),
    capturedAt: entry?.capturedAt ?? null,
    file: String(entry?.file ?? ''),
    counts: {
      gear: Number(entry?.counts?.gear) || 0,
      weapons: Number(entry?.counts?.weapons) || 0,
      mods: Number(entry?.counts?.mods) || 0,
      total: Number(entry?.counts?.total) || 0,
    },
    comparison: {
      added: Number(entry?.comparison?.added) || 0,
      changed: Number(entry?.comparison?.changed) || 0,
      removed: Number(entry?.comparison?.removed) || 0,
    },
  }
}

export async function loadVendorHistoryIndex({ force = false } = {}) {
  if (cachedIndex && !force) return cachedIndex

  try {
    const response = await fetch(
      `${getUrl(HISTORY_INDEX_PATH)}?t=${Date.now()}`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      throw new Error(`History index request failed (${response.status})`)
    }

    const value = await response.json()
    cachedIndex = {
      schemaVersion: Number(value?.schemaVersion) || 1,
      updatedAt: value?.updatedAt ?? null,
      entries: Array.isArray(value?.entries)
        ? value.entries.map(normalizeEntry).filter((entry) => entry.file)
        : [],
    }
  } catch (error) {
    console.warn('Vendor history is unavailable:', error)
    cachedIndex = {
      schemaVersion: 1,
      updatedAt: null,
      entries: [],
      error: error.message,
    }
  }

  return cachedIndex
}

export async function loadVendorHistorySnapshot(file) {
  if (!file || file.includes('..') || file.includes('/')) {
    throw new Error('Invalid vendor history filename.')
  }

  const response = await fetch(
    `${getUrl(`data/vendor-history/${file}`)}?t=${Date.now()}`,
    { cache: 'no-store' },
  )

  if (!response.ok) {
    throw new Error(`History snapshot request failed (${response.status})`)
  }

  const value = await response.json()
  return {
    id: value?.id ?? file.replace(/\.json$/i, ''),
    capturedAt: value?.capturedAt ?? null,
    counts: value?.counts ?? {},
    comparison: value?.comparison ?? {},
    gear: Array.isArray(value?.gear) ? value.gear : [],
    weapons: Array.isArray(value?.weapons) ? value.weapons : [],
    mods: Array.isArray(value?.mods) ? value.mods : [],
  }
}

export function clearVendorHistoryCache() {
  cachedIndex = null
}

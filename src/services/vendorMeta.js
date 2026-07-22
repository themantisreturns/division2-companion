const VENDOR_META_PATH =
  'data/vendor-meta.json'

let cachedVendorMeta = null

function getVendorMetaUrl() {
  return `${import.meta.env.BASE_URL}${VENDOR_META_PATH}`
}

function normalizeVendorMeta(value) {
  return {
    schemaVersion: Number(value?.schemaVersion) || 1,
    resetId: value?.resetId ?? null,
    status: value?.status ?? 'unknown',
    source: value?.source ?? 'Unknown source',
    lastCheckedAt: value?.lastCheckedAt ?? null,
    lastSuccessfulSyncAt:
      value?.lastSuccessfulSyncAt ?? null,
    lastChangedAt: value?.lastChangedAt ?? null,
    dataChanged: Boolean(value?.dataChanged),
    comparison: {
      added: Number(value?.comparison?.added) || 0,
      changed: Number(value?.comparison?.changed) || 0,
      removed: Number(value?.comparison?.removed) || 0,
    },
    historyCount: Number(value?.historyCount) || 0,
    counts: {
      gear: Number(value?.counts?.gear) || 0,
      weapons:
        Number(value?.counts?.weapons) || 0,
      mods: Number(value?.counts?.mods) || 0,
      total: Number(value?.counts?.total) || 0,
    },
    error: value?.error ?? null,
  }
}

export async function loadVendorMeta({
  force = false,
} = {}) {
  if (cachedVendorMeta && !force) {
    return cachedVendorMeta
  }

  try {
    const response = await fetch(
      `${getVendorMetaUrl()}?t=${Date.now()}`,
      { cache: 'no-store' },
    )

    if (!response.ok) {
      throw new Error(
        `Metadata request failed (${response.status})`,
      )
    }

    cachedVendorMeta = normalizeVendorMeta(
      await response.json(),
    )
  } catch (error) {
    console.warn(
      'Vendor metadata is unavailable:',
      error,
    )

    cachedVendorMeta = normalizeVendorMeta({
      status: 'unknown',
      error: error.message,
    })
  }

  return cachedVendorMeta
}

export function clearVendorMetaCache() {
  cachedVendorMeta = null
}

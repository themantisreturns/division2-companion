import { appState } from './state.js'
import { loadVendorData } from '../features/vendors/vendorData.js'
import { clearCatalogCache, loadCatalog } from '../services/catalog.js'

let currentVendorData = null
let currentGameCatalog = null

function normalizeVendorData(value, metadata = {}) {
  const gear = Array.isArray(value?.gear) ? value.gear : []
  const weapons = Array.isArray(value?.weapons) ? value.weapons : []
  const mods = Array.isArray(value?.mods) ? value.mods : []

  return {
    gear,
    weapons,
    mods,
    total: gear.length + weapons.length + mods.length,
    source: metadata.source ?? value?.source ?? 'bundled',
    importedAt: metadata.importedAt ?? value?.importedAt ?? null,
  }
}

function getSavedVendorImport() {
  return appState.activeProfile?.app_settings?.vendor_import ?? null
}

export async function ensureVendorData() {
  const savedImport = getSavedVendorImport()

  if (savedImport) {
    const importedAt = savedImport.importedAt ?? null

    if (
      !currentVendorData ||
      currentVendorData.source !== 'profile-import' ||
      currentVendorData.importedAt !== importedAt
    ) {
      currentVendorData = normalizeVendorData(savedImport, {
        source: 'profile-import',
        importedAt,
      })
    }

    return currentVendorData
  }

  if (!currentVendorData || currentVendorData.source === 'profile-import') {
    const bundledData = await loadVendorData()
    currentVendorData = normalizeVendorData(bundledData, {
      source: 'bundled',
    })
  }

  return currentVendorData
}

export function setVendorDataOverride(value) {
  currentVendorData = normalizeVendorData(value, {
    source: 'profile-import',
    importedAt: value?.importedAt ?? null,
  })

  return currentVendorData
}

export function clearVendorDataCache() {
  currentVendorData = null
}

export async function ensureGameCatalog() {
  if (currentGameCatalog) return currentGameCatalog

  try {
    currentGameCatalog = await loadCatalog()
    return currentGameCatalog
  } catch (error) {
    console.warn('Generated catalog is unavailable:', error)
    return null
  }
}

export function resetCatalogData() {
  clearCatalogCache()
  currentGameCatalog = null
}

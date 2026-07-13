const CATALOG_PATH = 'catalog/catalog.json'

let cachedCatalog = null

function getCatalogUrl() {
  return `${import.meta.env.BASE_URL}${CATALOG_PATH}`
}

function assertCatalog(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Catalog response was not an object.')
  }

  if (!data.categories || typeof data.categories !== 'object') {
    throw new Error('Catalog is missing its categories object.')
  }

  return data
}

export async function loadCatalog({ force = false } = {}) {
  if (cachedCatalog && !force) {
    return cachedCatalog
  }

  const response = await fetch(getCatalogUrl(), {
    cache: force ? 'no-store' : 'default',
  })

  if (!response.ok) {
    throw new Error(
      `Could not load the game catalog (${response.status}). ` +
      'Run npm run catalog:build first.',
    )
  }

  cachedCatalog = assertCatalog(await response.json())
  return cachedCatalog
}

export function getExpertiseCatalog(catalog) {
  const categories = catalog?.categories ?? {}

  return {
    weapons: (categories.weapons ?? []).map((item) => item.name),
    namedGear: (categories.namedGear ?? []).map((item) => item.name),
    exotics: (categories.exotics ?? []).map((item) => item.name),
    skills: (categories.skills ?? []).map((item) => item.name),
    specializations: (categories.specializations ?? []).map(
      (item) => item.name,
    ),
    brands: (categories.brands ?? []).map((item) => item.name),
    gearSets: (categories.gearSets ?? []).map((item) => item.name),
  }
}

export function clearCatalogCache() {
  cachedCatalog = null
}

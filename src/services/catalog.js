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

function cloneItems(items) {
  return (items ?? []).map((item) =>
    typeof item === 'string' ? { name: item } : { ...item },
  )
}

export function getExpertiseCatalog(catalog) {
  const categories = catalog?.categories ?? {}

  return {
    weapons: cloneItems(categories.weapons),
    namedGear: cloneItems(categories.namedGear),
    exotics: cloneItems(categories.exotics),
    skills: cloneItems(categories.skills),
    specializations: cloneItems(categories.specializations),
    brands: cloneItems(categories.brands),
    gearSets: cloneItems(categories.gearSets),
  }
}

export function clearCatalogCache() {
  cachedCatalog = null
}

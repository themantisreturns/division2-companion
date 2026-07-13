const DATA_FILES = {
  gear: 'data/gear.json',
  weapons: 'data/weapons.json',
  mods: 'data/mods.json',
}

function getBasePath() {
  return import.meta.env.BASE_URL
}

async function loadJsonFile(path) {
  const response = await fetch(`${getBasePath()}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `Could not load ${path}. Server returned ${response.status}.`,
    )
  }

  const data = await response.json()

  if (!Array.isArray(data)) {
    throw new Error(`${path} did not contain a valid item list.`)
  }

  return data
}

export async function loadVendorData() {
  const [gear, weapons, mods] = await Promise.all([
    loadJsonFile(DATA_FILES.gear),
    loadJsonFile(DATA_FILES.weapons),
    loadJsonFile(DATA_FILES.mods),
  ])

  return {
    gear,
    weapons,
    mods,
    total: gear.length + weapons.length + mods.length,
  }
}
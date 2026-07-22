const ARMOR_SLOTS = ['mask', 'chest', 'holster', 'backpack', 'gloves', 'kneepads']

function normalize(value) {
  return String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function selectionValue(category, name, slotKey) {
  return category === 'brands' || category === 'gearSets'
    ? `${category}|${name}|${slotKey}`
    : `${category}|${name}`
}

function displayName(category, name, slotKey) {
  return category === 'brands' || category === 'gearSets'
    ? `${name} ${slotKey[0].toUpperCase()}${slotKey.slice(1)}`
    : name
}

function quantityFor(inventory, category, name, slotKey) {
  const group = inventory?.items?.[category] ?? {}
  const exact = Number(group[displayName(category, name, slotKey)]) || Number(group[name]) || 0
  return exact
}

function catalogMatch(catalog, category, requestedName) {
  return (catalog?.categories?.[category] ?? []).find((item) => normalize(item.name) === normalize(requestedName)) ?? null
}

function scannedFallback(inventory, slotKey) {
  const suffix = slotKey[0].toUpperCase() + slotKey.slice(1)
  return (inventory?.scannedCopies ?? [])
    .filter((copy) => ARMOR_SLOTS.includes(slotKey)
      ? normalize(copy.slot || copy.name).includes(normalize(slotKey))
      : copy.category === 'weapons' || copy.category === 'exotics')
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))[0] ?? null
}

export function generateBuildFromTemplate({ template, catalog, inventory, ownedOnly = true }) {
  const slots = {}
  const missing = []
  let ownedCount = 0

  for (const [slotKey, spec] of Object.entries(template?.slots ?? {})) {
    const [category, requestedName] = spec
    const match = catalogMatch(catalog, category, requestedName)
    if (!match) continue
    const owned = quantityFor(inventory, category, match.name, slotKey) > 0

    if (!ownedOnly || owned) {
      slots[slotKey] = selectionValue(category, match.name, slotKey)
      if (owned) ownedCount += 1
      else missing.push(displayName(category, match.name, slotKey))
      continue
    }

    const fallback = scannedFallback(inventory, slotKey)
    if (fallback) {
      slots[slotKey] = selectionValue(fallback.category, fallback.name, slotKey)
      ownedCount += 1
    } else {
      missing.push(displayName(category, match.name, slotKey))
    }
  }

  const total = Object.keys(template?.slots ?? {}).length
  const completion = total ? Math.round((ownedCount / total) * 100) : 0
  return {
    slots,
    missing,
    completion,
    summary: ownedOnly
      ? `Generated from reviewed and tracked inventory. ${ownedCount}/${total} recommended armor slots filled (${completion}%).`
      : `Dream build generated. ${missing.length ? `${missing.length} recommended item${missing.length === 1 ? '' : 's'} still need farming.` : 'All recommended items are already owned.'}`,
  }
}

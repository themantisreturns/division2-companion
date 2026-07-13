const WEAPON_CATEGORY_ALIASES = {
  rifle: 'Rifles', rifles: 'Rifles',
  'assault rifle': 'Assault Rifles', 'assault rifles': 'Assault Rifles', ar: 'Assault Rifles',
  'marksman rifle': 'Marksman Rifles', 'marksman rifles': 'Marksman Rifles', mmr: 'Marksman Rifles',
  shotgun: 'Shotguns', shotguns: 'Shotguns',
  smg: 'SMGs', smgs: 'SMGs', 'submachine gun': 'SMGs', 'submachine guns': 'SMGs',
  lmg: 'LMGs', lmgs: 'LMGs', 'light machine gun': 'LMGs', 'light machine guns': 'LMGs',
  pistol: 'Pistols', pistols: 'Pistols', sidearm: 'Pistols', sidearms: 'Pistols',
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function getWeaponCategory(item) {
  for (const candidate of [item.weaponType, item.type, item.category, item.class, item.slot]) {
    const normalized = normalizeText(candidate)
    if (WEAPON_CATEGORY_ALIASES[normalized]) return WEAPON_CATEGORY_ALIASES[normalized]
    for (const [alias, category] of Object.entries(WEAPON_CATEGORY_ALIASES)) {
      if (normalized.includes(alias)) return category
    }
  }
  return null
}

function getBrandRank(progress, brandName) {
  const brands = progress?.ranks?.brands ?? progress?.brands ?? {}
  const target = normalizeText(brandName)
  const match = Object.entries(brands).find(([name]) => normalizeText(name) === target)
  return match ? Number(match[1]) || 0 : null
}

function priorityFromRank(rank) {
  if (rank === 0) return 5
  if (rank <= 3) return 4
  if (rank <= 6) return 3
  if (rank <= 8) return 2
  return 1
}

function isNamed(item) {
  return /named/i.test(String(item?.rarity ?? ''))
}

function exactStatus(progress, kind, name) {
  return progress?.individual?.[kind]?.[name]
}

function createGearRecommendations(gear, progress) {
  return gear.map((item) => {
    if (isNamed(item)) {
      if (exactStatus(progress, 'namedGear', item.name) === true) return null
      return {
        id: ['gear', item.vendor, item.name].join('|'),
        kind: 'Named Gear', name: item.name, vendor: item.vendor || 'Unknown Vendor',
        priority: 5, reason: 'This exact named item is not marked proficient.',
        progressLabel: 'Exact item', recommendationType: 'exact-item', sourceItem: item,
      }
    }

    const rank = getBrandRank(progress, item.brand)
    if (rank === null || rank >= 10) return null

    return {
      id: ['gear', item.vendor, item.name, item.brand].join('|'),
      kind: 'Gear', name: item.name || `${item.brand} gear`, vendor: item.vendor || 'Unknown Vendor',
      priority: priorityFromRank(rank), reason: `${item.brand} proficiency is rank ${rank}/10`,
      progressLabel: `${rank}/10`, recommendationType: 'expertise', sourceItem: item,
    }
  }).filter(Boolean)
}

function createWeaponRecommendations(weapons, progress) {
  return weapons.map((item) => {
    const exact = exactStatus(progress, 'weapons', item.name)
    if (exact === true) return null

    if (exact === false || exact === undefined) {
      const category = getWeaponCategory(item)
      const summary = progress?.legacySummary?.weapons?.[category] ?? progress?.weapons?.[category]
      const label = summary ? `${summary.current ?? 0}/${summary.total ?? 0}` : 'Exact item'

      return {
        id: ['weapon', item.vendor, item.name].join('|'),
        kind: 'Weapon', name: item.name || 'Unknown weapon', vendor: item.vendor || 'Unknown Vendor',
        category, priority: 5,
        reason: exact === false
          ? 'This exact weapon is marked not proficient.'
          : 'This exact weapon has not been marked proficient yet.',
        progressLabel: label, recommendationType: 'exact-item', sourceItem: item,
      }
    }

    return null
  }).filter(Boolean)
}

function removeDuplicates(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.id.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function createVendorRecommendations(vendorData, progress) {
  if (!vendorData || !progress) return []

  return removeDuplicates([
    ...createGearRecommendations(vendorData.gear ?? [], progress),
    ...createWeaponRecommendations(vendorData.weapons ?? [], progress),
  ]).sort((a, b) => b.priority - a.priority || a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name))
}

export function groupRecommendationsByVendor(recommendations) {
  return recommendations.reduce((groups, recommendation) => {
    ;(groups[recommendation.vendor] ??= []).push(recommendation)
    return groups
  }, {})
}

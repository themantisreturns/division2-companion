const WEAPON_CATEGORY_ALIASES = {
  rifle: 'Rifles',
  rifles: 'Rifles',

  'assault rifle': 'Assault Rifles',
  'assault rifles': 'Assault Rifles',
  ar: 'Assault Rifles',

  'marksman rifle': 'Marksman Rifles',
  'marksman rifles': 'Marksman Rifles',
  mmr: 'Marksman Rifles',

  shotgun: 'Shotguns',
  shotguns: 'Shotguns',

  smg: 'SMGs',
  smgs: 'SMGs',
  'submachine gun': 'SMGs',
  'submachine guns': 'SMGs',

  lmg: 'LMGs',
  lmgs: 'LMGs',
  'light machine gun': 'LMGs',
  'light machine guns': 'LMGs',

  pistol: 'Pistols',
  pistols: 'Pistols',
  sidearm: 'Pistols',
  sidearms: 'Pistols',
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function getWeaponCategory(item) {
  const candidates = [
    item.weaponType,
    item.type,
    item.category,
    item.class,
    item.slot,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate)

    if (WEAPON_CATEGORY_ALIASES[normalized]) {
      return WEAPON_CATEGORY_ALIASES[normalized]
    }

    for (const [alias, category] of Object.entries(
      WEAPON_CATEGORY_ALIASES,
    )) {
      if (normalized.includes(alias)) {
        return category
      }
    }
  }

  return null
}

function getBrandRank(progress, brandName) {
  if (!brandName) {
    return null
  }

  const brands = progress?.brands ?? {}
  const normalizedTarget = normalizeText(brandName)

  const matchingEntry = Object.entries(brands).find(
    ([savedBrand]) =>
      normalizeText(savedBrand) === normalizedTarget,
  )

  return matchingEntry ? Number(matchingEntry[1]) || 0 : null
}

function calculateBrandPriority(rank) {
  if (rank === 0) return 5
  if (rank <= 3) return 4
  if (rank <= 6) return 3
  if (rank <= 8) return 2
  return 1
}

function calculateWeaponPriority(current, total) {
  if (!total || current >= total) {
    return 0
  }

  const completion = current / total

  if (completion <= 0.1) return 5
  if (completion <= 0.3) return 4
  if (completion <= 0.55) return 3
  if (completion <= 0.8) return 2
  return 1
}

function createGearRecommendations(gear, expertiseProgress) {
  return gear
    .map((item) => {
      const brand = item.brand
      const rank = getBrandRank(expertiseProgress, brand)

      if (rank === null || rank >= 10) {
        return null
      }

      return {
        id: [
          'gear',
          item.vendor,
          item.name,
          item.brand,
          item.slot,
        ].join('|'),

        kind: 'Gear',
        name: item.name || `${brand} gear`,
        vendor: item.vendor || 'Unknown Vendor',
        brand,
        slot: item.slot || 'Gear',
        priority: calculateBrandPriority(rank),
        reason: `${brand} proficiency is rank ${rank}/10`,
        progressLabel: `${rank}/10`,
        recommendationType: 'expertise',
        sourceItem: item,
      }
    })
    .filter(Boolean)
}

function createWeaponRecommendations(
  weapons,
  expertiseProgress,
) {
  const weaponProgress = expertiseProgress?.weapons ?? {}

  return weapons
    .map((item) => {
      const category = getWeaponCategory(item)

      if (!category || !weaponProgress[category]) {
        return null
      }

      const progress = weaponProgress[category]
      const current = Number(progress.current) || 0
      const total = Number(progress.total) || 0

      if (!total || current >= total) {
        return null
      }

      const priority = calculateWeaponPriority(current, total)

      if (!priority) {
        return null
      }

      return {
        id: [
          'weapon',
          item.vendor,
          item.name,
          category,
        ].join('|'),

        kind: 'Weapon',
        name: item.name || 'Unknown weapon',
        vendor: item.vendor || 'Unknown Vendor',
        category,
        priority,
        reason:
          `${category} proficiency is only ` +
          `${current}/${total}. Check whether this exact weapon is still needed.`,
        progressLabel: `${current}/${total}`,
        recommendationType: 'verify-weapon',
        sourceItem: item,
      }
    })
    .filter(Boolean)
}

function removeDuplicates(recommendations) {
  const seen = new Set()

  return recommendations.filter((recommendation) => {
    const key = recommendation.id.toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function createVendorRecommendations(
  vendorData,
  expertiseProgress,
) {
  if (!vendorData || !expertiseProgress) {
    return []
  }

  const recommendations = [
    ...createGearRecommendations(
      vendorData.gear ?? [],
      expertiseProgress,
    ),

    ...createWeaponRecommendations(
      vendorData.weapons ?? [],
      expertiseProgress,
    ),
  ]

  return removeDuplicates(recommendations).sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority
    }

    const vendorComparison = a.vendor.localeCompare(b.vendor)

    if (vendorComparison !== 0) {
      return vendorComparison
    }

    return a.name.localeCompare(b.name)
  })
}

export function groupRecommendationsByVendor(
  recommendations,
) {
  return recommendations.reduce((groups, recommendation) => {
    const vendor = recommendation.vendor

    if (!groups[vendor]) {
      groups[vendor] = []
    }

    groups[vendor].push(recommendation)
    return groups
  }, {})
}
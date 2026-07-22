import { evaluateVendorGear } from '../knowledge/knowledgeEngine.js'
import { getInventoryQuantity, getSavedBuildMatches, isWishlisted } from '../../services/intelligence/context.js'
import { createPersonalScore, scoreToVerdict } from '../../services/intelligence/scoring.js'

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

function isNamed(item) {
  return /named/i.test(String(item?.rarity ?? ''))
}

function exactStatus(progress, kind, name) {
  return progress?.individual?.[kind]?.[name]
}

function getGearIdentity(item) {
  const name = item.name || `${item.brand || 'Unknown'} ${item.slot || 'Gear'}`
  const candidates = [name, item.brand && item.slot ? `${item.brand} ${item.slot}` : '', item.brand]
  const category = isNamed(item) ? 'namedGear' : /gear set/i.test(String(item.rarity ?? '')) ? 'gearSets' : 'brands'
  const inventoryName = category === 'brands' || category === 'gearSets'
    ? `${item.brand || name} ${item.slot || 'Gear'}`
    : name
  return { name, candidates, category, inventoryName }
}

function getWeaponIdentity(item) {
  const name = item.name || 'Unknown weapon'
  return { name, candidates: [name], category: 'weapons', inventoryName: name }
}

function createReasons({ wishlist, owned, buildMatches, expertiseReason, lootAdvice, named }) {
  const reasons = []
  if (wishlist) reasons.push('Matches your wishlist')
  if (buildMatches.length) reasons.push(`Used in ${buildMatches.slice(0, 2).join(' and ')}`)
  if (!owned) reasons.push(named ? 'Missing named item' : 'Not currently owned')
  if (expertiseReason) reasons.push(expertiseReason)
  if (lootAdvice?.score >= 80) reasons.push(`Strong roll profile: ${lootAdvice.verdict}`)
  return reasons.length ? reasons : ['No meaningful personal upgrade identified']
}

function createGearRecommendation(item, progress, context) {
  const identity = getGearIdentity(item)
  const lootAdvice = evaluateVendorGear(item)
  const owned = getInventoryQuantity(context.inventory, identity.candidates)
  const wishlist = isWishlisted(context.inventory, identity.candidates)
  const buildMatches = getSavedBuildMatches(context.buildsState, identity.candidates)
  const named = isNamed(item)

  let expertiseReason = ''
  let expertisePoints = 0
  if (named) {
    if (exactStatus(progress, 'namedGear', item.name) !== true) {
      expertiseReason = 'Exact named item is not marked proficient'
      expertisePoints = 20
    }
  } else {
    const rank = getBrandRank(progress, item.brand)
    if (rank !== null && rank < 10) {
      expertiseReason = `${item.brand} proficiency is ${rank}/10`
      expertisePoints = Math.max(5, 20 - rank * 2)
    }
  }

  const score = createPersonalScore({
    baseScore: lootAdvice?.score ?? 45,
    wishlist,
    buildMatches,
    owned,
    named,
    expertisePoints,
  })

  const reasons = createReasons({ wishlist, owned, buildMatches, expertiseReason, lootAdvice, named })

  return {
    id: ['gear', item.vendor, identity.name, item.brand, item.slot].join('|'),
    kind: named ? 'Named Gear' : 'Gear',
    name: identity.name,
    vendor: item.vendor || 'Unknown Vendor',
    score,
    priority: Math.max(1, Math.ceil(score / 20)),
    verdict: scoreToVerdict(score),
    reason: reasons.join(' · '),
    reasons,
    progressLabel: wishlist ? 'Wishlist' : buildMatches.length ? `${buildMatches.length} build${buildMatches.length === 1 ? '' : 's'}` : owned ? `Owned: ${owned}` : 'Missing',
    recommendationType: wishlist ? 'wishlist' : buildMatches.length ? 'build' : expertiseReason ? 'expertise' : 'general',
    sourceItem: item,
    owned,
    wishlist,
    buildMatches,
    wishlistKey: `${identity.category}|||${identity.inventoryName}`,
  }
}

function createWeaponRecommendation(item, progress, context) {
  const identity = getWeaponIdentity(item)
  const owned = getInventoryQuantity(context.inventory, identity.candidates)
  const wishlist = isWishlisted(context.inventory, identity.candidates)
  const buildMatches = getSavedBuildMatches(context.buildsState, identity.candidates)
  const exact = exactStatus(progress, 'weapons', item.name)
  const needsExpertise = exact !== true
  const category = getWeaponCategory(item)

  const score = Math.min(100, createPersonalScore({
    baseScore: item.talent && item.talent !== '-' ? 58 : 45,
    wishlist,
    buildMatches,
    owned,
    named: false,
    expertisePoints: needsExpertise ? 20 : 0,
  }))

  const expertiseReason = needsExpertise
    ? exact === false
      ? 'Exact weapon is marked not proficient'
      : 'Exact weapon has not been marked proficient'
    : ''
  const reasons = createReasons({ wishlist, owned, buildMatches, expertiseReason, named: false })

  return {
    id: ['weapon', item.vendor, identity.name].join('|'),
    kind: 'Weapon',
    name: identity.name,
    vendor: item.vendor || 'Unknown Vendor',
    category,
    score,
    priority: Math.max(1, Math.ceil(score / 20)),
    verdict: scoreToVerdict(score),
    reason: reasons.join(' · '),
    reasons,
    progressLabel: wishlist ? 'Wishlist' : buildMatches.length ? `${buildMatches.length} build${buildMatches.length === 1 ? '' : 's'}` : owned ? `Owned: ${owned}` : 'Missing',
    recommendationType: wishlist ? 'wishlist' : buildMatches.length ? 'build' : needsExpertise ? 'expertise' : 'general',
    sourceItem: item,
    owned,
    wishlist,
    buildMatches,
    wishlistKey: `weapons|||${identity.inventoryName}`,
  }
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

export function createVendorRecommendations(vendorData, progress = {}, context = {}) {
  if (!vendorData) return []

  const normalizedContext = {
    inventory: context.inventory ?? { items: {}, wishlist: [] },
    buildsState: context.buildsState ?? { builds: [] },
  }

  return removeDuplicates([
    ...(vendorData.gear ?? []).map((item) => createGearRecommendation(item, progress, normalizedContext)),
    ...(vendorData.weapons ?? []).map((item) => createWeaponRecommendation(item, progress, normalizedContext)),
  ])
    .filter((item) => item.score >= 35)
    .sort((a, b) => b.score - a.score || a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name))
}

export function groupRecommendationsByVendor(recommendations) {
  return recommendations.reduce((groups, recommendation) => {
    ;(groups[recommendation.vendor] ??= []).push(recommendation)
    return groups
  }, {})
}

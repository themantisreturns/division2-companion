import { getInventoryHealth, buildDuplicateGroups } from '../features/inventory/inventoryIntelligence.js'

function normalizeDecision(value) {
  return String(value ?? '').toLowerCase()
}

function summarizeLoot(history = []) {
  return history.reduce((summary, entry) => {
    const decision = normalizeDecision(entry?.decision)
    if (decision.includes('keep')) summary.kept += 1
    else if (decision.includes('donat')) summary.donated += 1
    else if (decision.includes('dismant')) summary.dismantled += 1
    return summary
  }, { kept: 0, donated: 0, dismantled: 0 })
}

function getBuildCompletion(build = {}) {
  const slots = Object.values(build?.slots ?? {}).filter(Boolean).length
  return Math.round((slots / 9) * 100)
}

function pickBuildPriority(builds = []) {
  if (!builds.length) return null
  return builds
    .map((build) => ({
      build,
      completion: getBuildCompletion(build),
    }))
    .sort((a, b) => a.completion - b.completion || String(a.build?.name ?? '').localeCompare(String(b.build?.name ?? '')))[0]
}

function pickVendorPriority(recommendations = [], purchasedIds = []) {
  const purchased = new Set(purchasedIds)
  return recommendations.find((item) => !purchased.has(item.id)) ?? null
}

function pickFarmingPriority(inventory = {}, builds = [], vendorPriority = null) {
  const wishlist = Array.isArray(inventory?.wishlist) ? inventory.wishlist : []
  if (wishlist.length) {
    const first = String(wishlist[0]).split('|||').pop() || 'wishlist item'
    return {
      title: 'Farm a wishlist item',
      detail: first,
      reason: `${wishlist.length} wishlist item${wishlist.length === 1 ? '' : 's'} still missing`,
    }
  }

  const buildPriority = pickBuildPriority(builds)
  if (buildPriority && buildPriority.completion < 100) {
    return {
      title: `Finish ${buildPriority.build?.name || 'your build'}`,
      detail: `${buildPriority.completion}% configured`,
      reason: 'Complete the lowest-progress saved build first',
    }
  }

  if (vendorPriority) {
    return {
      title: 'Visit a vendor',
      detail: vendorPriority.vendor,
      reason: `${vendorPriority.name} is your top current recommendation`,
    }
  }

  return {
    title: 'Scan new loot',
    detail: 'Inventory scanner',
    reason: 'More reviewed items improve every recommendation',
  }
}

export function createCommandCenterSummary({ inventory = {}, buildsState = {}, recommendations = [], purchasedIds = [], expertiseProgress = {} }) {
  const health = getInventoryHealth(inventory)
  const duplicateGroups = buildDuplicateGroups(inventory)
  const history = Array.isArray(inventory?.lootHistory) ? inventory.lootHistory : []
  const loot = summarizeLoot(history)
  const builds = Array.isArray(buildsState?.builds) ? buildsState.builds : []
  const buildPriority = pickBuildPriority(builds)
  const vendorPriority = pickVendorPriority(recommendations, purchasedIds)
  const farmPriority = pickFarmingPriority(inventory, builds, vendorPriority)
  const wishlistCount = Array.isArray(inventory?.wishlist) ? inventory.wishlist.length : 0
  const proficiencyReady = duplicateGroups.reduce((sum, group) => sum + Math.max(0, group.quantity - 1), 0)

  return {
    inventory: {
      total: health.totalCopies,
      unique: health.uniqueOwned,
      duplicates: health.duplicateCopies,
      reviewed: health.reviewedCopies,
      strong: health.strongCopies,
    },
    wishlistCount,
    loot,
    vendorPriority,
    buildPriority,
    farmPriority,
    expertise: {
      level: Number(expertiseProgress?.level) || 0,
      donationCandidates: proficiencyReady,
    },
    checklist: [
      { label: 'Check top vendor recommendation', done: !vendorPriority },
      { label: 'Review duplicate items', done: health.duplicateCopies === 0 },
      { label: 'Scan new loot', done: history.length > 0 },
      { label: 'Advance a saved build', done: !buildPriority || buildPriority.completion >= 100 },
    ],
  }
}

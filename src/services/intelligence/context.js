import { normalizeText } from './text.js'

export function getInventoryQuantity(inventory = {}, candidates = []) {
  const targets = candidates.map(normalizeText).filter(Boolean)
  let quantity = 0
  Object.values(inventory.items ?? {}).forEach((categoryItems) => {
    Object.entries(categoryItems ?? {}).forEach(([name, count]) => {
      const normalizedName = normalizeText(name)
      if (targets.some((target) => normalizedName === target || normalizedName.includes(target))) {
        quantity += Number(count) || 0
      }
    })
  })
  return quantity
}

export function isWishlisted(inventory = {}, candidates = []) {
  const targets = candidates.map(normalizeText).filter(Boolean)
  return (inventory.wishlist ?? []).some((key) => {
    const name = String(key).split('|||').at(-1)
    const normalizedName = normalizeText(name)
    return targets.some((target) => normalizedName === target || normalizedName.includes(target))
  })
}

export function getSavedBuildMatches(buildsState = {}, candidates = []) {
  const targets = candidates.map(normalizeText).filter(Boolean)
  return (buildsState.builds ?? []).filter((build) => Object.values(build.slots ?? {}).some((selection) => {
    const normalizedSelection = normalizeText(selection)
    return targets.some((target) => normalizedSelection.includes(target))
  })).map((build) => build.name)
}

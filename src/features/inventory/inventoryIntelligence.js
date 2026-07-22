import { evaluateGearItem } from '../knowledge/knowledgeEngine.js'

const SLOT_PATTERN = /(Mask|Chest|Holster|Backpack|Gloves|Kneepads)$/

export function getInventoryHealth(inventory = {}) {
  const quantities = Object.values(inventory.items ?? {}).flatMap((items) => Object.values(items ?? {}).map(Number))
  const uniqueOwned = quantities.filter((value) => value > 0).length
  const totalCopies = quantities.reduce((sum, value) => sum + (Number(value) || 0), 0)
  const duplicateCopies = quantities.reduce((sum, value) => sum + Math.max(0, (Number(value) || 0) - 1), 0)
  const reviewedCopies = inventory.scannedCopies?.length ?? 0
  const strongCopies = (inventory.scannedCopies ?? []).filter((copy) => Number(copy.score) >= 78).length
  return { uniqueOwned, totalCopies, duplicateCopies, reviewedCopies, strongCopies }
}

export function buildDuplicateGroups(inventory = {}) {
  const groups = []
  Object.entries(inventory.items ?? {}).forEach(([category, items]) => {
    Object.entries(items ?? {}).forEach(([name, rawQuantity]) => {
      const quantity = Number(rawQuantity) || 0
      if (quantity < 2) return
      const copies = (inventory.scannedCopies ?? [])
        .filter((copy) => copy.category === category && copy.name === name)
        .sort((a, b) => Number(b.score) - Number(a.score))
      groups.push({ category, name, quantity, copies, unreviewed: Math.max(0, quantity - copies.length) })
    })
  })
  return groups.sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
}

export function assessScannedCopy({ category, name, item = {}, result = {} }) {
  const slot = result.match?.slot ?? name.match(SLOT_PATTERN)?.[1] ?? ''
  const evaluation = evaluateGearItem({
    ...item,
    itemType: category === 'weapons' ? 'weapon' : 'armor',
    category: category === 'weapons' ? (item.category ?? item.family ?? '') : '',
    slot,
    attributes: (result.attributes ?? []).join(' '),
    talent: result.talent ?? '',
    rarity: item.rarity ?? (category === 'exotics' ? 'Exotic' : ''),
  })
  return evaluation
}

export function rankCopy(copy, index) {
  const score = Number(copy.score) || 0
  if (index === 0 && score >= 70) return { verdict: 'KEEP BEST', tier: 'excellent' }
  if (score >= 78) return { verdict: 'KEEP', tier: 'good' }
  if (score >= 55) return { verdict: 'DONATE', tier: 'situational' }
  return { verdict: 'DISMANTLE', tier: 'low' }
}

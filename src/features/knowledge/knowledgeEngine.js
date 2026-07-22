import { evaluateArmor, evaluateItem, evaluateWeapon, findNamedItemRule } from '../../services/intelligence/evaluator.js'
import { normalizeText } from '../../services/intelligence/text.js'

export { findNamedItemRule }
export const normalizeKnowledgeText = normalizeText

export function extractVendorGearItem(item = {}) {
  const category = item.category ?? item.weaponType ?? item.type ?? ''
  const isWeapon = Boolean(category) && /rifle|smg|lmg|shotgun|pistol/i.test(category)
  return {
    itemType: isWeapon ? 'weapon' : 'armor',
    name: item.name ?? '',
    brand: item.brand ?? '',
    slot: item.slot ?? '',
    category,
    talent: item.talent ?? item.talents ?? '',
    attributes: [item.core, item.attributes, item.mods, item.attribute].filter(Boolean).join(' '),
    rarity: item.rarity ?? '',
  }
}

export function evaluateGearItem(item = {}) {
  return evaluateItem(item)
}

export function evaluateWeaponItem(item = {}) {
  return evaluateWeapon(item)
}

export function evaluateArmorItem(item = {}) {
  return evaluateArmor(item)
}

export function evaluateVendorGear(item = {}) {
  return evaluateItem(extractVendorGearItem(item))
}

export function getCollectionGuidance(item = {}, category = '') {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) return { ...namedRule, builds: [] }
  if (category === 'exotics') return { score: 90, verdict: 'Keep one', tier: 'exotic', reason: 'Keep at least one copy of each exotic; compare duplicate rolls before deconstructing.' }
  if (category === 'weapons') return { score: 58, verdict: 'Compare talent and third attribute', tier: 'weapon', reason: 'Weapon value depends on its category, base model, talent, and third attribute. Use Gear Advisor before deleting strong or named copies.' }
  if (category === 'namedGear') return { score: 78, verdict: 'Keep one', tier: 'named', reason: 'Named gear can have unique talents or attributes. Keep the best copy.' }
  if (category === 'gearSets') return { score: 65, verdict: 'Keep useful slots', tier: 'set', reason: 'Useful gear-set pieces exist in all six armor slots; keep well-rolled copies that preserve build flexibility.' }
  if (category === 'brands') return { score: 55, verdict: 'Keep selectively', tier: 'brand', reason: 'Value depends on slot, talent, and rolls. Gear Advisor evaluates all six armor slots.' }
  return { score: 45, verdict: 'Compare copies', tier: 'general', reason: 'Keep the best roll and donate lower-value duplicates for Expertise when appropriate.' }
}

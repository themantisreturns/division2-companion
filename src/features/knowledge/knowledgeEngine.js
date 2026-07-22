import { BUILD_ARCHETYPES, GEAR_RULES, NAMED_ITEM_RULES, WEAPON_RULES } from './knowledgeData.js'

export function normalizeKnowledgeText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%']+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function includesText(haystack, needle) {
  return normalizeKnowledgeText(haystack).includes(normalizeKnowledgeText(needle))
}

function listMatches(value, accepted = []) {
  if (!accepted.length) return true
  return accepted.some((candidate) => includesText(value, candidate))
}

function attributeMatches(itemText, attributes = []) {
  if (!attributes.length) return { matched: 0, total: 0, missing: [] }
  const missing = attributes.filter((attribute) => !includesText(itemText, attribute))
  return { matched: attributes.length - missing.length, total: attributes.length, missing }
}

function bestRuleResult(rules, itemText) {
  return rules
    .map((rule) => {
      const attributeResult = attributeMatches(itemText, rule.attributes)
      const talentRequired = rule.talents?.length > 0
      const talentMatch = !talentRequired || listMatches(itemText, rule.talents)
      const talentPenalty = talentRequired && !talentMatch ? 14 : 0
      const score = Math.max(0, rule.score - attributeResult.missing.length * 12 - talentPenalty)
      return { rule, score, attributeResult, talentMatch }
    })
    .sort((a, b) => b.score - a.score)[0] ?? null
}

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

export function findNamedItemRule(name) {
  return NAMED_ITEM_RULES.find((rule) => rule.names.some((candidate) => normalizeKnowledgeText(candidate) === normalizeKnowledgeText(name))) ?? null
}

function namedOrExoticResult(item) {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) return { ...namedRule, builds: [], matchedRuleId: 'named-item', recalibration: 'Keep the best rolled copy and compare duplicates.' }

  const rarity = normalizeKnowledgeText(item.rarity)
  if (rarity.includes('exotic')) {
    return { score: 95, verdict: 'Keep one', tier: 'exotic', reason: 'Exotics have unique talents and may be difficult to replace. Keep at least one copy.', builds: [], recalibration: 'Compare duplicate rolls before deconstructing.' }
  }

  return null
}

export function evaluateGearItem(item = {}) {
  if (normalizeKnowledgeText(item.itemType).includes('weapon') || item.category) {
    return evaluateWeaponItem(item)
  }

  const special = namedOrExoticResult(item)
  if (special) return special

  const itemText = [item.attributes, item.core, item.talent].filter(Boolean).join(' ')
  const matchingRules = GEAR_RULES
    .filter((rule) => listMatches(item.brand || item.name, rule.brands))
    .filter((rule) => listMatches(item.slot, rule.slots))
    .filter((rule) => listMatches(item.talent, rule.talents))

  const best = bestRuleResult(matchingRules, itemText)
  if (best) {
    const missing = best.attributeResult.missing
    const canRecalibrate = missing.length <= 1
    return {
      score: best.score,
      verdict: canRecalibrate ? best.rule.verdict : 'Keep only if needed',
      tier: canRecalibrate ? best.rule.tier : 'situational',
      reason: best.rule.reason,
      builds: best.rule.builds,
      matchedRuleId: best.rule.id,
      missingAttributes: missing,
      recalibration: missing.length === 1
        ? `Recalibrate ${missing[0]} onto this item.`
        : missing.length > 1
          ? 'More than one ideal roll is missing, so this cannot be completed with one recalibration.'
          : 'The important rolls are present; optimize values as needed.',
    }
  }

  const rarity = normalizeKnowledgeText(item.rarity)
  if (rarity.includes('gear set')) {
    return { score: 64, verdict: 'Keep useful slots', tier: 'set', reason: 'Gear-set pieces can be useful in every armor slot. Keep the best rolled copies needed to preserve build flexibility.', builds: [], recalibration: 'Keep the best roll for each slot you actually use.' }
  }

  const usefulBuilds = BUILD_ARCHETYPES.filter((build) => build.tags.some((tag) => includesText(itemText, tag))).map((build) => build.name)
  if (usefulBuilds.length >= 2) {
    return { score: 70, verdict: 'Inspect', tier: 'useful', reason: 'The rolls align with multiple common build archetypes.', builds: usefulBuilds, recalibration: 'Check whether one recalibration would complete a useful roll combination.' }
  }

  return { score: 35, verdict: 'Donate or dismantle', tier: 'low', reason: 'No high-value armor rule matched this combination.', builds: usefulBuilds, recalibration: 'Keep only for Expertise, a saved build, or a personal experiment.' }
}

export function evaluateWeaponItem(item = {}) {
  const special = namedOrExoticResult(item)
  if (special) return special

  const itemText = [item.attributes, item.talent].filter(Boolean).join(' ')
  const matchingRules = WEAPON_RULES.filter((rule) => listMatches(item.category, rule.categories))
  const best = bestRuleResult(matchingRules, itemText)

  if (best) {
    const missing = best.attributeResult.missing
    const talentMissing = best.rule.talents.length > 0 && !best.talentMatch
    const changesNeeded = missing.length + (talentMissing ? 1 : 0)
    const canRecalibrate = changesNeeded <= 1
    let recalibration = 'The useful third attribute and talent are already present; optimize values as needed.'
    if (changesNeeded > 1) recalibration = 'Both the third attribute and talent need changing, so this copy cannot be completed with one recalibration.'
    else if (missing.length === 1) recalibration = `Recalibrate the third attribute to ${missing[0]}.`
    else if (talentMissing) recalibration = `Recalibrate the talent to a strong option such as ${best.rule.talents.slice(0, 3).join(', ')}.`

    return {
      score: best.score,
      verdict: canRecalibrate ? best.rule.verdict : 'Keep only if needed',
      tier: canRecalibrate ? best.rule.tier : 'situational',
      reason: best.rule.reason,
      builds: best.rule.builds,
      matchedRuleId: best.rule.id,
      recalibration,
    }
  }

  return { score: 42, verdict: 'Compare before deleting', tier: 'general', reason: 'This weapon category is supported, but no preferred third-attribute pattern matched.', builds: [], recalibration: 'Named, exotic, high-base-stat, or personally useful weapons may still be worth keeping.' }
}

export function evaluateVendorGear(item) {
  return evaluateGearItem(extractVendorGearItem(item))
}

export function getCollectionGuidance(item = {}, category = '') {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) return { ...namedRule, builds: [] }
  if (category === 'exotics') return { score: 90, verdict: 'Keep one', tier: 'exotic', reason: 'Keep at least one copy of each exotic; compare duplicate rolls before deconstructing.' }
  if (category === 'weapons') return { score: 58, verdict: 'Compare talent and third attribute', tier: 'weapon', reason: 'Weapon value depends on its category, base model, talent, and third attribute. Use Gear Advisor before deleting strong or named copies.' }
  if (category === 'namedGear') return { score: 78, verdict: 'Keep one', tier: 'named', reason: 'Named gear can have unique talents or attributes. Keep the best copy.' }
  if (category === 'gearSets') return { score: 65, verdict: 'Keep useful slots', tier: 'set', reason: 'Useful gear-set pieces exist in all six armor slots; keep well-rolled copies that preserve build flexibility.' }
  if (category === 'brands') return { score: 55, verdict: 'Keep selectively', tier: 'brand', reason: 'Value depends on slot, talent, and rolls. Gear Advisor now evaluates masks, chests, holsters, backpacks, gloves, and kneepads.' }
  return { score: 45, verdict: 'Compare copies', tier: 'general', reason: 'Keep the best roll and donate lower-value duplicates for Expertise when appropriate.' }
}

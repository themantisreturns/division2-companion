import { BUILD_ARCHETYPES, GEAR_RULES, NAMED_ITEM_RULES } from './knowledgeData.js'

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
  if (!attributes.length) return { matched: 0, total: 0 }
  return {
    matched: attributes.filter((attribute) => includesText(itemText, attribute)).length,
    total: attributes.length,
  }
}

export function extractVendorGearItem(item = {}) {
  return {
    name: item.name ?? '',
    brand: item.brand ?? '',
    slot: item.slot ?? '',
    talent: item.talent ?? item.talents ?? '',
    attributes: [item.core, item.attributes, item.mods].filter(Boolean).join(' '),
    rarity: item.rarity ?? '',
  }
}

export function findNamedItemRule(name) {
  return NAMED_ITEM_RULES.find((rule) => rule.names.some((candidate) => normalizeKnowledgeText(candidate) === normalizeKnowledgeText(name))) ?? null
}

export function evaluateGearItem(item = {}) {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) {
    return { ...namedRule, builds: [], matchedRuleId: 'named-item', recalibration: 'Keep the best rolled copy.' }
  }

  const itemText = [item.attributes, item.core, item.talent].filter(Boolean).join(' ')
  const candidates = GEAR_RULES
    .filter((rule) => listMatches(item.brand || item.name, rule.brands))
    .filter((rule) => listMatches(item.slot, rule.slots))
    .filter((rule) => listMatches(item.talent, rule.talents))
    .map((rule) => {
      const attributeResult = attributeMatches(itemText, rule.attributes)
      const missing = rule.attributes.filter((attribute) => !includesText(itemText, attribute))
      const score = Math.max(0, rule.score - missing.length * 12)
      return { rule, score, attributeResult, missing }
    })
    .sort((a, b) => b.score - a.score)

  if (candidates.length) {
    const best = candidates[0]
    const canRecalibrate = best.missing.length <= 1
    return {
      score: best.score,
      verdict: canRecalibrate ? best.rule.verdict : 'Keep only if needed',
      tier: canRecalibrate ? best.rule.tier : 'situational',
      reason: best.rule.reason,
      builds: best.rule.builds,
      matchedRuleId: best.rule.id,
      missingAttributes: best.missing,
      recalibration: best.missing.length === 1
        ? `Recalibrate ${best.missing[0]} onto this item.`
        : best.missing.length > 1
          ? 'More than one ideal roll is missing, so this cannot be fixed with one recalibration.'
          : 'The important rolls are already present; optimize values as needed.',
    }
  }

  const rarity = normalizeKnowledgeText(item.rarity)
  const isNamed = rarity.includes('named') || normalizeKnowledgeText(item.name).includes('perfect')
  if (isNamed) {
    return { score: 72, verdict: 'Keep one', tier: 'named', reason: 'Named items can be difficult to replace. Keep one until you confirm it has no build use.', builds: [], recalibration: 'Compare it with any duplicate before donating or dismantling.' }
  }

  const usefulBuilds = BUILD_ARCHETYPES.filter((build) => build.tags.some((tag) => includesText(itemText, tag))).map((build) => build.name)
  if (usefulBuilds.length >= 2) {
    return { score: 70, verdict: 'Inspect', tier: 'useful', reason: 'The rolls align with multiple common build archetypes.', builds: usefulBuilds, recalibration: 'Check whether one recalibration would complete a useful roll combination.' }
  }

  return { score: 35, verdict: 'Donate or dismantle', tier: 'low', reason: 'No high-value rule matched this combination.', builds: usefulBuilds, recalibration: 'Keep only for Expertise, a saved build, or a personal experiment.' }
}

export function evaluateVendorGear(item) {
  return evaluateGearItem(extractVendorGearItem(item))
}

export function getCollectionGuidance(item = {}, category = '') {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) return { ...namedRule, builds: [] }
  if (category === 'exotics') return { score: 90, verdict: 'Keep one', tier: 'exotic', reason: 'Keep at least one copy of each exotic; compare duplicate rolls before deconstructing.' }
  if (category === 'namedGear') return { score: 78, verdict: 'Keep one', tier: 'named', reason: 'Named gear can have unique talents or attributes. Keep the best copy.' }
  if (category === 'gearSets') return { score: 65, verdict: 'Keep useful slots', tier: 'set', reason: 'Chest and backpack pieces are often the most build-defining; keep well-rolled copies of the slots you use.' }
  if (category === 'brands') return { score: 55, verdict: 'Keep selectively', tier: 'brand', reason: 'Value depends on slot, talent, and rolls. Use Gear Advisor before deleting chest and backpack pieces.' }
  return { score: 45, verdict: 'Compare copies', tier: 'general', reason: 'Keep the best roll and donate lower-value duplicates for Expertise when appropriate.' }
}

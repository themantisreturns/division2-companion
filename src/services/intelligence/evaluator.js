import { BUILD_ARCHETYPES, GEAR_RULES, NAMED_ITEM_RULES, WEAPON_RULES } from '../../features/knowledge/knowledgeData.js'
import { getBuildCompatibility } from './compatibility.js'
import { listMatches, normalizeText } from './text.js'

function attributeMatches(itemText, attributes = []) {
  if (!attributes.length) return { matched: 0, total: 0, missing: [] }
  const missing = attributes.filter((attribute) => !normalizeText(itemText).includes(normalizeText(attribute)))
  return { matched: attributes.length - missing.length, total: attributes.length, missing }
}

function bestRuleResult(rules, itemText) {
  return rules.map((rule) => {
    const attributeResult = attributeMatches(itemText, rule.attributes)
    const talentRequired = rule.talents?.length > 0
    const talentMatch = !talentRequired || listMatches(itemText, rule.talents)
    const score = Math.max(0, rule.score - attributeResult.missing.length * 12 - (talentRequired && !talentMatch ? 14 : 0))
    return { rule, score, attributeResult, talentMatch }
  }).sort((a, b) => b.score - a.score)[0] ?? null
}

export function findNamedItemRule(name) {
  return NAMED_ITEM_RULES.find((rule) => rule.names.some((candidate) => normalizeText(candidate) === normalizeText(name))) ?? null
}

function withCompatibility(result, item) {
  const compatibility = getBuildCompatibility(item, result.builds ?? [])
  return { ...result, compatibility, builds: compatibility.map((entry) => entry.name) }
}

function namedOrExoticResult(item) {
  const namedRule = findNamedItemRule(item.name)
  if (namedRule) return withCompatibility({ ...namedRule, builds: [], matchedRuleId: 'named-item', recalibration: 'Keep the best rolled copy and compare duplicates.' }, item)
  if (normalizeText(item.rarity).includes('exotic')) {
    return withCompatibility({ score: 95, verdict: 'Keep one', tier: 'exotic', reason: 'Exotics have unique talents and may be difficult to replace. Keep at least one copy.', builds: [], recalibration: 'Compare duplicate rolls before deconstructing.' }, item)
  }
  return null
}

export function evaluateItem(item = {}) {
  return normalizeText(item.itemType).includes('weapon') || item.category ? evaluateWeapon(item) : evaluateArmor(item)
}

export function evaluateArmor(item = {}) {
  const special = namedOrExoticResult(item)
  if (special) return special
  const itemText = [item.attributes, item.core, item.talent].filter(Boolean).join(' ')
  const rules = GEAR_RULES
    .filter((rule) => listMatches(item.brand || item.name, rule.brands))
    .filter((rule) => listMatches(item.slot, rule.slots))
    .filter((rule) => listMatches(item.talent, rule.talents))
  const best = bestRuleResult(rules, itemText)

  if (best) {
    const missing = best.attributeResult.missing
    const canRecalibrate = missing.length <= 1
    return withCompatibility({
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
    }, item)
  }

  if (normalizeText(item.rarity).includes('gear set')) {
    return withCompatibility({ score: 64, verdict: 'Keep useful slots', tier: 'set', reason: 'Gear-set pieces can be useful in every armor slot. Keep the best rolled copies needed to preserve build flexibility.', builds: [], recalibration: 'Keep the best roll for each slot you actually use.' }, item)
  }

  const usefulBuilds = BUILD_ARCHETYPES.filter((build) => build.tags.some((tag) => normalizeText(itemText).includes(normalizeText(tag)))).map((build) => build.name)
  if (usefulBuilds.length >= 2) return withCompatibility({ score: 70, verdict: 'Inspect', tier: 'useful', reason: 'The rolls align with multiple common build archetypes.', builds: usefulBuilds, recalibration: 'Check whether one recalibration would complete a useful roll combination.' }, item)
  return withCompatibility({ score: 35, verdict: 'Donate or dismantle', tier: 'low', reason: 'No high-value armor rule matched this combination.', builds: usefulBuilds, recalibration: 'Keep only for Expertise, a saved build, or a personal experiment.' }, item)
}

export function evaluateWeapon(item = {}) {
  const special = namedOrExoticResult(item)
  if (special) return special
  const itemText = [item.attributes, item.talent].filter(Boolean).join(' ')
  const best = bestRuleResult(WEAPON_RULES.filter((rule) => listMatches(item.category, rule.categories)), itemText)
  if (!best) return withCompatibility({ score: 42, verdict: 'Compare before deleting', tier: 'general', reason: 'This weapon category is supported, but no preferred third-attribute pattern matched.', builds: [], recalibration: 'Named, exotic, high-base-stat, or personally useful weapons may still be worth keeping.' }, item)

  const missing = best.attributeResult.missing
  const talentMissing = best.rule.talents.length > 0 && !best.talentMatch
  const changesNeeded = missing.length + (talentMissing ? 1 : 0)
  let recalibration = 'The useful third attribute and talent are already present; optimize values as needed.'
  if (changesNeeded > 1) recalibration = 'Both the third attribute and talent need changing, so this copy cannot be completed with one recalibration.'
  else if (missing.length === 1) recalibration = `Recalibrate the third attribute to ${missing[0]}.`
  else if (talentMissing) recalibration = `Recalibrate the talent to a strong option such as ${best.rule.talents.slice(0, 3).join(', ')}.`

  return withCompatibility({
    score: best.score,
    verdict: changesNeeded <= 1 ? best.rule.verdict : 'Keep only if needed',
    tier: changesNeeded <= 1 ? best.rule.tier : 'situational',
    reason: best.rule.reason,
    builds: best.rule.builds,
    matchedRuleId: best.rule.id,
    recalibration,
  }, item)
}

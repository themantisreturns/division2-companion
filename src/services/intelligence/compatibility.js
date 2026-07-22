import { BUILD_ARCHETYPES } from '../../features/knowledge/knowledgeData.js'
import { includesText, normalizeText } from './text.js'

function itemSearchText(item = {}) {
  return [
    item.name,
    item.brand,
    item.slot,
    item.category,
    item.core,
    item.attributes,
    item.talent,
    item.rarity,
  ].filter(Boolean).join(' ')
}

export function getBuildCompatibility(item = {}, explicitBuilds = []) {
  const text = itemSearchText(item)
  const explicit = new Set(explicitBuilds.map(normalizeText))

  return BUILD_ARCHETYPES
    .map((build) => {
      const matchedTags = build.tags.filter((tag) => includesText(text, tag))
      const isExplicit = explicit.has(normalizeText(build.name))
      const score = Math.min(100, (isExplicit ? 65 : 0) + matchedTags.length * 18)
      return { id: build.id, name: build.name, score, matchedTags, explicit: isExplicit }
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
}

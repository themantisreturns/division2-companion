const ARMOR_SLOTS = ['mask', 'chest', 'holster', 'backpack', 'gloves', 'kneepads']
const WEAPON_SLOTS = ['primary', 'secondary', 'sidearm']

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseSelection(value, slotKey) {
  if (!value) return null
  const [category, name = '', encodedSlot = ''] = String(value).split('|')
  const resolvedSlot = encodedSlot || slotKey
  const displayName = category === 'brands' || category === 'gearSets'
    ? `${name} ${resolvedSlot}`
    : name
  return { category, name, slotKey: resolvedSlot, displayName }
}

function slotFromCopy(copy) {
  const explicit = copy.slot ?? ''
  if (explicit) return normalize(explicit)
  const match = String(copy.name ?? '').match(/(Mask|Chest|Holster|Backpack|Gloves|Kneepads)$/i)
  return normalize(match?.[1] ?? '')
}

function isCandidateForSlot(copy, slotKey) {
  if (ARMOR_SLOTS.includes(slotKey)) return slotFromCopy(copy) === normalize(slotKey)
  if (!WEAPON_SLOTS.includes(slotKey)) return false
  if (copy.category !== 'weapons' && copy.category !== 'exotics') return false
  const text = normalize([copy.name, copy.weaponCategory, copy.family].filter(Boolean).join(' '))
  if (slotKey === 'sidearm') return text.includes('pistol')
  return !text.includes('pistol')
}

function exactSelectionMatch(copy, selected) {
  if (!selected) return false
  if (copy.category !== selected.category) return false
  const copyName = normalize(copy.name)
  if (selected.category === 'brands' || selected.category === 'gearSets') {
    return copyName === normalize(`${selected.name} ${selected.slotKey}`) || copyName === normalize(selected.name)
  }
  return copyName === normalize(selected.name)
}

function findCatalogItem(catalog, copy) {
  const source = catalog?.categories?.[copy.category] ?? []
  const baseName = String(copy.name ?? '').replace(/ (Mask|Chest|Holster|Backpack|Gloves|Kneepads)$/i, '')
  return source.find((item) => normalize(item.name) === normalize(copy.name) || normalize(item.name) === normalize(baseName)) ?? null
}

function candidateLabel(copy) {
  const attributes = Array.isArray(copy.attributes) ? copy.attributes.filter(Boolean).join(' · ') : ''
  return {
    id: copy.id,
    category: copy.category,
    name: copy.name,
    score: Math.max(0, Math.min(100, Number(copy.score) || 0)),
    attributes,
    talent: copy.talent ?? '',
    confidence: Number(copy.confidence) || 0,
  }
}

export function optimizeBuild({ build, inventory = {}, catalog = {} }) {
  const copies = Array.isArray(inventory.scannedCopies) ? inventory.scannedCopies : []
  const slotResults = []

  for (const slotKey of [...WEAPON_SLOTS, ...ARMOR_SLOTS]) {
    const selected = parseSelection(build?.slots?.[slotKey], slotKey)
    const candidates = copies
      .filter((copy) => isCandidateForSlot(copy, slotKey))
      .map((copy) => {
        const exact = exactSelectionMatch(copy, selected)
        const catalogItem = findCatalogItem(catalog, copy)
        const baseScore = Math.max(0, Math.min(100, Number(copy.score) || 0))
        const fitBonus = exact ? 8 : 0
        const catalogSlot = normalize(catalogItem?.slot ?? catalogItem?.category ?? '')
        const slotFit = !ARMOR_SLOTS.includes(slotKey) || !catalogSlot || catalogSlot === normalize(slotKey)
        return { ...candidateLabel(copy), exact, fitScore: Math.min(100, baseScore + fitBonus), slotFit }
      })
      .filter((copy) => copy.slotFit)
      .sort((a, b) => b.fitScore - a.fitScore || b.confidence - a.confidence)

    const exactCandidates = candidates.filter((copy) => copy.exact)
    const current = exactCandidates[0] ?? null
    const best = candidates[0] ?? null
    let status = 'unreviewed'
    let improvement = 0

    if (!selected) status = best ? 'candidate' : 'empty'
    else if (!current) status = best ? 'missing-reviewed-copy' : 'unreviewed'
    else if (best && best.id !== current.id && best.fitScore > current.fitScore + 1) {
      status = 'upgrade'
      improvement = best.fitScore - current.fitScore
    } else status = 'optimal'

    slotResults.push({ slotKey, selected, current, best, candidates: candidates.slice(0, 3), status, improvement })
  }

  const configured = slotResults.filter((row) => row.selected)
  const reviewed = configured.filter((row) => row.current)
  const currentScore = reviewed.length
    ? Math.round(reviewed.reduce((sum, row) => sum + row.current.fitScore, 0) / reviewed.length)
    : 0
  const potentialRows = configured.filter((row) => row.best)
  const potentialScore = potentialRows.length
    ? Math.round(potentialRows.reduce((sum, row) => sum + row.best.fitScore, 0) / potentialRows.length)
    : currentScore

  return {
    slots: slotResults,
    configuredSlots: configured.length,
    reviewedSlots: reviewed.length,
    upgradeCount: slotResults.filter((row) => row.status === 'upgrade').length,
    currentScore,
    potentialScore,
    improvement: Math.max(0, potentialScore - currentScore),
  }
}

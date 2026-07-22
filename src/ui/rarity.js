const RARITIES = {
  normal: { key: 'normal', label: 'Normal' },
  specialized: { key: 'specialized', label: 'Specialized' },
  superior: { key: 'superior', label: 'Superior' },
  highend: { key: 'highend', label: 'High-End' },
  named: { key: 'named', label: 'Named' },
  gearset: { key: 'gearset', label: 'Gear Set' },
  exotic: { key: 'exotic', label: 'Exotic' },
}

function normalized(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function getRarity(item = {}, category = '') {
  const source = normalized(item.rarity)
  const categoryKey = normalized(category)

  if (categoryKey === 'exotics' || source.includes('exotic')) return RARITIES.exotic
  if (categoryKey === 'gearsets' || source.includes('gear set') || source.includes('header-gs')) return RARITIES.gearset
  if (categoryKey === 'namedgear' || source.includes('named') || source.includes('header-named')) return RARITIES.named
  if (source.includes('superior') || source.includes('header-superior')) return RARITIES.superior
  if (source.includes('specialized') || source.includes('header-specialized')) return RARITIES.specialized
  if (source.includes('normal') || source.includes('standard') || source.includes('header-normal')) return RARITIES.normal

  // Weapons, brands, and ordinary level-40 vendor items are High-End by default.
  return RARITIES.highend
}

export function rarityClass(item, category) {
  return `rarity-${getRarity(item, category).key}`
}

export function renderRarityBadge(item, category) {
  const rarity = getRarity(item, category)
  return `<span class="rarity-badge rarity-badge-${rarity.key}">${rarity.label}</span>`
}

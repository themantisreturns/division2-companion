import { rarityClass, renderRarityBadge, renderRarityLegend } from '../../ui/rarity.js'
const CATEGORY_LABELS = {
  weapons: 'Weapons',
  namedGear: 'Named Gear',
  exotics: 'Exotics',
  brands: 'Brands',
  gearSets: 'Gear Sets',
}

const TRACKED_CATEGORIES = Object.keys(CATEGORY_LABELS)

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getQuantity(inventory, category, name) {
  const categoryItems = inventory?.items?.[category] ?? {}
  if (category === 'brands' || category === 'gearSets') {
    return Object.entries(categoryItems)
      .filter(([key]) => key === name || key.startsWith(`${name} `))
      .reduce((total, [, amount]) => total + (Number(amount) || 0), 0)
  }
  return Number(categoryItems[name]) || 0
}

function getDetails(item) {
  return [item.category, item.slot, item.brand, item.family, item.variant, item.rarity]
    .filter(Boolean)
    .join(' · ')
}

function getFarmTip(category, item) {
  if (category === 'exotics') return 'Prioritize activities and caches that can award Exotics. Confirm the specific source in-game before farming.'
  if (category === 'namedGear') return 'Check weekly vendors, named-item caches, and targeted loot matching the item slot or brand.'
  if (category === 'weapons') return `Set targeted loot to ${item.category || 'the matching weapon class'} and run Countdown or Summit.`
  if (category === 'brands') return `Set targeted loot to ${item.name} and farm Countdown for multiple drops per run.`
  if (category === 'gearSets') return `Set targeted loot to ${item.name}; Countdown is efficient for collecting multiple slots.`
  return 'Use targeted loot and weekly vendors to narrow the search.'
}

function buildRows(catalog, inventory) {
  const wishlist = new Set(inventory?.wishlist ?? [])
  return TRACKED_CATEGORIES.flatMap((category) =>
    (catalog?.categories?.[category] ?? []).map((item) => {
      const quantity = getQuantity(inventory, category, item.name)
      return {
        ...item,
        categoryKey: category,
        categoryLabel: CATEGORY_LABELS[category],
        quantity,
        owned: quantity > 0,
        wishlisted: wishlist.has(`${category}|||${item.name}`),
      }
    }),
  )
}

function renderSummary(rows) {
  return TRACKED_CATEGORIES.map((category) => {
    const group = rows.filter((row) => row.categoryKey === category)
    const owned = group.filter((row) => row.owned).length
    const percent = group.length ? Math.round((owned / group.length) * 100) : 0
    return `<article class="collection-summary-card">
      <span>${CATEGORY_LABELS[category]}</span>
      <strong>${owned} / ${group.length}</strong>
      <div class="collection-progress"><i style="width:${percent}%"></i></div>
      <small>${percent}% catalog coverage</small>
    </article>`
  }).join('')
}

function renderPlanner(rows) {
  const ordered = [
    ...rows.filter((row) => row.wishlisted && !row.owned),
    ...rows.filter((row) => row.categoryKey === 'exotics' && !row.owned),
    ...rows.filter((row) => row.categoryKey === 'namedGear' && !row.owned),
  ]
  const seen = new Set()
  const priorities = ordered.filter((row) => {
    const key = `${row.categoryKey}|||${row.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 8)

  if (!priorities.length) {
    return '<div class="empty-state compact"><strong>No urgent targets</strong><p>Star missing items in Inventory to create a farming list.</p></div>'
  }

  return priorities.map((item, index) => `<article class="farming-priority">
    <span class="priority-number">${index + 1}</span>
    <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.categoryLabel)}${item.wishlisted ? ' · Wishlist' : ''}</small><p>${escapeHtml(getFarmTip(item.categoryKey, item))}</p></div>
  </article>`).join('')
}

function renderCard(item) {
  const label = item.owned ? `${item.quantity} owned` : item.wishlisted ? 'Wishlist' : 'Missing'
  return `<button class="collection-item-card ${rarityClass(item, item.categoryKey)} ${item.owned ? 'owned' : 'missing'}"
    data-collection-item data-category="${escapeHtml(item.categoryKey)}" data-name="${escapeHtml(item.name)}"
    data-owned="${item.owned}" data-wishlisted="${item.wishlisted}"
    data-search="${escapeHtml(`${item.name} ${item.categoryLabel} ${getDetails(item)}`.toLowerCase())}">
    <span class="collection-item-type">${escapeHtml(item.categoryLabel)}</span>
    ${renderRarityBadge(item, item.categoryKey)}
    <strong>${escapeHtml(item.name)}</strong>
    <small>${escapeHtml(getDetails(item) || 'Catalog item')}</small>
    <span class="collection-status ${item.owned ? 'owned' : item.wishlisted ? 'wishlist' : 'missing'}">${escapeHtml(label)}</span>
  </button>`
}

export function renderCollectionPage({ catalog, inventory }) {
  const rows = buildRows(catalog, inventory)
  const owned = rows.filter((row) => row.owned).length
  return `<section class="feature-page collection-page">
    <div class="feature-heading">
      <div><p class="eyebrow">Account collection</p><h1>Collection & Farming Planner</h1><p>See what you own, inspect catalog entries, and turn your wishlist into a focused farming plan.</p></div>
      <div class="collection-total"><strong>${owned}</strong><span>of ${rows.length} tracked</span></div>
    </div>
    <div class="collection-summary-grid">${renderSummary(rows)}</div>
    <div class="collection-layout">
      <section class="panel collection-browser-panel">
        <div class="panel-heading"><div><span class="card-label">Item encyclopedia</span><strong>Browse the collection</strong></div></div>
        <div class="collection-toolbar">
          <input id="collection-search" type="search" placeholder="Search weapons, named items, brands…">
          <select id="collection-category"><option value="all">All categories</option>${TRACKED_CATEGORIES.map((key) => `<option value="${key}">${CATEGORY_LABELS[key]}</option>`).join('')}</select>
          <select id="collection-status-filter"><option value="all">Owned + missing</option><option value="owned">Owned</option><option value="missing">Missing</option><option value="wishlist">Wishlist</option></select>
        </div>
        <div class="collection-results-meta"><span id="collection-result-count">${rows.length} items</span><span>Click an item for details</span></div>
        <div class="collection-item-grid">${rows.map(renderCard).join('')}</div>
      </section>
      <aside class="collection-sidebar">
        <section class="panel"><div class="panel-heading"><div><span class="card-label">Tonight's plan</span><strong>Farming priorities</strong></div></div><div class="farming-list">${renderPlanner(rows)}</div></section>
        <section class="panel collection-detail-panel" id="collection-detail"><span class="card-label">Item details</span><strong>Select an item</strong><p>Choose anything from the encyclopedia to see ownership, metadata, and a farming suggestion.</p></section>
      </aside>
    </div>
  </section>`
}

export function connectCollectionPage({ catalog, inventory }) {
  const rows = buildRows(catalog, inventory)
  const search = document.querySelector('#collection-search')
  const category = document.querySelector('#collection-category')
  const status = document.querySelector('#collection-status-filter')
  const cards = [...document.querySelectorAll('[data-collection-item]')]
  const count = document.querySelector('#collection-result-count')

  function filter() {
    const query = search?.value.trim().toLowerCase() ?? ''
    const categoryValue = category?.value ?? 'all'
    const statusValue = status?.value ?? 'all'
    let visible = 0
    cards.forEach((card) => {
      const owned = card.dataset.owned === 'true'
      const wishlisted = card.dataset.wishlisted === 'true'
      const matchesStatus = statusValue === 'all' || (statusValue === 'owned' && owned) || (statusValue === 'missing' && !owned) || (statusValue === 'wishlist' && wishlisted)
      const show = (!query || card.dataset.search.includes(query)) && (categoryValue === 'all' || card.dataset.category === categoryValue) && matchesStatus
      card.hidden = !show
      if (show) visible += 1
    })
    if (count) count.textContent = `${visible} item${visible === 1 ? '' : 's'}`
  }

  search?.addEventListener('input', filter)
  category?.addEventListener('change', filter)
  status?.addEventListener('change', filter)

  cards.forEach((card) => card.addEventListener('click', () => {
    const item = rows.find((row) => row.categoryKey === card.dataset.category && row.name === card.dataset.name)
    const detail = document.querySelector('#collection-detail')
    if (!item || !detail) return
    detail.innerHTML = `<span class="card-label">${escapeHtml(item.categoryLabel)}</span><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(getDetails(item) || 'No additional catalog metadata is currently available.')}</p>
      <div class="collection-detail-stats"><div><span>Ownership</span><strong>${item.owned ? `${item.quantity} owned` : 'Missing'}</strong></div><div><span>Wishlist</span><strong>${item.wishlisted ? 'Yes' : 'No'}</strong></div></div>
      <div class="collection-farm-tip"><span>Suggested next step</span><p>${escapeHtml(getFarmTip(item.categoryKey, item))}</p></div>`
    cards.forEach((candidate) => candidate.classList.toggle('selected', candidate === card))
  }))
}

import { rarityClass, renderRarityBadge } from '../../ui/rarity.js'
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const CATEGORY_LABELS = {
  weapons: 'Weapons',
  namedGear: 'Named Gear',
  exotics: 'Exotic Gear',
  brands: 'Brands',
  gearSets: 'Gear Sets',
  skills: 'Skills',
  specializations: 'Specializations',
  mods: 'Mods',
}

const TRACKABLE_BOOLEAN_CATEGORIES = new Set([
  'weapons',
  'namedGear',
  'exotics',
  'skills',
  'specializations',
])

const TRACKABLE_RANK_CATEGORIES = new Set([
  'brands',
  'gearSets',
])

function getCategoryItems(catalog, category) {
  return catalog?.categories?.[category] ?? []
}

function getBooleanState(progress, category, name) {
  return Boolean(progress?.individual?.[category]?.[name])
}

function getRankState(progress, category, name) {
  return Number(progress?.ranks?.[category]?.[name]) || 0
}

function renderBooleanControl(category, name, progress) {
  const checked = getBooleanState(progress, category, name)

  return `
    <button
      class="catalog-proficiency-toggle ${checked ? 'proficient' : ''}"
      type="button"
      data-library-toggle="boolean"
      data-library-category="${escapeHtml(category)}"
      data-library-name="${escapeHtml(name)}"
      aria-pressed="${checked}"
    >
      ${checked ? 'Proficient ✓' : 'Mark proficient'}
    </button>
  `
}

function renderRankControl(category, name, progress) {
  const rank = getRankState(progress, category, name)

  return `
    <label class="catalog-rank-control">
      <span>Rank</span>

      <input
        type="number"
        min="0"
        max="10"
        value="${rank}"
        data-library-toggle="rank"
        data-library-category="${escapeHtml(category)}"
        data-library-name="${escapeHtml(name)}"
      >
    </label>
  `
}

function renderItemControl(category, item, progress) {
  if (TRACKABLE_BOOLEAN_CATEGORIES.has(category)) {
    return renderBooleanControl(
      category,
      item.name,
      progress,
    )
  }

  if (TRACKABLE_RANK_CATEGORIES.has(category)) {
    return renderRankControl(
      category,
      item.name,
      progress,
    )
  }

  return `
    <span class="catalog-reference-badge">
      Reference
    </span>
  `
}

function renderCatalogCard(category, item, progress) {
  const secondary = [
    item.category,
    item.slot,
    item.brand,
    item.family,
    item.variant,
    item.rarity,
  ]
    .filter(Boolean)
    .join(' · ')

  const searchable = [
    item.name,
    CATEGORY_LABELS[category],
    secondary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return `
    <article
      class="catalog-browser-card ${rarityClass(item, category)}"
      data-library-card
      data-library-category="${escapeHtml(category)}"
      data-library-search="${escapeHtml(searchable)}"
    >
      <div class="catalog-browser-card-copy">
        <span class="vendor-item-kind">
          ${escapeHtml(CATEGORY_LABELS[category])}
        </span>
        ${renderRarityBadge(item, category)}

        <strong>${escapeHtml(item.name)}</strong>

        <p>
          ${escapeHtml(secondary || 'Catalog item')}
        </p>
      </div>

      ${renderItemControl(category, item, progress)}
    </article>
  `
}

export function renderCatalogBrowser({
  catalog,
  expertiseProgress,
}) {
  const categories = catalog?.categories ?? {}
  const categoryOptions = Object.keys(CATEGORY_LABELS)
    .filter((key) => Array.isArray(categories[key]))
    .map(
      (key) => `
        <option value="${escapeHtml(key)}">
          ${escapeHtml(CATEGORY_LABELS[key])}
        </option>
      `,
    )
    .join('')

  const cards = Object.keys(CATEGORY_LABELS)
    .flatMap((category) =>
      getCategoryItems(catalog, category).map((item) =>
        renderCatalogCard(
          category,
          item,
          expertiseProgress,
        ),
      ),
    )
    .join('')

  const totalItems = Object.keys(CATEGORY_LABELS)
    .reduce(
      (sum, category) =>
        sum + getCategoryItems(catalog, category).length,
      0,
    )

  return `
    <section class="feature-page catalog-browser-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Search-first experience</p>
          <h1>Item Library</h1>

          <p class="subtitle">
            Search the catalog, review item details, and update
            proficiency without opening each Expertise section.
          </p>
        </div>

        <div class="save-status" id="library-save-status">
          ${expertiseProgress ? 'Cloud profile loaded' : 'Reference mode'}
        </div>
      </header>

      <section class="summary-grid">
        <article class="summary-card accent-card">
          <span class="card-label">Catalog items</span>
          <strong class="metric">${totalItems}</strong>
          <span class="metric-note">
            Across all searchable categories
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Weapons</span>
          <strong class="metric">
            ${getCategoryItems(catalog, 'weapons').length}
          </strong>
          <span class="metric-note">Exact weapon records</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Named + Exotic</span>
          <strong class="metric">
            ${
              getCategoryItems(catalog, 'namedGear').length +
              getCategoryItems(catalog, 'exotics').length
            }
          </strong>
          <span class="metric-note">Collectible items</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Generated</span>
          <strong class="metric catalog-library-date">
            ${escapeHtml(
              new Date(catalog.generatedAt).toLocaleDateString(),
            )}
          </strong>
          <span class="metric-note">
            Catalog schema ${escapeHtml(catalog.schemaVersion)}
          </span>
        </article>
      </section>

      <section class="panel">
        <div class="catalog-library-controls">
          <label class="vendor-search">
            <span>Search catalog</span>

            <input
              id="catalog-library-search"
              type="search"
              placeholder="Search item, category, brand, slot…"
            >
          </label>

          <label class="vendor-search">
            <span>Category</span>

            <select id="catalog-library-category">
              <option value="">All categories</option>
              ${categoryOptions}
            </select>
          </label>

          <label class="catalog-library-checkbox">
            <input
              id="catalog-library-incomplete"
              type="checkbox"
            >

            <span>Show incomplete only</span>
          </label>
        </div>
      </section>

      <div class="catalog-browser-grid" id="catalog-browser-grid">
        ${cards}
      </div>

      <section
        class="panel empty-state catalog-browser-empty"
        id="catalog-browser-empty"
        hidden
      >
        <strong>No catalog items matched.</strong>
      </section>
    </section>
  `
}

export function connectCatalogBrowser({
  expertiseProgress,
  onProgressChange,
}) {
  const searchInput = document.querySelector(
    '#catalog-library-search',
  )
  const categorySelect = document.querySelector(
    '#catalog-library-category',
  )
  const incompleteOnly = document.querySelector(
    '#catalog-library-incomplete',
  )
  const cards = [
    ...document.querySelectorAll('[data-library-card]'),
  ]
  const emptyState = document.querySelector(
    '#catalog-browser-empty',
  )

  function isIncomplete(card) {
    const button = card.querySelector(
      '[data-library-toggle="boolean"]',
    )
    const rankInput = card.querySelector(
      '[data-library-toggle="rank"]',
    )

    if (button) {
      return button.getAttribute('aria-pressed') !== 'true'
    }

    if (rankInput) {
      return Number(rankInput.value) < 10
    }

    return false
  }

  function applyFilters() {
    const search = searchInput?.value
      .trim()
      .toLowerCase() ?? ''

    const category = categorySelect?.value ?? ''
    const onlyIncomplete = Boolean(
      incompleteOnly?.checked,
    )

    let visibleCount = 0

    cards.forEach((card) => {
      const matchesSearch =
        !search ||
        card.dataset.librarySearch.includes(search)

      const matchesCategory =
        !category ||
        card.dataset.libraryCategory === category

      const matchesIncomplete =
        !onlyIncomplete || isIncomplete(card)

      card.hidden = !(
        matchesSearch &&
        matchesCategory &&
        matchesIncomplete
      )

      if (!card.hidden) {
        visibleCount += 1
      }
    })

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0
    }
  }

  searchInput?.addEventListener('input', applyFilters)
  categorySelect?.addEventListener('change', applyFilters)
  incompleteOnly?.addEventListener('change', applyFilters)

  document
    .querySelectorAll('[data-library-toggle="boolean"]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const category = button.dataset.libraryCategory
        const name = button.dataset.libraryName
        const current =
          button.getAttribute('aria-pressed') === 'true'
        const next = !current

        expertiseProgress.individual[category] ??= {}
        expertiseProgress.individual[category][name] = next

        button.setAttribute('aria-pressed', String(next))
        button.classList.toggle('proficient', next)
        button.textContent =
          next ? 'Proficient ✓' : 'Mark proficient'

        applyFilters()
        onProgressChange()
      })
    })

  document
    .querySelectorAll('[data-library-toggle="rank"]')
    .forEach((input) => {
      input.addEventListener('input', () => {
        const category = input.dataset.libraryCategory
        const name = input.dataset.libraryName
        const value = Math.max(
          0,
          Math.min(10, Number(input.value) || 0),
        )

        input.value = value
        expertiseProgress.ranks[category] ??= {}
        expertiseProgress.ranks[category][name] = value

        applyFilters()
        onProgressChange()
      })
    })
}

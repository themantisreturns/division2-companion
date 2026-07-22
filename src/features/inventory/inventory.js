import { getCollectionGuidance } from '../knowledge/knowledgeEngine.js'

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
  exotics: 'Exotics',
  brands: 'Brands',
  gearSets: 'Gear Sets',
  skills: 'Skills',
  specializations: 'Specializations',
}

const GEAR_SLOTS = [
  'Mask',
  'Chest',
  'Holster',
  'Backpack',
  'Gloves',
  'Kneepads',
]

function isGenericGearCategory(category) {
  return category === 'brands' || category === 'gearSets'
}

function getInventoryEntries(catalog, category, inventory) {
  const items = getCategoryItems(catalog, category)

  if (!isGenericGearCategory(category)) {
    return items.map((item) => ({
      ...item,
      inventoryName: item.name,
      displayName: item.name,
    }))
  }

  const expanded = items.flatMap((item) =>
    GEAR_SLOTS.map((slot) => ({
      ...item,
      slot,
      inventoryName: `${item.name} ${slot}`,
      displayName: `${item.name} ${slot}`,
    })),
  )

  // Preserve older brand/set-level inventory records so they remain visible
  // and can be cleared instead of silently disappearing.
  const knownNames = new Set(items.map((item) => item.name))
  const legacyEntries = Object.keys(inventory?.items?.[category] ?? {})
    .filter((name) => knownNames.has(name))
    .map((name) => ({
      name,
      inventoryName: name,
      displayName: `${name} (unassigned slot)`,
      slot: 'Unassigned',
      legacy: true,
    }))

  return [...legacyEntries, ...expanded]
}

function getCategoryItems(catalog, category) {
  return catalog?.categories?.[category] ?? []
}

function getQuantity(inventory, category, name) {
  return (
    Number(
      inventory?.items?.[category]?.[name],
    ) || 0
  )
}

export function createEmptyInventory() {
  return {
    schemaVersion: 1,
    items: {},
    updatedAt: null,
  }
}

export function normalizeInventory(savedInventory) {
  const empty = createEmptyInventory()

  if (
    !savedInventory ||
    typeof savedInventory !== 'object' ||
    Array.isArray(savedInventory)
  ) {
    return empty
  }

  return {
    ...empty,
    ...savedInventory,
    items:
      savedInventory.items &&
      typeof savedInventory.items === 'object'
        ? structuredClone(savedInventory.items)
        : {},
  }
}

function renderInventoryCard(
  category,
  item,
  inventory,
) {
  const quantity = getQuantity(
    inventory,
    category,
    item.inventoryName ?? item.name,
  )

  const details = [
    item.category,
    item.slot,
    item.brand,
    item.family,
    item.variant,
    item.rarity,
  ]
    .filter(Boolean)
    .join(' · ')

  const guidance = getCollectionGuidance(item, category)

  const searchText = [
    item.displayName ?? item.name,
    CATEGORY_LABELS[category],
    details,
    guidance.verdict,
    guidance.reason,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return `
    <article
      class="inventory-card"
      data-inventory-card
      data-inventory-category="${escapeHtml(category)}"
      data-inventory-search="${escapeHtml(searchText)}"
      data-inventory-owned="${quantity > 0}"
    >
      <div>
        <span class="vendor-item-kind">
          ${escapeHtml(CATEGORY_LABELS[category])}
        </span>

        <strong>${escapeHtml(item.displayName ?? item.name)}</strong>

        <p>
          ${escapeHtml(details || 'Catalog item')}
        </p>
        <div class="inventory-advice">
          <span class="advisor-badge advisor-tier-${escapeHtml(guidance.tier)}">${escapeHtml(guidance.verdict)}</span>
          <small>${escapeHtml(guidance.reason)}</small>
        </div>
      </div>

      <div class="inventory-quantity-control">
        <button
          type="button"
          data-inventory-action="decrease"
          data-inventory-category="${escapeHtml(category)}"
          data-inventory-name="${escapeHtml(item.inventoryName ?? item.name)}"
          aria-label="Decrease quantity"
        >
          −
        </button>

        <input
          type="number"
          min="0"
          max="99"
          value="${quantity}"
          data-inventory-quantity
          data-inventory-category="${escapeHtml(category)}"
          data-inventory-name="${escapeHtml(item.inventoryName ?? item.name)}"
          aria-label="Owned quantity"
        >

        <button
          type="button"
          data-inventory-action="increase"
          data-inventory-category="${escapeHtml(category)}"
          data-inventory-name="${escapeHtml(item.inventoryName ?? item.name)}"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </article>
  `
}

export function renderInventoryPage({
  catalog,
  inventory,
}) {
  const categories = Object.keys(CATEGORY_LABELS)
    .filter((key) =>
      Array.isArray(catalog?.categories?.[key]),
    )

  const cards = categories
    .flatMap((category) =>
      getInventoryEntries(catalog, category, inventory).map(
        (item) =>
          renderInventoryCard(
            category,
            item,
            inventory,
          ),
      ),
    )
    .join('')

  const allQuantities = Object.values(
    inventory.items ?? {},
  ).flatMap((categoryItems) =>
    Object.values(categoryItems ?? {}),
  )

  const uniqueOwned = allQuantities.filter(
    (value) => Number(value) > 0,
  ).length

  const totalCopies = allQuantities.reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  )

  const totalCatalogItems = categories.reduce(
    (sum, category) =>
      sum +
      getInventoryEntries(catalog, category, { items: {} }).length,
    0,
  )

  return `
    <section class="feature-page inventory-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Personal collection</p>
          <h1>Inventory</h1>

          <p class="subtitle">
            Track owned items and duplicates across your
            Division 2 collection.
          </p>
        </div>

        <div
          class="save-status"
          id="inventory-save-status"
        >
          Cloud inventory loaded
        </div>
      </header>

      <section class="summary-grid">
        <article class="summary-card accent-card">
          <span class="card-label">Unique items owned</span>
          <strong class="metric" id="inventory-unique-count">
            ${uniqueOwned}
          </strong>
          <span class="metric-note">
            Different catalog items
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Total copies</span>
          <strong class="metric" id="inventory-total-count">
            ${totalCopies}
          </strong>
          <span class="metric-note">
            Includes duplicates
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Catalog coverage</span>
          <strong class="metric" id="inventory-coverage">
            ${
              totalCatalogItems
                ? Math.round(
                    (uniqueOwned / totalCatalogItems) *
                      100,
                  )
                : 0
            }%
          </strong>
          <span class="metric-note">
            Of trackable catalog items
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Catalog size</span>
          <strong class="metric">
            ${totalCatalogItems}
          </strong>
          <span class="metric-note">
            Trackable entries
          </span>
        </article>
      </section>

      <section class="panel">
        <div class="inventory-controls">
          <label class="vendor-search">
            <span>Search inventory</span>

            <input
              id="inventory-search"
              type="search"
              placeholder="Search item, category, brand…"
            >
          </label>

          <label class="vendor-search">
            <span>Category</span>

            <select id="inventory-category">
              <option value="">All categories</option>

              ${categories
                .map(
                  (category) => `
                    <option value="${escapeHtml(category)}">
                      ${escapeHtml(CATEGORY_LABELS[category])}
                    </option>
                  `,
                )
                .join('')}
            </select>
          </label>

          <label class="inventory-owned-filter">
            <input
              id="inventory-owned-only"
              type="checkbox"
            >

            <span>Owned only</span>
          </label>
        </div>
      </section>

      <div class="inventory-grid">
        ${cards}
      </div>

      <section
        class="panel empty-state"
        id="inventory-empty"
        hidden
      >
        <strong>No inventory items matched.</strong>
      </section>
    </section>
  `
}

export function connectInventoryPage({
  inventory,
  onInventoryChange,
}) {
  const searchInput = document.querySelector(
    '#inventory-search',
  )

  const categorySelect = document.querySelector(
    '#inventory-category',
  )

  const ownedOnly = document.querySelector(
    '#inventory-owned-only',
  )

  const cards = [
    ...document.querySelectorAll(
      '[data-inventory-card]',
    ),
  ]

  const emptyState = document.querySelector(
    '#inventory-empty',
  )

  function setQuantity(category, name, value) {
    const quantity = Math.max(
      0,
      Math.min(99, Number(value) || 0),
    )

    inventory.items[category] ??= {}

    if (quantity === 0) {
      delete inventory.items[category][name]

      if (
        Object.keys(inventory.items[category])
          .length === 0
      ) {
        delete inventory.items[category]
      }
    } else {
      inventory.items[category][name] = quantity
    }

    const input = document.querySelector(
      `[data-inventory-quantity]` +
      `[data-inventory-category="${CSS.escape(category)}"]` +
      `[data-inventory-name="${CSS.escape(name)}"]`,
    )

    if (input) {
      input.value = quantity

      const card = input.closest(
        '[data-inventory-card]',
      )

      if (card) {
        card.dataset.inventoryOwned =
          String(quantity > 0)
      }
    }

    updateSummary()
    applyFilters()
    onInventoryChange()
  }

  function updateSummary() {
    const quantities = Object.values(
      inventory.items ?? {},
    ).flatMap((categoryItems) =>
      Object.values(categoryItems ?? {}),
    )

    const uniqueOwned = quantities.filter(
      (value) => Number(value) > 0,
    ).length

    const totalCopies = quantities.reduce(
      (sum, value) =>
        sum + (Number(value) || 0),
      0,
    )

    const totalCatalogItems = cards.length

    document.querySelector(
      '#inventory-unique-count',
    ).textContent = uniqueOwned

    document.querySelector(
      '#inventory-total-count',
    ).textContent = totalCopies

    document.querySelector(
      '#inventory-coverage',
    ).textContent = `${
      totalCatalogItems
        ? Math.round(
            (uniqueOwned / totalCatalogItems) * 100,
          )
        : 0
    }%`
  }

  function applyFilters() {
    const search =
      searchInput?.value.trim().toLowerCase() ?? ''

    const category =
      categorySelect?.value ?? ''

    const onlyOwned = Boolean(
      ownedOnly?.checked,
    )

    let visibleCount = 0

    cards.forEach((card) => {
      const matchesSearch =
        !search ||
        card.dataset.inventorySearch.includes(
          search,
        )

      const matchesCategory =
        !category ||
        card.dataset.inventoryCategory ===
          category

      const matchesOwned =
        !onlyOwned ||
        card.dataset.inventoryOwned === 'true'

      card.hidden = !(
        matchesSearch &&
        matchesCategory &&
        matchesOwned
      )

      if (!card.hidden) {
        visibleCount += 1
      }
    })

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0
    }
  }

  document
    .querySelectorAll('[data-inventory-action]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const category =
          button.dataset.inventoryCategory

        const name =
          button.dataset.inventoryName

        const current = getQuantity(
          inventory,
          category,
          name,
        )

        const next =
          button.dataset.inventoryAction ===
          'increase'
            ? current + 1
            : current - 1

        setQuantity(category, name, next)
      })
    })

  document
    .querySelectorAll('[data-inventory-quantity]')
    .forEach((input) => {
      input.addEventListener('input', () => {
        setQuantity(
          input.dataset.inventoryCategory,
          input.dataset.inventoryName,
          input.value,
        )
      })
    })

  searchInput?.addEventListener(
    'input',
    applyFilters,
  )

  categorySelect?.addEventListener(
    'change',
    applyFilters,
  )

  ownedOnly?.addEventListener(
    'change',
    applyFilters,
  )
}

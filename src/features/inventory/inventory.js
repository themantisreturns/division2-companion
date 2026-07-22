import { getCollectionGuidance } from '../knowledge/knowledgeEngine.js'
import { scanInventoryImages } from './inventoryScanner.js'

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

      <section class="panel inventory-scanner-panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Screenshot import</p>
            <h2>Scan inventory items</h2>
            <p class="subtitle">Upload one or more item-detail screenshots. The scanner reads the item, suggests a catalog match, and lets you review everything before adding it.</p>
          </div>
          <label class="primary-button inventory-scan-button">
            Choose screenshots
            <input id="inventory-scan-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
          </label>
        </div>
        <div id="inventory-scan-status" class="inventory-scan-status" hidden></div>
        <div id="inventory-scan-results" class="inventory-scan-results"></div>
        <p class="inventory-scan-note">Best results come from a clear screenshot with the full item details panel visible. OCR runs in your browser; screenshots are not uploaded to our server.</p>
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
  catalog,
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
  const scanInput = document.querySelector('#inventory-scan-input')
  const scanStatus = document.querySelector('#inventory-scan-status')
  const scanResults = document.querySelector('#inventory-scan-results')

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] ?? category
  }

  function renderScanResults(results) {
    scanResults.innerHTML = results.map((result) => {
      const choices = [result.match, ...result.alternatives].filter(Boolean)
      return `
        <article class="inventory-scan-result" data-scan-result="${escapeHtml(result.id)}">
          <img src="${escapeHtml(result.imageUrl)}" alt="${escapeHtml(result.fileName)} screenshot preview">
          <div class="inventory-scan-copy">
            <div class="inventory-scan-heading">
              <div>
                <span class="vendor-item-kind">${escapeHtml(result.fileName)}</span>
                <strong>${escapeHtml(result.match?.displayName ?? 'Review needed')}</strong>
              </div>
              <span class="advisor-badge advisor-tier-${result.confidence >= 75 ? 'excellent' : result.confidence >= 50 ? 'good' : 'situational'}">${result.confidence}% match</span>
            </div>
            <label>
              <span>Catalog match</span>
              <select data-scan-match>
                ${choices.length ? choices.map((choice, index) => `
                  <option value="${escapeHtml(choice.category)}|||${escapeHtml(choice.name)}" ${index === 0 ? 'selected' : ''}>
                    ${escapeHtml(choice.displayName)} · ${escapeHtml(categoryLabel(choice.category))}
                  </option>
                `).join('') : '<option value="">No confident match</option>'}
              </select>
            </label>
            ${result.attributes.length ? `<div class="inventory-scan-details"><strong>Detected rolls</strong><ul>${result.attributes.map((attribute) => `<li>${escapeHtml(attribute)}</li>`).join('')}</ul></div>` : ''}
            ${result.talent ? `<p><strong>Possible talent:</strong> ${escapeHtml(result.talent)}</p>` : ''}
            <details>
              <summary>Show OCR text</summary>
              <pre>${escapeHtml(result.rawText)}</pre>
            </details>
            <div class="inventory-scan-actions">
              <button type="button" class="primary-button" data-scan-add>Add to inventory</button>
              <button type="button" class="text-button" data-scan-dismiss>Dismiss</button>
            </div>
          </div>
        </article>
      `
    }).join('')

    scanResults.querySelectorAll('[data-scan-add]').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('[data-scan-result]')
        const value = card.querySelector('[data-scan-match]')?.value ?? ''
        if (!value) {
          window.alert('Choose a catalog match before adding this item.')
          return
        }
        const [category, name] = value.split('|||')
        const current = getQuantity(inventory, category, name)
        setQuantity(category, name, current + 1)
        card.classList.add('added')
        button.disabled = true
        button.textContent = 'Added'
      })
    })

    scanResults.querySelectorAll('[data-scan-dismiss]').forEach((button) => {
      button.addEventListener('click', () => button.closest('[data-scan-result]')?.remove())
    })
  }

  scanInput?.addEventListener('change', async () => {
    const files = [...(scanInput.files ?? [])]
    if (!files.length) return

    scanInput.disabled = true
    scanStatus.hidden = false
    scanStatus.className = 'inventory-scan-status working'

    try {
      const results = await scanInventoryImages(files, catalog, ({ fileName, index, total, progress, status }) => {
        scanStatus.innerHTML = `<strong>${escapeHtml(status)}</strong><span>${escapeHtml(fileName)} · ${index + 1} of ${total} · ${progress}%</span><div class="scan-progress-track"><div style="width:${progress}%"></div></div>`
      })
      renderScanResults(results)
      scanStatus.className = 'inventory-scan-status success'
      scanStatus.innerHTML = `<strong>Scan complete</strong><span>Review ${results.length} result${results.length === 1 ? '' : 's'} below before adding them.</span>`
    } catch (error) {
      console.error(error)
      scanStatus.className = 'inventory-scan-status error'
      scanStatus.innerHTML = `<strong>Scanner could not finish</strong><span>${escapeHtml(error.message || 'Try a clearer screenshot.')}</span>`
    } finally {
      scanInput.disabled = false
      scanInput.value = ''
    }
  })

}

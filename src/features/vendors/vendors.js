function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanHtml(value) {
  if (!value || value === '-') {
    return 'None'
  }

  return String(value)
    .replace(/<br\s*\/?>/gi, ' · ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getAllItems(vendorData) {
  return [
    ...vendorData.gear.map((item) => ({
      ...item,
      category: item.slot || 'Gear',
      kind: 'Gear',
      details: [
        item.brand,
        cleanHtml(item.core),
        cleanHtml(item.attributes),
      ]
        .filter(Boolean)
        .join(' · '),
    })),

    ...vendorData.weapons.map((item) => ({
      ...item,
      category: 'Weapon',
      kind: 'Weapon',
      details: [
        item.talent,
        cleanHtml(item.attribute1),
        cleanHtml(item.attribute2),
        cleanHtml(item.attribute3),
      ]
        .filter((value) => value && value !== 'None')
        .join(' · '),
    })),

    ...vendorData.mods.map((item) => ({
      ...item,
      category: 'Mod',
      kind: 'Mod',
      details: cleanHtml(item.attributes),
    })),
  ]
}

function groupItemsByVendor(items) {
  return items.reduce((groups, item) => {
    const vendor = item.vendor || 'Unknown Vendor'

    if (!groups[vendor]) {
      groups[vendor] = []
    }

    groups[vendor].push(item)
    return groups
  }, {})
}

export function renderVendorPage(vendorData) {
  const allItems = getAllItems(vendorData)
  const groupedItems = groupItemsByVendor(allItems)
  const vendorNames = Object.keys(groupedItems).sort()

  return `
    <section class="feature-page vendor-feature-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Current weekly inventory</p>
          <h1>Weekly Vendors</h1>
          <p class="subtitle">
            Browse the loaded gear, weapons, and mods by vendor.
          </p>
        </div>

        <a
          class="primary-button vendor-source-link"
          href="https://rubenalamina.mx/the-division-weekly-vendor-reset/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open vendor source
        </a>
      </header>

      <section class="summary-grid vendor-summary-grid">
        <article class="summary-card">
          <span class="card-label">Total items</span>
          <strong class="metric">${vendorData.total}</strong>
          <span class="metric-note">Across all vendor files</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Gear</span>
          <strong class="metric">${vendorData.gear.length}</strong>
          <span class="metric-note">Gear pieces available</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Weapons</span>
          <strong class="metric">${vendorData.weapons.length}</strong>
          <span class="metric-note">Weapons available</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Mods</span>
          <strong class="metric">${vendorData.mods.length}</strong>
          <span class="metric-note">${vendorNames.length} vendors loaded</span>
        </article>
      </section>

      <div class="vendor-controls">
        <label class="vendor-search">
          <span>Search inventory</span>
          <input
            id="vendor-search-input"
            type="search"
            placeholder="Item, brand, vendor, talent…"
          >
        </label>

        <select id="vendor-filter">
          <option value="">All vendors</option>
          ${vendorNames
            .map(
              (vendor) => `
                <option value="${escapeHtml(vendor)}">
                  ${escapeHtml(vendor)}
                </option>
              `,
            )
            .join('')}
        </select>
      </div>

      <div id="vendor-results">
        ${renderVendorGroups(groupedItems)}
      </div>
    </section>
  `
}

export function renderVendorGroups(groupedItems) {
  const vendors = Object.keys(groupedItems).sort()

  if (!vendors.length) {
    return `
      <div class="panel empty-state">
        <strong>No vendor items matched.</strong>
      </div>
    `
  }

  return vendors
    .map(
      (vendor) => `
        <section class="panel vendor-group">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Vendor</p>
              <h2>${escapeHtml(vendor)}</h2>
            </div>

            <span class="vendor-count">
              ${groupedItems[vendor].length} items
            </span>
          </div>

          <div class="vendor-inventory-list">
            ${groupedItems[vendor]
              .map(
                (item) => `
                  <article
                    class="vendor-inventory-item"
                    data-search="${escapeHtml(
                      [
                        item.name,
                        item.vendor,
                        item.brand,
                        item.slot,
                        item.talent,
                        item.details,
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase(),
                    )}"
                    data-vendor="${escapeHtml(item.vendor)}"
                  >
                    <div>
                      <span class="vendor-item-kind">
                        ${escapeHtml(item.kind)}
                      </span>

                      <strong>${escapeHtml(item.name)}</strong>

                      <p>${escapeHtml(item.details)}</p>
                    </div>

                    <span class="vendor-item-category">
                      ${escapeHtml(item.category)}
                    </span>
                  </article>
                `,
              )
              .join('')}
          </div>
        </section>
      `,
    )
    .join('')
}

export function connectVendorFilters() {
  const searchInput = document.querySelector(
    '#vendor-search-input',
  )
  const vendorFilter = document.querySelector('#vendor-filter')
  const items = [
    ...document.querySelectorAll('.vendor-inventory-item'),
  ]
  const groups = [...document.querySelectorAll('.vendor-group')]

  function applyFilters() {
    const search = searchInput.value.trim().toLowerCase()
    const selectedVendor = vendorFilter.value

    items.forEach((item) => {
      const matchesSearch =
        !search || item.dataset.search.includes(search)

      const matchesVendor =
        !selectedVendor ||
        item.dataset.vendor === selectedVendor

      item.hidden = !(matchesSearch && matchesVendor)
    })

    groups.forEach((group) => {
      const visibleItems = group.querySelectorAll(
        '.vendor-inventory-item:not([hidden])',
      )

      group.hidden = visibleItems.length === 0
    })
  }

  searchInput.addEventListener('input', applyFilters)
  vendorFilter.addEventListener('change', applyFilters)
}
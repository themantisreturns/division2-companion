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
      category:
        item.weaponType ||
        item.type ||
        item.category ||
        'Weapon',

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

function renderPriorityStars(priority) {
  return `
    <span
      class="recommendation-stars"
      aria-label="${priority} out of 5 priority"
    >
      ${'★'.repeat(priority)}${'☆'.repeat(5 - priority)}
    </span>
  `
}

function renderRecommendationItems(
  recommendations,
  purchasedIds,
) {
  return recommendations
    .map((recommendation) => {
      const isPurchased = purchasedIds.includes(
        recommendation.id,
      )

      return `
        <article
          class="recommendation-item ${
            isPurchased ? 'purchased' : ''
          }"
        >
          <div class="recommendation-priority">
            ${renderPriorityStars(
              recommendation.priority,
            )}

            <span>
              ${escapeHtml(
                recommendation.progressLabel,
              )}
            </span>
          </div>

          <div class="recommendation-copy">
            <span class="vendor-item-kind">
              ${escapeHtml(recommendation.kind)}
            </span>

            <strong>
              ${escapeHtml(recommendation.name)}
            </strong>

            <p>
              ${escapeHtml(recommendation.reason)}
            </p>
          </div>

          <div class="recommendation-location">
            <strong>
              ${escapeHtml(recommendation.vendor)}
            </strong>

            <span>
              ${
                recommendation.recommendationType ===
                'verify-weapon'
                  ? 'Verify exact proficiency'
                  : 'Buy for brand Expertise'
              }
            </span>
          </div>

          <button
            class="purchase-toggle ${
              isPurchased ? 'purchased' : ''
            }"
            data-recommendation-id="${escapeHtml(
              recommendation.id,
            )}"
            type="button"
          >
            ${isPurchased ? 'Purchased ✓' : 'Mark purchased'}
          </button>
        </article>
      `
    })
    .join('')
}

function renderRecommendations(
  recommendations,
  purchasedIds,
) {
  if (!recommendations.length) {
    return `
      <section class="panel recommendation-panel">
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <strong>No Expertise purchases identified</strong>
          <p>
            Either your tracked categories are complete or the
            current data could not be matched to your profile.
          </p>
        </div>
      </section>
    `
  }

  const remaining = recommendations.filter(
    (item) => !purchasedIds.includes(item.id),
  )

  const purchased = recommendations.filter((item) =>
    purchasedIds.includes(item.id),
  )

  return `
    <section class="panel recommendation-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Personalized results</p>
          <h2>What to consider buying</h2>
        </div>

        <span class="vendor-count">
          ${remaining.length} remaining
        </span>
      </div>

      ${
        remaining.length
          ? `
            <div class="recommendation-list">
              ${renderRecommendationItems(
                remaining,
                purchasedIds,
              )}
            </div>
          `
          : `
            <div class="empty-state compact-empty-state">
              <div class="empty-icon">✓</div>
              <strong>Shopping list complete</strong>
              <p>
                You marked every current recommendation as purchased.
              </p>
            </div>
          `
      }
    </section>

    ${
      purchased.length
        ? `
          <section class="panel purchased-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">This weekly reset</p>
                <h2>Purchased items</h2>
              </div>

              <span class="vendor-count">
                ${purchased.length} purchased
              </span>
            </div>

            <div class="recommendation-list">
              ${renderRecommendationItems(
                purchased,
                purchasedIds,
              )}
            </div>
          </section>
        `
        : ''
    }
  `
}

export function renderVendorPage({
  vendorData,
  recommendations = [],
  purchasedIds = [],
}) {
  const allItems = getAllItems(vendorData)
  const groupedItems = groupItemsByVendor(allItems)
  const vendorNames = Object.keys(groupedItems).sort()

  const purchasedCount = recommendations.filter((item) =>
    purchasedIds.includes(item.id),
  ).length

  return `
    <section class="feature-page vendor-feature-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Current weekly inventory</p>
          <h1>Weekly Vendors</h1>
          <p class="subtitle">
            Personalized recommendations based on your saved
            Expertise profile.
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
        <article class="summary-card accent-card">
          <span class="card-label">Remaining</span>
          <strong class="metric">
            ${recommendations.length - purchasedCount}
          </strong>
          <span class="metric-note">
            Recommendations left to check
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Purchased</span>
          <strong class="metric">
            ${purchasedCount}
          </strong>
          <span class="metric-note">
            Saved for this weekly reset
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Gear</span>
          <strong class="metric">
            ${vendorData.gear.length}
          </strong>
          <span class="metric-note">
            Gear pieces available
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Weapons and mods</span>
          <strong class="metric">
            ${
              vendorData.weapons.length +
              vendorData.mods.length
            }
          </strong>
          <span class="metric-note">
            ${vendorNames.length} vendors loaded
          </span>
        </article>
      </section>

      ${renderRecommendations(
        recommendations,
        purchasedIds,
      )}

      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Complete inventory</p>
            <h2>Browse all vendor items</h2>
          </div>
        </div>

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
      </section>

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
                    data-vendor="${escapeHtml(
                      item.vendor,
                    )}"
                  >
                    <div>
                      <span class="vendor-item-kind">
                        ${escapeHtml(item.kind)}
                      </span>

                      <strong>
                        ${escapeHtml(item.name)}
                      </strong>

                      <p>
                        ${escapeHtml(item.details)}
                      </p>
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

  const vendorFilter = document.querySelector(
    '#vendor-filter',
  )

  if (!searchInput || !vendorFilter) {
    return
  }

  const items = [
    ...document.querySelectorAll(
      '.vendor-inventory-item',
    ),
  ]

  const groups = [
    ...document.querySelectorAll('.vendor-group'),
  ]

  function applyFilters() {
    const search =
      searchInput.value.trim().toLowerCase()

    const selectedVendor = vendorFilter.value

    items.forEach((item) => {
      const matchesSearch =
        !search ||
        item.dataset.search.includes(search)

      const matchesVendor =
        !selectedVendor ||
        item.dataset.vendor === selectedVendor

      item.hidden = !(
        matchesSearch && matchesVendor
      )
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

export function connectPurchaseButtons(onToggle) {
  document
    .querySelectorAll('.purchase-toggle')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true
        button.textContent = 'Saving…'

        await onToggle(
          button.dataset.recommendationId,
        )
      })
    })
}
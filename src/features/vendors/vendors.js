import { rarityClass, renderRarityBadge } from '../../ui/rarity.js'
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
          class="recommendation-item ${rarityClass({ rarity: recommendation.kind }, recommendation.kind)} ${
            isPurchased ? 'purchased' : ''
          }"
        >
          <div class="recommendation-priority">
            ${renderPriorityStars(
              recommendation.priority,
            )}

            <span class="vendor-buy-score">
              ${escapeHtml(recommendation.score ?? recommendation.priority * 20)}/100
            </span>

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
            ${renderRarityBadge({ rarity: recommendation.kind }, recommendation.kind)}

            <strong>
              ${escapeHtml(recommendation.name)}
            </strong>

            <span class="vendor-verdict vendor-verdict-${escapeHtml(String(recommendation.verdict ?? 'consider').toLowerCase().replaceAll(' ', '-'))}">
              ${escapeHtml(recommendation.verdict ?? 'CONSIDER')}
            </span>

            <p>
              ${escapeHtml(recommendation.reason)}
            </p>
          </div>

          <div class="recommendation-location">
            <strong>
              ${escapeHtml(recommendation.vendor)}
            </strong>

            <span>
              ${escapeHtml(
                recommendation.buildMatches?.length
                  ? `Helps ${recommendation.buildMatches.length} saved build${recommendation.buildMatches.length === 1 ? '' : 's'}`
                  : recommendation.wishlist
                    ? 'Personal wishlist match'
                    : recommendation.recommendationType === 'expertise'
                      ? 'Useful for Expertise'
                      : 'Personalized recommendation',
              )}
            </span>
          </div>

          <div class="vendor-recommendation-actions">
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

            <button
              class="secondary-button wishlist-toggle ${recommendation.wishlist ? 'active' : ''}"
              data-wishlist-key="${escapeHtml(recommendation.wishlistKey ?? '')}"
              type="button"
              ${recommendation.wishlistKey ? '' : 'disabled'}
            >
              ${recommendation.wishlist ? 'Wishlisted ★' : 'Add to wishlist'}
            </button>
          </div>
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
          <h2>Personal shopping list</h2>
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
            Personalized buy scores based on your inventory, wishlist, saved builds, and Expertise progress.
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
                    class="vendor-inventory-item ${rarityClass(item, item.kind)}"
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
                      ${renderRarityBadge(item, item.kind)}

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

export function connectPurchaseButtons(onToggle, onWishlistToggle) {
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

  document
    .querySelectorAll('.wishlist-toggle')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        if (!onWishlistToggle || !button.dataset.wishlistKey) return
        button.disabled = true
        button.textContent = 'Saving…'
        await onWishlistToggle(button.dataset.wishlistKey)
      })
    })
}function formatHistoryDate(value) {
  if (!value) return 'Unknown date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function renderVendorHistoryPanel(history, meta) {
  const entries = history?.entries ?? []
  const currentChange = meta?.comparison ?? {
    added: 0,
    changed: 0,
    removed: 0,
  }

  return `
    <section class="panel vendor-history-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Automatic reset tracking</p>
          <h2>Weekly vendor history</h2>
        </div>

        <span class="vendor-count">
          ${entries.length} snapshot${entries.length === 1 ? '' : 's'}
        </span>
      </div>

      <div class="vendor-change-grid">
        <article>
          <span>New items</span>
          <strong>${currentChange.added}</strong>
        </article>
        <article>
          <span>Changed rolls</span>
          <strong>${currentChange.changed}</strong>
        </article>
        <article>
          <span>Removed items</span>
          <strong>${currentChange.removed}</strong>
        </article>
      </div>

      ${
        entries.length
          ? `
            <div class="vendor-history-controls">
              <label>
                <span>Previous reset</span>
                <select id="vendor-history-select">
                  ${entries
                    .map(
                      (entry, index) => `
                        <option value="${entry.file}" ${index === 0 ? 'selected' : ''}>
                          ${formatHistoryDate(entry.capturedAt)} · ${entry.counts.total} items
                        </option>
                      `,
                    )
                    .join('')}
                </select>
              </label>

              <button
                class="secondary-button"
                id="view-vendor-history"
                type="button"
              >
                View snapshot
              </button>
            </div>

            <div id="vendor-history-results" class="vendor-history-results">
              <p class="metric-note">
                Choose a saved reset to browse its complete vendor inventory.
              </p>
            </div>
          `
          : `
            <div class="empty-state compact-empty-state">
              <strong>History starts with the next automatic sync</strong>
              <p>
                GitHub Actions will save a snapshot whenever vendor data changes.
              </p>
            </div>
          `
      }
    </section>
  `
}

export function renderVendorHistorySnapshot(snapshot) {
  const allItems = getAllItems({
    gear: snapshot?.gear ?? [],
    weapons: snapshot?.weapons ?? [],
    mods: snapshot?.mods ?? [],
  })
  const groupedItems = groupItemsByVendor(allItems)

  return `
    <div class="vendor-history-snapshot-heading">
      <div>
        <strong>${escapeHtml(formatHistoryDate(snapshot?.capturedAt))}</strong>
        <span>${allItems.length} total items</span>
      </div>
      <span>
        +${Number(snapshot?.comparison?.added) || 0} new ·
        ${Number(snapshot?.comparison?.changed) || 0} changed ·
        -${Number(snapshot?.comparison?.removed) || 0} removed
      </span>
    </div>

    <div class="vendor-history-snapshot-list">
      ${renderVendorGroups(groupedItems)}
    </div>
  `
}

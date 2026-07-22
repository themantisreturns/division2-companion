function clampPercentage(value) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function calculateFractionPercentage(items = {}) {
  const totals = Object.values(items).reduce(
    (result, item) => {
      result.current += Number(item?.current) || 0
      result.total += Number(item?.total) || 0
      return result
    },
    { current: 0, total: 0 },
  )

  if (!totals.total) {
    return 0
  }

  return clampPercentage(
    (totals.current / totals.total) * 100,
  )
}

function calculateRankPercentage(items = {}) {
  const ranks = Object.values(items).map(
    (value) => Number(value) || 0,
  )

  if (!ranks.length) {
    return 0
  }

  const current = ranks.reduce(
    (total, rank) => total + rank,
    0,
  )

  const maximum = ranks.length * 10

  return clampPercentage((current / maximum) * 100)
}

export function calculateExpertiseMetrics(progress = {}) {
  return {
    expertiseLevel: Number(progress.level) || 0,

    percentages: {
      Weapons: calculateFractionPercentage(
        progress.weapons,
      ),

      Brands: calculateRankPercentage(
        progress.brands,
      ),

      'Gear Sets': calculateRankPercentage(
        progress.gearSets,
      ),

      Skills: calculateFractionPercentage(
        progress.skills,
      ),
    },
  }
}

export function updateDashboardMetrics({
  expertiseProgress,
  recommendations = [],
  purchasedIds = [],
}) {
  const expertiseMetric = document.querySelector(
    '.accent-card .metric',
  )

  const expertiseNote = document.querySelector(
    '.accent-card .metric-note',
  )

  const shoppingMetric = document.querySelector(
    '.summary-grid .summary-card:nth-child(3) .metric',
  )

  const shoppingNote = document.querySelector(
    '.summary-grid .summary-card:nth-child(3) .metric-note',
  )

  if (!expertiseMetric || !shoppingMetric) {
    return
  }

  const metrics =
    calculateExpertiseMetrics(expertiseProgress)

  const purchasedSet = new Set(purchasedIds)

  const remainingRecommendations =
    recommendations.filter(
      (recommendation) =>
        !purchasedSet.has(recommendation.id),
    )

  expertiseMetric.textContent =
    metrics.expertiseLevel

  expertiseNote.textContent =
    'Loaded from your cloud profile'

  shoppingMetric.textContent =
    remainingRecommendations.length

  shoppingNote.textContent =
    `${purchasedIds.length} purchased this reset`

  document
    .querySelectorAll('.progress-row')
    .forEach((row) => {
      const label =
        row.querySelector('.progress-copy span')
          ?.textContent
          ?.trim()

      const percentage =
        metrics.percentages[label]

      if (percentage === undefined) {
        return
      }

      const valueElement = row.querySelector(
        '.progress-copy strong',
      )

      const progressFill = row.querySelector(
        '.progress-fill',
      )

      if (valueElement) {
        valueElement.textContent = `${percentage}%`
      }

      if (progressFill) {
        progressFill.style.width = `${percentage}%`
      }
    })
}
function getInventorySummary(inventory = {}) {
  const categories = inventory?.items && typeof inventory.items === 'object'
    ? Object.values(inventory.items)
    : []

  let unique = 0
  let total = 0

  categories.forEach((category) => {
    if (!category || typeof category !== 'object') return
    Object.values(category).forEach((quantity) => {
      const count = Math.max(0, Number(quantity) || 0)
      if (count > 0) unique += 1
      total += count
    })
  })

  return {
    unique,
    total,
    wishlist: Array.isArray(inventory?.wishlist) ? inventory.wishlist.length : 0,
    history: Array.isArray(inventory?.lootHistory) ? inventory.lootHistory : [],
  }
}

function formatLootDecision(value) {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized.includes('keep')) return 'Kept'
  if (normalized.includes('donat')) return 'Donated'
  if (normalized.includes('dismant')) return 'Dismantled'
  return value || 'Reviewed'
}

function escapeDashboardHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function updateDashboardIntelligence({ inventory, buildsState }) {
  const summary = getInventorySummary(inventory)
  const builds = Array.isArray(buildsState?.builds) ? buildsState.builds : []

  const setText = (selector, value) => {
    const element = document.querySelector(selector)
    if (element) element.textContent = value
  }

  setText('#dashboard-owned-count', summary.total)
  setText('#dashboard-unique-count', `${summary.unique} unique entr${summary.unique === 1 ? 'y' : 'ies'}`)
  setText('#dashboard-wishlist-count', summary.wishlist)
  setText('#dashboard-build-count', builds.length)
  setText(
    '#dashboard-build-note',
    builds.length ? `${builds.filter((build) => Object.keys(build?.slots ?? {}).length >= 9).length} fully configured` : 'Start a guided build',
  )
  setText('#dashboard-loot-count', summary.history.length)

  const decisionCounts = summary.history.reduce((counts, entry) => {
    const key = formatLootDecision(entry?.decision)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})

  const lootNote = Object.entries(decisionCounts)
    .slice(0, 2)
    .map(([label, count]) => `${count} ${label.toLowerCase()}`)
    .join(' · ')

  setText('#dashboard-loot-note', lootNote || 'No scans recorded yet')

  const activityList = document.querySelector('#dashboard-activity-list')
  if (!activityList) return

  const recent = summary.history.slice(0, 5)
  if (!recent.length) return

  activityList.innerHTML = recent.map((entry) => {
    const itemName = entry.itemName || entry.name || entry.matchedName || 'Scanned item'
    const decision = formatLootDecision(entry.decision)
    const dateValue = entry.createdAt || entry.timestamp || entry.date
    const date = dateValue ? new Date(dateValue) : null
    const dateLabel = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      : 'Recent'

    return `
      <article class="dashboard-activity-item">
        <div>
          <strong>${escapeDashboardHtml(itemName)}</strong>
          <span>${escapeDashboardHtml(decision)}</span>
        </div>
        <time>${escapeDashboardHtml(dateLabel)}</time>
      </article>
    `
  }).join('')
}

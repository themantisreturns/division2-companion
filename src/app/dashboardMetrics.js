import { createCommandCenterSummary } from '../services/commandCenter.js'
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

export function updateDashboardIntelligence({
  inventory,
  buildsState,
  recommendations = [],
  purchasedIds = [],
  expertiseProgress = {},
}) {
  const summary = getInventorySummary(inventory)
  const builds = Array.isArray(buildsState?.builds) ? buildsState.builds : []
  const commandCenter = createCommandCenterSummary({
    inventory,
    buildsState,
    recommendations,
    purchasedIds,
    expertiseProgress,
  })

  const setText = (selector, value) => {
    const element = document.querySelector(selector)
    if (element) element.textContent = value
  }

  setText('#dashboard-owned-count', summary.total)
  setText('#dashboard-unique-count', `${summary.unique} unique entr${summary.unique === 1 ? 'y' : 'ies'}`)
  setText('#dashboard-wishlist-count', summary.wishlist)
  setText('#dashboard-loot-count', summary.history.length)
  setText('#command-duplicate-count', commandCenter.inventory.duplicates)
  setText('#command-reviewed-count', `${commandCenter.inventory.reviewed} reviewed cop${commandCenter.inventory.reviewed === 1 ? 'y' : 'ies'}`)

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

  setText('#command-farm-title', commandCenter.farmPriority.title)
  setText('#command-farm-detail', `${commandCenter.farmPriority.detail} · ${commandCenter.farmPriority.reason}`)

  if (commandCenter.vendorPriority) {
    setText('#command-vendor-title', commandCenter.vendorPriority.name)
    setText(
      '#command-vendor-detail',
      `${commandCenter.vendorPriority.vendor} · ${commandCenter.vendorPriority.verdict} · ${commandCenter.vendorPriority.score}/100`,
    )
  } else {
    setText('#command-vendor-title', 'No priority purchase')
    setText('#command-vendor-detail', 'You are caught up on current recommendations')
  }

  if (commandCenter.buildPriority) {
    setText('#command-build-title', commandCenter.buildPriority.build?.name || 'Saved build')
    setText('#command-build-detail', `${commandCenter.buildPriority.completion}% configured · lowest-progress saved build`)
  } else {
    setText('#command-build-title', 'Create a saved build')
    setText('#command-build-detail', 'Use the guided build generator')
  }

  const checklist = document.querySelector('#command-checklist')
  if (checklist) {
    checklist.innerHTML = commandCenter.checklist.map((item) => `
      <div class="command-check-item ${item.done ? 'done' : ''}">
        <span class="checkmark">${item.done ? '✓' : '·'}</span>
        <span>${escapeDashboardHtml(item.label)}</span>
      </div>
    `).join('')
  }
}

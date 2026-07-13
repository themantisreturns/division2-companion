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
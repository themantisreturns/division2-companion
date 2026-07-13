function getMostRecentWeeklyReset(now = new Date()) {
  const reset = new Date(now)
  const daysSinceTuesday = (now.getDay() - 2 + 7) % 7

  reset.setDate(now.getDate() - daysSinceTuesday)
  reset.setHours(3, 0, 0, 0)

  if (reset > now) {
    reset.setDate(reset.getDate() - 7)
  }

  return reset
}

export function getCurrentResetKey() {
  const reset = getMostRecentWeeklyReset()

  return [
    reset.getFullYear(),
    String(reset.getMonth() + 1).padStart(2, '0'),
    String(reset.getDate()).padStart(2, '0'),
  ].join('-')
}

export function getPurchasedIdsForCurrentReset(
  purchasedItems = [],
) {
  const resetKey = getCurrentResetKey()

  return purchasedItems
    .filter((item) => item.resetKey === resetKey)
    .map((item) => item.recommendationId)
}

export function togglePurchasedItem(
  purchasedItems = [],
  recommendation,
) {
  const resetKey = getCurrentResetKey()

  const alreadyPurchased = purchasedItems.some(
    (item) =>
      item.resetKey === resetKey &&
      item.recommendationId === recommendation.id,
  )

  if (alreadyPurchased) {
    return purchasedItems.filter(
      (item) =>
        !(
          item.resetKey === resetKey &&
          item.recommendationId === recommendation.id
        ),
    )
  }

  return [
    ...purchasedItems,
    {
      recommendationId: recommendation.id,
      resetKey,
      purchasedAt: new Date().toISOString(),
      name: recommendation.name,
      vendor: recommendation.vendor,
      kind: recommendation.kind,
    },
  ]
}
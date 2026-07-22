export const PERSONAL_SCORE_WEIGHTS = Object.freeze({
  wishlist: 38,
  savedBuild: 24,
  missingNamed: 20,
  missingGeneral: 10,
  expertiseMaximum: 20,
})

export function scoreToVerdict(score) {
  if (score >= 85) return 'BUY NOW'
  if (score >= 70) return 'STRONG BUY'
  if (score >= 55) return 'CONSIDER'
  if (score >= 40) return 'EXPERTISE BUY'
  return 'SKIP'
}

export function createPersonalScore({
  baseScore = 45,
  wishlist = false,
  buildMatches = [],
  owned = 0,
  named = false,
  expertisePoints = 0,
}) {
  let score = Math.round(Number(baseScore || 0) * 0.35)
  if (wishlist) score += PERSONAL_SCORE_WEIGHTS.wishlist
  if (buildMatches.length) score += PERSONAL_SCORE_WEIGHTS.savedBuild
  if (!owned) score += named ? PERSONAL_SCORE_WEIGHTS.missingNamed : PERSONAL_SCORE_WEIGHTS.missingGeneral
  score += Math.max(0, Math.min(PERSONAL_SCORE_WEIGHTS.expertiseMaximum, Number(expertisePoints) || 0))
  return Math.max(0, Math.min(100, score))
}

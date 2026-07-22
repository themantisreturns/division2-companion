export function normalizeText(value) {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%']+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function includesText(haystack, needle) {
  const target = normalizeText(needle)
  return !target || normalizeText(haystack).includes(target)
}

export function listMatches(value, accepted = []) {
  return !accepted.length || accepted.some((candidate) => includesText(value, candidate))
}

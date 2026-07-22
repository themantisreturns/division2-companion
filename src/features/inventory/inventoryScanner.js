const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js'

let tesseractPromise = null

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract)
  if (tesseractPromise) return tesseractPromise

  tesseractPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Tesseract), { once: true })
      existing.addEventListener('error', () => reject(new Error('Could not load the OCR engine.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = TESSERACT_CDN
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => resolve(window.Tesseract)
    script.onerror = () => reject(new Error('Could not load the OCR engine. Check your internet connection and try again.'))
    document.head.append(script)
  })

  return tesseractPromise
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[|!]/g, 'i')
    .replace(/[^a-z0-9%+.' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1)
}

function scoreCandidate(text, candidate) {
  const normalizedText = normalizeText(text)
  const normalizedName = normalizeText(candidate.displayName)
  if (!normalizedName) return 0
  if (normalizedText.includes(normalizedName)) return 100 + normalizedName.length

  const candidateTokens = tokenize(normalizedName)
  if (!candidateTokens.length) return 0

  const matched = candidateTokens.filter((token) => normalizedText.includes(token))
  const coverage = matched.length / candidateTokens.length
  const exactLine = normalizedText
    .split(/\n/)
    .some((line) => line.includes(normalizedName) || normalizedName.includes(line.trim()))

  return coverage * 70 + matched.join('').length * 0.6 + (exactLine ? 15 : 0)
}

export function buildInventoryCandidates(catalog) {
  const candidates = []
  const slots = ['Mask', 'Chest', 'Holster', 'Backpack', 'Gloves', 'Kneepads']

  Object.entries(catalog?.categories ?? {}).forEach(([category, items]) => {
    if (!Array.isArray(items)) return

    if (category === 'brands' || category === 'gearSets') {
      items.forEach((item) => {
        slots.forEach((slot) => {
          candidates.push({
            category,
            name: `${item.name} ${slot}`,
            displayName: `${item.name} ${slot}`,
            baseName: item.name,
            slot,
          })
        })
      })
      return
    }

    items.forEach((item) => {
      candidates.push({
        category,
        name: item.name,
        displayName: item.name,
        baseName: item.name,
        slot: item.slot ?? '',
      })
    })
  })

  return candidates
}

function detectSlot(text) {
  const normalized = normalizeText(text)
  const slots = ['mask', 'chest', 'holster', 'backpack', 'gloves', 'kneepads']
  return slots.find((slot) => normalized.includes(slot)) ?? ''
}

function detectAttributes(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const attributeWords = [
    'weapon damage', 'armor', 'skill tier', 'critical hit chance', 'critical hit damage',
    'headshot damage', 'weapon handling', 'health', 'armor regeneration', 'hazard protection',
    'explosive resistance', 'incoming repairs', 'repair skills', 'skill damage', 'skill haste',
    'status effects', 'protection from elites', 'damage to targets out of cover',
    'damage to armor', 'rate of fire', 'magazine size', 'accuracy', 'stability',
  ]

  return lines
    .filter((line) => /\d+(?:\.\d+)?\s*%|skill tier|\+\s*1/.test(line.toLowerCase()))
    .filter((line) => attributeWords.some((word) => line.toLowerCase().includes(word)))
    .slice(0, 5)
}

function detectTalent(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const markerIndex = lines.findIndex((line) => /talent|perfect/i.test(line))
  if (markerIndex >= 0 && lines[markerIndex + 1]) return lines[markerIndex + 1]
  return ''
}

export function parseInventoryScreenshot(text, candidates) {
  const detectedSlot = detectSlot(text)
  const ranked = candidates
    .map((candidate) => {
      let score = scoreCandidate(text, candidate)
      if (detectedSlot && candidate.slot?.toLowerCase() === detectedSlot) score += 20
      return { ...candidate, score }
    })
    .sort((a, b) => b.score - a.score)

  const best = ranked[0]
  const confidence = best ? Math.max(0, Math.min(99, Math.round(best.score))) : 0

  return {
    match: best && best.score >= 35 ? best : null,
    alternatives: ranked.slice(1, 5).filter((item) => item.score >= 25),
    confidence,
    attributes: detectAttributes(text),
    talent: detectTalent(text),
    rawText: text,
  }
}

export async function scanInventoryImages(files, catalog, onProgress = () => {}) {
  const Tesseract = await loadTesseract()
  const candidates = buildInventoryCandidates(catalog)
  const results = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    onProgress({ fileName: file.name, index, total: files.length, progress: 0, status: 'Starting OCR…' })

    const output = await Tesseract.recognize(file, 'eng', {
      logger(message) {
        if (message.status === 'recognizing text') {
          onProgress({
            fileName: file.name,
            index,
            total: files.length,
            progress: Math.round((message.progress ?? 0) * 100),
            status: 'Reading screenshot…',
          })
        }
      },
    })

    results.push({
      id: `${Date.now()}-${index}`,
      fileName: file.name,
      imageUrl: URL.createObjectURL(file),
      ...parseInventoryScreenshot(output.data.text, candidates),
    })
  }

  return results
}

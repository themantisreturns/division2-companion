const TESSERACT_MODULE_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/+esm'

// Coordinates are normalized to the full 16:9 PC screenshot. The regions are
// deliberately a little generous so the importer also tolerates small UI-scale
// and capture differences.
const OVERVIEW_FIELDS = {
  level: { region: [0.257, 0.205, 0.090, 0.130], type: 'number' },
  levelProgress: { region: [0.250, 0.250, 0.110, 0.090], type: 'ratio' },
  proficient: { region: [0.205, 0.365, 0.140, 0.085], type: 'ratio' },

  rifles: { region: [0.436, 0.253, 0.090, 0.090], type: 'ratio', total: 36 },
  assaultRifles: { region: [0.633, 0.252, 0.095, 0.090], type: 'ratio', total: 55 },
  marksmanRifles: { region: [0.832, 0.252, 0.095, 0.090], type: 'ratio', total: 32 },
  shotguns: { region: [0.438, 0.357, 0.090, 0.090], type: 'ratio', total: 32 },
  smgs: { region: [0.634, 0.357, 0.090, 0.090], type: 'ratio', total: 44 },
  lmgs: { region: [0.831, 0.357, 0.090, 0.090], type: 'ratio', total: 38 },
  pistols: { region: [0.438, 0.460, 0.090, 0.090], type: 'ratio', total: 31 },
  specialization: { region: [0.633, 0.460, 0.090, 0.090], type: 'ratio', total: 6 },

  masks: { region: [0.438, 0.582, 0.090, 0.090], type: 'ratio', total: 12 },
  bodyArmor: { region: [0.634, 0.582, 0.090, 0.090], type: 'ratio', total: 28 },
  backpacks: { region: [0.800, 0.565, 0.135, 0.115], type: 'ratio', total: 27 },
  gloves: { region: [0.438, 0.680, 0.090, 0.090], type: 'ratio', total: 11 },
  holsters: { region: [0.634, 0.680, 0.090, 0.090], type: 'ratio', total: 13 },
  kneepads: { region: [0.790, 0.650, 0.150, 0.135], type: 'ratio', total: 12 },
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}`))
    }
    image.src = url
  })
}

function cropForOcr(image, region, mode = 'original') {
  const [x, y, width, height] = region
  const sourceX = Math.round(image.naturalWidth * x)
  const sourceY = Math.round(image.naturalHeight * y)
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth * width))
  const sourceHeight = Math.max(1, Math.round(image.naturalHeight * height))
  const scale = 5

  const canvas = document.createElement('canvas')
  canvas.width = sourceWidth * scale
  canvas.height = sourceHeight * scale
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  if (mode === 'original') return canvas

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < imageData.data.length; index += 4) {
    const red = imageData.data[index]
    const green = imageData.data[index + 1]
    const blue = imageData.data[index + 2]
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114
    const value = mode === 'threshold'
      ? (luminance > 150 ? 255 : 0)
      : Math.max(0, Math.min(255, (luminance - 80) * 2.2))
    imageData.data[index] = value
    imageData.data[index + 1] = value
    imageData.data[index + 2] = value
  }
  context.putImageData(imageData, 0, 0)
  return canvas
}

function normalizeOcrText(text) {
  return String(text ?? '')
    .replace(/[OoQ]/g, '0')
    .replace(/[Il|]/g, '1')
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFirstNumber(text) {
  const match = normalizeOcrText(text).match(/\d{1,4}/)
  return match ? Number(match[0]) : null
}

function parseRatio(text, expectedTotal = null) {
  const normalized = normalizeOcrText(text)
  const compact = normalized.replace(/\s/g, '')
  const matches = [...compact.matchAll(/(\d{1,3})?\/(\d{1,3})/g)]

  if (expectedTotal !== null) {
    // Prefer an exact denominator match. This also handles OCR that drops a
    // leading zero, such as "/12" for "0/12".
    for (const match of matches) {
      const total = Number(match[2])
      if (total === expectedTotal) {
        return {
          current: match[1] ? Number(match[1]) : 0,
          total: expectedTotal,
        }
      }
    }

    // Denominators are fixed on the Expertise overview. When OCR confuses one
    // denominator digit (for example 27 as 97), retain a plausible numerator
    // and use the known game total.
    for (const match of matches) {
      const current = match[1] ? Number(match[1]) : 0
      if (current >= 0 && current <= expectedTotal) {
        return { current, total: expectedTotal }
      }
    }

    // A lone slash followed by the expected total represents a dropped zero.
    if (compact.includes(`/${expectedTotal}`)) {
      return { current: 0, total: expectedTotal }
    }
  }

  const match = matches[0]
  if (!match || !match[1]) return null
  const current = Number(match[1])
  const total = Number(match[2])
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null
  return { current, total }
}

function parseField(text, definition) {
  return definition.type === 'number'
    ? parseFirstNumber(text)
    : parseRatio(text, definition.total ?? null)
}

function isValidField(value, definition) {
  if (definition.type === 'number') return Number.isFinite(value)
  return Boolean(value && value.total > 0 && value.current >= 0 && value.current <= value.total)
}

function validOverview(result) {
  return (
    result.level !== null &&
    result.level >= 0 &&
    result.level <= 30 &&
    result.levelProgress?.total > 0 &&
    result.levelProgress.current <= result.levelProgress.total &&
    result.proficient?.total > 0 &&
    result.proficient.current <= result.proficient.total
  )
}

async function recognizeField(worker, image, definition) {
  const attempts = ['original', 'contrast', 'threshold']
  let lastText = ''

  for (const mode of attempts) {
    const { data } = await worker.recognize(cropForOcr(image, definition.region, mode))
    lastText = data.text
    const parsed = parseField(lastText, definition)
    if (isValidField(parsed, definition)) return { parsed, text: lastText }
  }

  return { parsed: parseField(lastText, definition), text: lastText }
}

export async function scanExpertiseOverview(file, onProgress = () => {}) {
  const image = await loadImage(file)

  if (image.naturalWidth < 1000 || image.naturalHeight < 550) {
    throw new Error('Use the original full-resolution game screenshot, not a cropped or compressed preview.')
  }

  const { createWorker, PSM } = await import(/* @vite-ignore */ TESSERACT_MODULE_URL)
  const worker = await createWorker('eng', 1, {
    logger(message) {
      if (message.status === 'loading tesseract core') {
        onProgress(2, 'Loading screenshot reader…')
      }
    },
  })

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789/',
    // The game puts the ratio on a second line below "Proficient with".
    // SINGLE_LINE caused the first importer to miss nearly every value.
    tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    preserve_interword_spaces: '0',
  })

  const raw = {}
  const parsed = {}
  const entries = Object.entries(OVERVIEW_FIELDS)

  try {
    for (let index = 0; index < entries.length; index += 1) {
      const [field, definition] = entries[index]
      onProgress(
        Math.round((index / entries.length) * 95),
        `Reading ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}…`,
      )
      const result = await recognizeField(worker, image, definition)
      raw[field] = normalizeOcrText(result.text)
      parsed[field] = result.parsed
    }
  } finally {
    await worker.terminate()
  }

  const result = {
    fileName: file.name,
    level: parsed.level,
    levelProgress: parsed.levelProgress,
    proficient: parsed.proficient,
    categories: {
      weapons: {
        Rifles: parsed.rifles,
        'Assault Rifles': parsed.assaultRifles,
        'Marksman Rifles': parsed.marksmanRifles,
        Shotguns: parsed.shotguns,
        SMGs: parsed.smgs,
        LMGs: parsed.lmgs,
        Pistols: parsed.pistols,
        Specialization: parsed.specialization,
      },
      namedGear: {
        Masks: parsed.masks,
        'Body Armor': parsed.bodyArmor,
        Backpacks: parsed.backpacks,
        Gloves: parsed.gloves,
        Holsters: parsed.holsters,
        Kneepads: parsed.kneepads,
      },
    },
    raw,
  }

  if (!validOverview(result)) {
    const detected = [
      `level ${result.level ?? '?'}`,
      `progress ${result.levelProgress ? `${result.levelProgress.current}/${result.levelProgress.total}` : '?'}`,
      `proficient ${result.proficient ? `${result.proficient.current}/${result.proficient.total}` : '?'}`,
    ].join(', ')
    throw new Error(`The overview numbers could not be read (${detected}). Use the original uncropped Expertise overview screenshot.`)
  }

  onProgress(100, 'Screenshot read successfully')
  return result
}

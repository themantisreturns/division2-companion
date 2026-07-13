import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const CATALOG_FILE = path.join(
  ROOT,
  'public',
  'catalog',
  'catalog.json',
)

const REQUIRED_CATEGORIES = [
  'weapons',
  'namedGear',
  'exotics',
  'brands',
  'gearSets',
  'skills',
  'specializations',
  'mods',
]

async function readJson(file) {
  await access(file)
  return JSON.parse(await readFile(file, 'utf8'))
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
}

function reportError(errors, message) {
  errors.push(message)
  console.error(`✖ ${message}`)
}

function reportWarning(warnings, message) {
  warnings.push(message)
  console.warn(`⚠ ${message}`)
}

function validateItems(categoryName, items, errors, warnings) {
  if (!Array.isArray(items)) {
    reportError(
      errors,
      `${categoryName} must be an array.`,
    )
    return
  }

  if (items.length === 0) {
    reportWarning(
      warnings,
      `${categoryName} is empty.`,
    )
  }

  const seenNames = new Map()
  const seenIds = new Map()

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== 'object') {
      reportError(
        errors,
        `${categoryName}[${index}] must be an object.`,
      )
      continue
    }

    const name = String(item.name ?? '').trim()
    const id = String(item.id ?? '').trim()

    if (!name) {
      reportError(
        errors,
        `${categoryName}[${index}] is missing name.`,
      )
    }

    if (!id) {
      reportError(
        errors,
        `${categoryName}[${index}] is missing id.`,
      )
    }

    const normalizedName = normalize(name)
    const normalizedId = normalize(id)

    if (normalizedName) {
      if (seenNames.has(normalizedName)) {
        reportError(
          errors,
          `${categoryName} contains duplicate name "${name}" ` +
            `at indexes ${seenNames.get(normalizedName)} and ${index}.`,
        )
      } else {
        seenNames.set(normalizedName, index)
      }
    }

    if (normalizedId) {
      if (seenIds.has(normalizedId)) {
        reportError(
          errors,
          `${categoryName} contains duplicate id "${id}" ` +
            `at indexes ${seenIds.get(normalizedId)} and ${index}.`,
        )
      } else {
        seenIds.set(normalizedId, index)
      }
    }
  }
}

function validateCrossCategoryConflicts(
  categories,
  errors,
  warnings,
) {
  const exactItemCategories = [
    'weapons',
    'namedGear',
    'exotics',
    'skills',
    'specializations',
  ]

  const nameMap = new Map()

  for (const categoryName of exactItemCategories) {
    for (const item of categories[categoryName] ?? []) {
      const name = normalize(item?.name)

      if (!name) {
        continue
      }

      const existing = nameMap.get(name) ?? []
      existing.push(categoryName)
      nameMap.set(name, existing)
    }
  }

  for (const [normalizedName, categoryNames] of nameMap) {
    const uniqueCategories = [...new Set(categoryNames)]

    if (uniqueCategories.length > 1) {
      reportWarning(
        warnings,
        `"${normalizedName}" appears in multiple exact-item categories: ` +
          uniqueCategories.join(', '),
      )
    }
  }

  const rankCategories = ['brands', 'gearSets']

  for (const categoryName of rankCategories) {
    for (const item of categories[categoryName] ?? []) {
      if ('rank' in item) {
        const rank = Number(item.rank)

        if (!Number.isFinite(rank) || rank < 0 || rank > 10) {
          reportError(
            errors,
            `${categoryName} item "${item.name}" has invalid rank ${item.rank}.`,
          )
        }
      }
    }
  }
}

function validateSourceSummary(catalog, warnings) {
  const summary = catalog.sourceSummary ?? {}

  for (const [key, value] of Object.entries(summary)) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      reportWarning(
        warnings,
        `sourceSummary.${key} is not a valid non-negative count.`,
      )
    }
  }
}

async function main() {
  const errors = []
  const warnings = []

  let catalog

  try {
    catalog = await readJson(CATALOG_FILE)
  } catch (error) {
    reportError(
      errors,
      `Could not read ${CATALOG_FILE}: ${error.message}`,
    )

    process.exitCode = 1
    return
  }

  if (!catalog || typeof catalog !== 'object') {
    reportError(errors, 'Catalog root must be an object.')
  }

  if (!Number.isInteger(catalog.schemaVersion)) {
    reportError(
      errors,
      'catalog.schemaVersion must be an integer.',
    )
  }

  if (!catalog.categories || typeof catalog.categories !== 'object') {
    reportError(
      errors,
      'catalog.categories must be an object.',
    )
  }

  const categories = catalog.categories ?? {}

  for (const categoryName of REQUIRED_CATEGORIES) {
    if (!(categoryName in categories)) {
      reportError(
        errors,
        `Missing required category: ${categoryName}`,
      )
      continue
    }

    validateItems(
      categoryName,
      categories[categoryName],
      errors,
      warnings,
    )
  }

  validateCrossCategoryConflicts(
    categories,
    errors,
    warnings,
  )

  validateSourceSummary(catalog, warnings)

  console.log('')
  console.log('Catalog validation summary')
  console.log('--------------------------')

  for (const categoryName of REQUIRED_CATEGORIES) {
    const count = Array.isArray(categories[categoryName])
      ? categories[categoryName].length
      : 0

    console.log(
      `${categoryName.padEnd(16)} ${String(count).padStart(4)}`,
    )
  }

  console.log('')
  console.log(`Warnings: ${warnings.length}`)
  console.log(`Errors:   ${errors.length}`)

  if (errors.length > 0) {
    process.exitCode = 1
    return
  }

  console.log('')
  console.log('✓ Catalog validation passed.')
}

await main()

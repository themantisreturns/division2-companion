function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const CATEGORY_LABELS = {
  weapons: 'Weapons',
  namedGear: 'Named Gear',
  exotics: 'Exotics',
  brands: 'Brands',
  gearSets: 'Gear Sets',
  skills: 'Skills',
  specializations: 'Specializations',
  mods: 'Mods',
}

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
}

function getDuplicateNames(items = []) {
  const seen = new Map()
  const duplicates = []

  items.forEach((item, index) => {
    const name = normalize(item?.name)
    if (!name) return

    if (seen.has(name)) {
      duplicates.push({
        name: item.name,
        firstIndex: seen.get(name),
        duplicateIndex: index,
      })
      return
    }

    seen.set(name, index)
  })

  return duplicates
}

function analyzeCategory(name, items) {
  const safeItems = Array.isArray(items) ? items : []
  const missingNames = safeItems.filter(
    (item) => !String(item?.name ?? '').trim(),
  ).length
  const missingIds = safeItems.filter(
    (item) => !String(item?.id ?? '').trim(),
  ).length
  const duplicateNames = getDuplicateNames(safeItems)

  return {
    key: name,
    label: CATEGORY_LABELS[name] ?? name,
    count: safeItems.length,
    missingNames,
    missingIds,
    duplicateNames,
    isEmpty: safeItems.length === 0,
    hasErrors:
      missingNames > 0 ||
      missingIds > 0 ||
      duplicateNames.length > 0,
  }
}

export function analyzeCatalog(catalog) {
  const categories = catalog?.categories ?? {}
  const analyses = Object.keys(CATEGORY_LABELS).map(
    (categoryName) =>
      analyzeCategory(
        categoryName,
        categories[categoryName],
      ),
  )

  const warnings = []
  const errors = []

  analyses.forEach((analysis) => {
    if (analysis.isEmpty) {
      warnings.push(`${analysis.label} is empty.`)
    }

    if (analysis.missingNames) {
      errors.push(
        `${analysis.label} has ${analysis.missingNames} item(s) without a name.`,
      )
    }

    if (analysis.missingIds) {
      errors.push(
        `${analysis.label} has ${analysis.missingIds} item(s) without an ID.`,
      )
    }

    if (analysis.duplicateNames.length) {
      errors.push(
        `${analysis.label} has ${analysis.duplicateNames.length} duplicate name(s).`,
      )
    }
  })

  return {
    analyses,
    warnings,
    errors,
    totalItems: analyses.reduce(
      (sum, analysis) => sum + analysis.count,
      0,
    ),
  }
}

function formatDate(value) {
  if (!value) return 'Unknown'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function renderStatusBadge(analysis) {
  if (analysis.hasErrors) {
    return '<span class="catalog-status error">Error</span>'
  }

  if (analysis.isEmpty) {
    return '<span class="catalog-status warning">Empty</span>'
  }

  return '<span class="catalog-status healthy">Healthy</span>'
}

function renderIssueList(title, issues, type) {
  if (!issues.length) {
    return ''
  }

  return `
    <section class="panel catalog-issues-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">${escapeHtml(type)}</p>
          <h2>${escapeHtml(title)}</h2>
        </div>

        <span class="vendor-count">
          ${issues.length}
        </span>
      </div>

      <div class="catalog-issue-list">
        ${issues
          .map(
            (issue) => `
              <div class="catalog-issue ${escapeHtml(type)}">
                ${escapeHtml(issue)}
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `
}

export function renderCatalogHealthPage(catalog) {
  const health = analyzeCatalog(catalog)
  const sourceSummary = catalog?.sourceSummary ?? {}

  return `
    <section class="feature-page catalog-health-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">System status</p>
          <h1>Catalog Health</h1>

          <p class="subtitle">
            Review catalog counts, generation details, and data-quality issues.
          </p>
        </div>

        <button
          class="primary-button"
          id="refresh-catalog-health"
          type="button"
        >
          Refresh catalog
        </button>
      </header>

      <section class="summary-grid">
        <article class="summary-card accent-card">
          <span class="card-label">Catalog items</span>
          <strong class="metric">${health.totalItems}</strong>
          <span class="metric-note">Across all categories</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Errors</span>
          <strong class="metric">${health.errors.length}</strong>
          <span class="metric-note">
            ${health.errors.length ? 'Needs attention' : 'No blocking issues'}
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Warnings</span>
          <strong class="metric">${health.warnings.length}</strong>
          <span class="metric-note">
            Usually incomplete categories
          </span>
        </article>

        <article class="summary-card">
          <span class="card-label">Generated</span>
          <strong class="metric catalog-date-metric">
            ${escapeHtml(formatDate(catalog?.generatedAt))}
          </strong>
          <span class="metric-note">
            Schema version ${escapeHtml(catalog?.schemaVersion ?? 'Unknown')}
          </span>
        </article>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Category overview</p>
            <h2>Catalog coverage</h2>
          </div>
        </div>

        <div class="catalog-health-grid">
          ${health.analyses
            .map(
              (analysis) => `
                <article class="catalog-health-card">
                  <div>
                    <span class="card-label">
                      ${escapeHtml(analysis.label)}
                    </span>

                    <strong class="catalog-count">
                      ${analysis.count}
                    </strong>
                  </div>

                  ${renderStatusBadge(analysis)}

                  <div class="catalog-card-details">
                    <span>
                      Missing names: ${analysis.missingNames}
                    </span>

                    <span>
                      Missing IDs: ${analysis.missingIds}
                    </span>

                    <span>
                      Duplicates: ${analysis.duplicateNames.length}
                    </span>
                  </div>
                </article>
              `,
            )
            .join('')}
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Generator inputs</p>
            <h2>Source summary</h2>
          </div>
        </div>

        <div class="catalog-source-grid">
          ${
            Object.entries(sourceSummary)
              .map(
                ([name, value]) => `
                  <div class="catalog-source-item">
                    <span>${escapeHtml(name)}</span>
                    <strong>${escapeHtml(value)}</strong>
                  </div>
                `,
              )
              .join('') ||
            '<p class="metric-note">No source summary was recorded.</p>'
          }
        </div>
      </section>

      ${renderIssueList(
        'Blocking catalog issues',
        health.errors,
        'error',
      )}

      ${renderIssueList(
        'Catalog warnings',
        health.warnings,
        'warning',
      )}

      ${
        !health.errors.length && !health.warnings.length
          ? `
            <section class="panel">
              <div class="empty-state compact-empty-state">
                <div class="empty-icon">✓</div>
                <strong>Catalog looks healthy</strong>
                <p>
                  No empty categories, duplicates, or missing identifiers were found.
                </p>
              </div>
            </section>
          `
          : ''
      }
    </section>
  `
}

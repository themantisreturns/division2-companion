import { defaultExpertiseProgress } from './expertiseData.js'
import { migrateExpertiseProgress } from './expertiseMigration.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeExpertiseLevel(value) {
  const level = Number(value) || 0
  return level >= 0 && level <= 30 ? level : 0
}

function itemName(item) {
  return typeof item === 'string' ? item : item?.name ?? ''
}

function normalizeItems(items = []) {
  return items
    .map((item) =>
      typeof item === 'string' ? { name: item } : item,
    )
    .filter((item) => item?.name)
}

export function mergeExpertiseProgress(saved = {}) {
  const migrated = migrateExpertiseProgress(saved)

  return {
    ...migrated,
    level: normalizeExpertiseLevel(migrated.level),
    weapons:
      migrated.legacySummary?.weapons ??
      defaultExpertiseProgress.weapons,
    namedGear:
      migrated.legacySummary?.namedGear ??
      defaultExpertiseProgress.namedGear,
    skills:
      migrated.legacySummary?.skills ??
      defaultExpertiseProgress.skills,
    brands:
      migrated.ranks?.brands ??
      defaultExpertiseProgress.brands,
    gearSets:
      migrated.ranks?.gearSets ??
      defaultExpertiseProgress.gearSets,
  }
}

export function serializeExpertiseProgress(progress) {
  return {
    schemaVersion: progress.schemaVersion,
    level: normalizeExpertiseLevel(progress.level),
    individual: structuredClone(progress.individual ?? {}),
    ranks: structuredClone(progress.ranks ?? {}),
    legacySummary: structuredClone(progress.legacySummary ?? {}),
    migration: structuredClone(progress.migration ?? {}),
  }
}

function groupItems(items, groupKey, fallback = 'Other') {
  return normalizeItems(items).reduce((groups, item) => {
    const key = groupKey(item) || fallback
    groups[key] ??= []
    groups[key].push(item)
    return groups
  }, {})
}

function renderCheckboxRows(kind, items, selected) {
  return items
    .map((item) => {
      const name = itemName(item)
      return `
        <label
          class="expertise-check-item"
          data-search-name="${escapeHtml(name.toLowerCase())}"
        >
          <input
            type="checkbox"
            class="expertise-item-checkbox"
            data-expertise-kind="${kind}"
            data-expertise-name="${escapeHtml(name)}"
            ${selected[name] === true ? 'checked' : ''}
          >
          <span>${escapeHtml(name)}</span>
        </label>
      `
    })
    .join('')
}

function renderGroupedChecklistSection({
  title,
  kind,
  items,
  selected = {},
  groupKey,
  groupOrder = [],
}) {
  const normalized = normalizeItems(items)
  const checkedCount = normalized.filter(
    (item) => selected[item.name] === true,
  ).length
  const groups = groupItems(normalized, groupKey)
  const orderedGroups = [
    ...groupOrder.filter((name) => groups[name]),
    ...Object.keys(groups)
      .filter((name) => !groupOrder.includes(name))
      .sort((a, b) => a.localeCompare(b)),
  ]

  return `
    <section
      class="expertise-section expertise-catalog-section expertise-grouped-section"
      data-catalog-section="${kind}"
    >
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Individual proficiency</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <span class="vendor-count">${checkedCount}/${normalized.length}</span>
      </div>

      <label class="vendor-search expertise-search">
        <span>Search ${escapeHtml(title.toLowerCase())}</span>
        <input type="search" data-catalog-search="${kind}" placeholder="Search…">
      </label>

      <div class="expertise-accordion-list">
        ${orderedGroups
          .map((groupName, index) => {
            const groupItemsList = groups[groupName]
            const groupChecked = groupItemsList.filter(
              (item) => selected[item.name] === true,
            ).length

            return `
              <details class="expertise-accordion" ${index === 0 ? 'open' : ''}>
                <summary>
                  <span>${escapeHtml(groupName)}</span>
                  <span class="expertise-group-count">${groupChecked}/${groupItemsList.length}</span>
                </summary>
                <div class="expertise-checklist">
                  ${renderCheckboxRows(kind, groupItemsList, selected)}
                </div>
              </details>
            `
          })
          .join('') || '<p class="metric-note">No catalog items loaded yet.</p>'}
      </div>
    </section>
  `
}

function renderRankSection(title, kind, items, ranks = {}) {
  const normalized = normalizeItems(items)
  return `
    <section class="expertise-section expertise-catalog-section" data-catalog-section="${kind}">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Proficiency rank</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <span class="vendor-count">${normalized.length} items</span>
      </div>

      <label class="vendor-search expertise-search">
        <span>Search ${escapeHtml(title.toLowerCase())}</span>
        <input type="search" data-catalog-search="${kind}" placeholder="Search…">
      </label>

      <div class="expertise-table expertise-rank-grid">
        ${normalized
          .map((item) => {
            const name = item.name
            return `
              <div class="expertise-entry" data-search-name="${escapeHtml(name.toLowerCase())}">
                <strong>${escapeHtml(name)}</strong>
                <input
                  class="expertise-number"
                  type="number"
                  min="0"
                  max="10"
                  value="${Number(ranks[name]) || 0}"
                  data-rank-kind="${kind}"
                  data-rank-name="${escapeHtml(name)}"
                >
              </div>
            `
          })
          .join('') || '<p class="metric-note">No catalog items loaded yet.</p>'}
      </div>
    </section>
  `
}

export function renderExpertisePage(progress, catalog) {
  const weaponOrder = [
    'Assault Rifles',
    'Rifles',
    'SMGs',
    'LMGs',
    'Shotguns',
    'Marksman Rifles',
    'Pistols',
    'Specialization',
  ]
  const gearOrder = ['Mask', 'Chest', 'Body Armor', 'Backpack', 'Gloves', 'Holster', 'Kneepads']

  return `
    <section class="feature-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Cloud expertise profile</p>
          <h1>Expertise Tracker</h1>
          <p class="subtitle">Track exact proficient items. Changes save automatically.</p>
        </div>
        <div class="save-status" id="expertise-save-status">Cloud profile loaded</div>
      </header>

      <section class="summary-card expertise-level-editor">
        <div>
          <span class="card-label">Overall Expertise level</span>
          <p class="metric-note">Keep this synced with the number shown at your Expertise bench.</p>
        </div>
        <input
          class="expertise-level-input"
          id="expertise-level-input"
          type="number"
          min="0"
          max="30"
          value="${normalizeExpertiseLevel(progress.level)}"
        >
      </section>

      <div class="expertise-page-grid expertise-v2-grid">
        ${renderGroupedChecklistSection({
          title: 'Weapons',
          kind: 'weapons',
          items: catalog.weapons,
          selected: progress.individual?.weapons,
          groupKey: (item) => item.category,
          groupOrder: weaponOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Named Gear',
          kind: 'namedGear',
          items: catalog.namedGear,
          selected: progress.individual?.namedGear,
          groupKey: (item) => item.slot,
          groupOrder: gearOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Exotic Gear',
          kind: 'exotics',
          items: catalog.exotics,
          selected: progress.individual?.exotics,
          groupKey: (item) => item.category,
          groupOrder: gearOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Skills',
          kind: 'skills',
          items: catalog.skills,
          selected: progress.individual?.skills,
          groupKey: (item) => item.family,
        })}

        ${renderGroupedChecklistSection({
          title: 'Specializations',
          kind: 'specializations',
          items: catalog.specializations,
          selected: progress.individual?.specializations,
          groupKey: () => 'Specialization Weapons',
          groupOrder: ['Specialization Weapons'],
        })}

        ${renderRankSection('Brands', 'brands', catalog.brands, progress.ranks?.brands)}
        ${renderRankSection('Gear Sets', 'gearSets', catalog.gearSets, progress.ranks?.gearSets)}
      </div>
    </section>
  `
}

export function connectExpertiseFilters() {
  document.querySelectorAll('[data-catalog-search]').forEach((input) => {
    input.addEventListener('input', () => {
      const section = input.closest('[data-catalog-section]')
      const query = input.value.trim().toLowerCase()

      section?.querySelectorAll('[data-search-name]').forEach((item) => {
        item.hidden = Boolean(query) && !item.dataset.searchName.includes(query)
      })

      section?.querySelectorAll('.expertise-accordion').forEach((group) => {
        const visibleItems = [...group.querySelectorAll('[data-search-name]')].filter(
          (item) => !item.hidden,
        )
        group.hidden = Boolean(query) && visibleItems.length === 0
        if (query && visibleItems.length > 0) group.open = true
      })
    })
  })
}

export function readExpertiseForm(progress) {
  const updated = structuredClone(progress)
  updated.level = normalizeExpertiseLevel(
    document.querySelector('#expertise-level-input')?.value,
  )

  document.querySelectorAll('.expertise-item-checkbox').forEach((input) => {
    const kind = input.dataset.expertiseKind
    const name = input.dataset.expertiseName
    updated.individual[kind] ??= {}
    updated.individual[kind][name] = input.checked
  })

  document.querySelectorAll('[data-rank-kind]').forEach((input) => {
    const kind = input.dataset.rankKind
    const name = input.dataset.rankName
    updated.ranks[kind] ??= {}
    updated.ranks[kind][name] = Math.max(0, Math.min(10, Number(input.value) || 0))
  })

  updated.brands = updated.ranks.brands
  updated.gearSets = updated.ranks.gearSets
  updated.weapons = updated.legacySummary.weapons
  updated.namedGear = updated.legacySummary.namedGear
  updated.skills = updated.legacySummary.skills

  return updated
}

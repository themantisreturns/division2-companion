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

export function mergeExpertiseProgress(saved = {}) {
  const migrated = migrateExpertiseProgress(saved)

  return {
    ...migrated,
    weapons: migrated.legacySummary?.weapons ?? defaultExpertiseProgress.weapons,
    namedGear: migrated.legacySummary?.namedGear ?? defaultExpertiseProgress.namedGear,
    skills: migrated.legacySummary?.skills ?? defaultExpertiseProgress.skills,
    brands: migrated.ranks?.brands ?? defaultExpertiseProgress.brands,
    gearSets: migrated.ranks?.gearSets ?? defaultExpertiseProgress.gearSets,
  }
}

export function serializeExpertiseProgress(progress) {
  return {
    schemaVersion: progress.schemaVersion,
    level: Number(progress.level) || 0,
    individual: structuredClone(progress.individual ?? {}),
    ranks: structuredClone(progress.ranks ?? {}),
    legacySummary: structuredClone(progress.legacySummary ?? {}),
    migration: structuredClone(progress.migration ?? {}),
  }
}

function renderChecklistSection(title, kind, items, selected = {}) {
  const checkedCount = items.filter((name) => selected[name] === true).length

  return `
    <section class="expertise-section expertise-catalog-section" data-catalog-section="${kind}">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Individual proficiency</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <span class="vendor-count">${checkedCount}/${items.length}</span>
      </div>

      <label class="vendor-search expertise-search">
        <span>Search ${escapeHtml(title.toLowerCase())}</span>
        <input type="search" data-catalog-search="${kind}" placeholder="Search…">
      </label>

      <div class="expertise-checklist">
        ${items.map((name) => `
          <label class="expertise-check-item" data-search-name="${escapeHtml(name.toLowerCase())}">
            <input
              type="checkbox"
              class="expertise-item-checkbox"
              data-expertise-kind="${kind}"
              data-expertise-name="${escapeHtml(name)}"
              ${selected[name] === true ? 'checked' : ''}
            >
            <span>${escapeHtml(name)}</span>
          </label>
        `).join('') || '<p class="metric-note">No catalog items loaded yet.</p>'}
      </div>
    </section>
  `
}

function renderRankSection(title, kind, names, ranks = {}) {
  return `
    <section class="expertise-section">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Proficiency rank</p>
          <h2>${escapeHtml(title)}</h2>
        </div>
      </div>

      <div class="expertise-table">
        ${names.map((name) => `
          <div class="expertise-entry">
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
        `).join('')}
      </div>
    </section>
  `
}

export function renderExpertisePage(progress, catalog) {
  return `
    <section class="feature-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Cloud expertise profile</p>
          <h1>Expertise Tracker</h1>
          <p class="subtitle">
            Track exact proficient items. Changes save automatically.
          </p>
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
          value="${Number(progress.level) || 0}"
        >
      </section>

      <section class="panel migration-note">
        <strong>Version 2 profile active</strong>
        <p>
          Your old category totals are preserved in the profile while exact-item tracking is filled in.
          The weapon and named-item catalog currently grows from the weekly vendor files.
        </p>
      </section>

      <div class="expertise-page-grid expertise-v2-grid">
        ${renderChecklistSection('Weapons', 'weapons', catalog.weapons, progress.individual?.weapons)}
        ${renderChecklistSection('Named Gear', 'namedGear', catalog.namedGear, progress.individual?.namedGear)}
        ${renderChecklistSection('Exotics', 'exotics', catalog.exotics, progress.individual?.exotics)}
        ${renderChecklistSection('Skills', 'skills', catalog.skills, progress.individual?.skills)}
        ${renderChecklistSection('Specializations', 'specializations', catalog.specializations, progress.individual?.specializations)}
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

      section?.querySelectorAll('.expertise-check-item').forEach((item) => {
        item.hidden = Boolean(query) && !item.dataset.searchName.includes(query)
      })
    })
  })
}

export function readExpertiseForm(progress) {
  const updated = structuredClone(progress)
  updated.level = Number(document.querySelector('#expertise-level-input')?.value) || 0

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

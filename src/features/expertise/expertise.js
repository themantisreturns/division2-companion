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
    shdLevel: Math.max(0, Number(migrated.shdLevel) || 0),
    levelProgress: {
      current: Math.max(0, Number(migrated.levelProgress?.current) || 0),
      total: Math.max(1, Number(migrated.levelProgress?.total) || 200),
    },
    proficient: {
      current: Math.max(0, Number(migrated.proficient?.current) || 0),
      total: Math.max(0, Number(migrated.proficient?.total) || 0),
    },
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
    individualRanks: migrated.individualRanks ?? {},
  }
}

export function serializeExpertiseProgress(progress) {
  return {
    schemaVersion: progress.schemaVersion,
    level: normalizeExpertiseLevel(progress.level),
    shdLevel: Math.max(0, Number(progress.shdLevel) || 0),
    levelProgress: structuredClone(progress.levelProgress ?? { current: 0, total: 200 }),
    proficient: structuredClone(progress.proficient ?? { current: 0, total: 0 }),
    individual: structuredClone(progress.individual ?? {}),
    individualRanks: structuredClone(progress.individualRanks ?? {}),
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

function expertiseAction(kind, rank) {
  if (rank >= 10) return { label: 'PROFICIENT', cls: 'done' }
  if (rank >= 7) return { label: 'FINISH NOW', cls: 'finish' }
  if (kind === 'skills' || kind === 'specializations') return { label: 'EQUIP', cls: 'equip' }
  if (kind === 'namedGear' || kind === 'exotics') return { label: 'MATERIALS', cls: 'materials' }
  return { label: 'DONATE COPIES', cls: 'copies' }
}

function renderRankRows(kind, items, ranks = {}) {
  return items.map((item) => {
    const name = itemName(item)
    const rank = Math.max(0, Math.min(10, Number(ranks[name]) || 0))
    const action = expertiseAction(kind, rank)
    return `
      <div class="expertise-rank-row" data-search-name="${escapeHtml(name.toLowerCase())}" data-expertise-row data-kind="${kind}" data-name="${escapeHtml(name)}">
        <div class="expertise-rank-name"><strong>${escapeHtml(name)}</strong><span class="expertise-action ${action.cls}">${action.label}</span></div>
        <div class="expertise-rank-control">
          <button type="button" class="expertise-rank-step" data-rank-step="-1" aria-label="Decrease ${escapeHtml(name)} rank">−</button>
          <input class="expertise-number expertise-individual-rank" type="number" min="0" max="10" value="${rank}" data-individual-rank-kind="${kind}" data-individual-rank-name="${escapeHtml(name)}">
          <button type="button" class="expertise-rank-step" data-rank-step="1" aria-label="Increase ${escapeHtml(name)} rank">+</button>
        </div>
      </div>`
  }).join('')
}

function renderGroupedChecklistSection({
  title,
  kind,
  items,
  ranks = {},
  groupKey,
  groupOrder = [],
}) {
  const normalized = normalizeItems(items)
  const checkedCount = normalized.filter((item) => (Number(ranks[item.name]) || 0) >= 10).length
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
            const groupChecked = groupItemsList.filter((item) => (Number(ranks[item.name]) || 0) >= 10).length

            return `
              <details class="expertise-accordion" ${index === 0 ? 'open' : ''}>
                <summary>
                  <span>${escapeHtml(groupName)}</span>
                  <span class="expertise-group-count">${groupChecked}/${groupItemsList.length}</span>
                </summary>
                <div class="expertise-checklist">
                  ${renderRankRows(kind, groupItemsList, ranks)}
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

      <section class="expertise-overview-panel">
        <div class="expertise-overview-heading">
          <div>
            <p class="eyebrow">Expertise overview</p>
            <h2>Bench progress</h2>
          </div>
          <button class="secondary-button" type="button" id="expertise-scan-button">Import screenshot</button>
        </div>
        <div class="expertise-overview-grid">
          <label class="expertise-overview-field">
            <span>Expertise level</span>
            <input id="expertise-level-input" type="number" min="0" max="30" value="${normalizeExpertiseLevel(progress.level)}">
          </label>
          <label class="expertise-overview-field">
            <span>Progress toward next level</span>
            <span class="expertise-ratio-inputs">
              <input id="expertise-progress-current" type="number" min="0" value="${Number(progress.levelProgress?.current) || 0}">
              <b>/</b>
              <input id="expertise-progress-total" type="number" min="1" value="${Number(progress.levelProgress?.total) || 200}">
            </span>
          </label>
          <label class="expertise-overview-field">
            <span>Proficient items</span>
            <span class="expertise-ratio-inputs">
              <input id="expertise-proficient-current" type="number" min="0" value="${Number(progress.proficient?.current) || 0}">
              <b>/</b>
              <input id="expertise-proficient-total" type="number" min="0" value="${Number(progress.proficient?.total) || 0}">
            </span>
          </label>
          <label class="expertise-overview-field">
            <span>SHD level</span>
            <input id="expertise-shd-level" type="number" min="0" value="${Number(progress.shdLevel) || 0}">
          </label>
        </div>
        <input id="expertise-screenshot-input" type="file" accept="image/png,image/jpeg,image/webp" hidden>
        <div class="expertise-scan-status" id="expertise-scan-status" hidden aria-live="polite"></div>
      </section>

      <section class="expertise-planner" id="expertise-planner">
        <div class="panel-heading">
          <div><p class="eyebrow">Road to Expertise 30</p><h2>What should I work on next?</h2></div>
          <span class="vendor-count" id="expertise-ranks-remaining">Calculating…</span>
        </div>
        <div class="expertise-plan-grid" id="expertise-plan-grid"></div>
        <p class="metric-note">Finish rank 7–9 items first. Equip unfinished skills/brands/sets while playing; donate duplicate normal weapons and gear; save material donations for rare named/exotic items.</p>
      </section>

      <div class="expertise-page-grid expertise-v2-grid">
        ${renderGroupedChecklistSection({
          title: 'Weapons',
          kind: 'weapons',
          items: catalog.weapons,
          ranks: progress.individualRanks?.weapons,
          groupKey: (item) => item.category,
          groupOrder: weaponOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Named Gear',
          kind: 'namedGear',
          items: catalog.namedGear,
          ranks: progress.individualRanks?.namedGear,
          groupKey: (item) => item.slot,
          groupOrder: gearOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Exotic Gear',
          kind: 'exotics',
          items: catalog.exotics,
          ranks: progress.individualRanks?.exotics,
          groupKey: (item) => item.category,
          groupOrder: gearOrder,
        })}

        ${renderGroupedChecklistSection({
          title: 'Skills',
          kind: 'skills',
          items: catalog.skills,
          ranks: progress.individualRanks?.skills,
          groupKey: (item) => item.family,
        })}

        ${renderGroupedChecklistSection({
          title: 'Specializations',
          kind: 'specializations',
          items: catalog.specializations,
          ranks: progress.individualRanks?.specializations,
          groupKey: () => 'Specialization Weapons',
          groupOrder: ['Specialization Weapons'],
        })}

        ${renderRankSection('Brands', 'brands', catalog.brands, progress.ranks?.brands)}
        ${renderRankSection('Gear Sets', 'gearSets', catalog.gearSets, progress.ranks?.gearSets)}
      </div>
    </section>
  `
}

function collectPlannerRows() {
  return [...document.querySelectorAll('[data-expertise-row]')].map((row) => {
    const input = row.querySelector('.expertise-individual-rank')
    return { row, kind: row.dataset.kind, name: row.dataset.name, rank: Math.max(0, Math.min(10, Number(input?.value) || 0)) }
  })
}

export function updateExpertisePlanner() {
  const rows = collectPlannerRows()
  const brandRows = [...document.querySelectorAll('[data-rank-kind]')].map((input) => ({ kind: input.dataset.rankKind, name: input.dataset.rankName, rank: Math.max(0, Math.min(10, Number(input.value) || 0)) }))
  const all = [...rows, ...brandRows]
  const remaining = all.reduce((sum, item) => sum + (10 - item.rank), 0)
  const remainingEl = document.querySelector('#expertise-ranks-remaining')
  if (remainingEl) remainingEl.textContent = `${remaining.toLocaleString()} proficiency ranks remaining`

  const quick = all.filter((x) => x.rank < 10).sort((a,b) => (10-a.rank)-(10-b.rank) || b.rank-a.rank).sort((a,b) => (10-a.rank) - (10-b.rank)).slice(0, 8)
  const grid = document.querySelector('#expertise-plan-grid')
  if (grid) grid.innerHTML = quick.length ? quick.map((item) => {
    const action = expertiseAction(item.kind, item.rank)
    return `<div class="expertise-plan-card"><span class="expertise-action ${action.cls}">${action.label}</span><strong>${escapeHtml(item.name)}</strong><span>Rank ${item.rank}/10 · ${10-item.rank} to go</span></div>`
  }).join('') : '<div class="expertise-plan-card"><strong>Everything tracked is proficient.</strong><span>Nice work, Agent.</span></div>'

  document.querySelectorAll('.expertise-rank-row').forEach((row) => {
    const input = row.querySelector('.expertise-individual-rank')
    const badge = row.querySelector('.expertise-action')
    const action = expertiseAction(row.dataset.kind, Number(input?.value) || 0)
    if (badge) { badge.textContent = action.label; badge.className = `expertise-action ${action.cls}` }
  })
}

export function connectExpertiseRankControls(onChange) {
  document.querySelectorAll('.expertise-rank-step').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement?.querySelector('.expertise-individual-rank')
      if (!input) return
      input.value = Math.max(0, Math.min(10, (Number(input.value) || 0) + Number(button.dataset.rankStep || 0)))
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  })
  document.querySelectorAll('.expertise-individual-rank, [data-rank-kind]').forEach((input) => input.addEventListener('input', () => { updateExpertisePlanner(); onChange?.() }))
  updateExpertisePlanner()
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


export function updateExpertiseLiveCounts(changedInput = null) {
  if (changedInput?.matches?.('.expertise-item-checkbox')) {
    const group = changedInput.closest('.expertise-accordion')
    if (group) {
      const checked = group.querySelectorAll('.expertise-item-checkbox:checked').length
      const total = group.querySelectorAll('.expertise-item-checkbox').length
      const counter = group.querySelector('.expertise-group-count')
      if (counter) counter.textContent = `${checked}/${total}`
    }

    const section = changedInput.closest('[data-catalog-section]')
    if (section) {
      const checked = section.querySelectorAll('.expertise-item-checkbox:checked').length
      const total = section.querySelectorAll('.expertise-item-checkbox').length
      const counter = section.querySelector('.panel-heading .vendor-count')
      if (counter) counter.textContent = `${checked}/${total}`
    }
  }

  const proficientInput = document.querySelector('#expertise-proficient-current')
  if (proficientInput && changedInput?.matches?.('.expertise-item-checkbox')) {
    const wasChecked = changedInput.dataset.countedState === 'true'
    const isChecked = changedInput.checked

    if (wasChecked !== isChecked) {
      const current = Math.max(0, Number(proficientInput.value) || 0)
      proficientInput.value = Math.max(0, current + (isChecked ? 1 : -1))
      changedInput.dataset.countedState = String(isChecked)
    }
  }
}

export function connectExpertiseLiveCounts() {
  updated.individualRanks ??= {}
  document.querySelectorAll('.expertise-individual-rank').forEach((input) => {
    const kind = input.dataset.individualRankKind
    const name = input.dataset.individualRankName
    updated.individualRanks[kind] ??= {}
    const rank = Math.max(0, Math.min(10, Number(input.value) || 0))
    updated.individualRanks[kind][name] = rank
    updated.individual[kind] ??= {}
    updated.individual[kind][name] = rank >= 10
  })

  document.querySelectorAll('.expertise-item-checkbox').forEach((input) => {
    input.addEventListener('input', () => updateExpertiseLiveCounts(input))
  })
}

export function readExpertiseForm(progress) {
  const updated = structuredClone(progress)
  updated.level = normalizeExpertiseLevel(
    document.querySelector('#expertise-level-input')?.value,
  )
  updated.shdLevel = Math.max(0, Number(document.querySelector('#expertise-shd-level')?.value) || 0)
  updated.levelProgress = {
    current: Math.max(0, Number(document.querySelector('#expertise-progress-current')?.value) || 0),
    total: Math.max(1, Number(document.querySelector('#expertise-progress-total')?.value) || 200),
  }
  updated.proficient = {
    current: Math.max(0, Number(document.querySelector('#expertise-proficient-current')?.value) || 0),
    total: Math.max(0, Number(document.querySelector('#expertise-proficient-total')?.value) || 0),
  }

  updated.individualRanks ??= {}
  document.querySelectorAll('.expertise-individual-rank').forEach((input) => {
    const kind = input.dataset.individualRankKind
    const name = input.dataset.individualRankName
    updated.individualRanks[kind] ??= {}
    const rank = Math.max(0, Math.min(10, Number(input.value) || 0))
    updated.individualRanks[kind][name] = rank
    updated.individual[kind] ??= {}
    updated.individual[kind][name] = rank >= 10
  })

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

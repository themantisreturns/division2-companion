import { defaultExpertiseProgress } from './expertiseData.js'

export function mergeExpertiseProgress(saved = {}) {
  return {
    ...structuredClone(defaultExpertiseProgress),
    ...saved,

    weapons: {
      ...defaultExpertiseProgress.weapons,
      ...(saved.weapons ?? {}),
    },

    namedGear: {
      ...defaultExpertiseProgress.namedGear,
      ...(saved.namedGear ?? {}),
    },

    skills: {
      ...defaultExpertiseProgress.skills,
      ...(saved.skills ?? {}),
    },

    brands: {
      ...defaultExpertiseProgress.brands,
      ...(saved.brands ?? {}),
    },

    gearSets: {
      ...defaultExpertiseProgress.gearSets,
      ...(saved.gearSets ?? {}),
    },
  }
}

function renderFractionSection(title, groupName, items) {
  return `
    <section class="expertise-section">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Expertise category</p>
          <h2>${title}</h2>
        </div>
      </div>

      <div class="expertise-table">
        ${Object.entries(items)
          .map(
            ([name, value]) => `
              <div class="expertise-entry">
                <strong>${name}</strong>

                <div class="fraction-inputs">
                  <input
                    class="expertise-number"
                    type="number"
                    min="0"
                    max="${value.total}"
                    value="${value.current}"
                    data-group="${groupName}"
                    data-name="${name}"
                    data-field="current"
                  >

                  <span>/</span>

                  <strong>${value.total}</strong>
                </div>
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `
}

function renderLevelSection(title, groupName, items) {
  return `
    <section class="expertise-section">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Proficiency rank</p>
          <h2>${title}</h2>
        </div>
      </div>

      <div class="expertise-table">
        ${Object.entries(items)
          .map(
            ([name, value]) => `
              <div class="expertise-entry">
                <strong>${name}</strong>

                <input
                  class="expertise-number"
                  type="number"
                  min="0"
                  max="10"
                  value="${value}"
                  data-group="${groupName}"
                  data-name="${name}"
                >
              </div>
            `,
          )
          .join('')}
      </div>
    </section>
  `
}

export function renderExpertisePage(progress) {
  return `
    <section class="feature-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Cloud expertise profile</p>
          <h1>Expertise Tracker</h1>
          <p class="subtitle">
            Update your in-game progress. Changes save automatically.
          </p>
        </div>

        <div class="save-status" id="expertise-save-status">
          Cloud profile loaded
        </div>
      </header>

      <section class="summary-card expertise-level-editor">
        <div>
          <span class="card-label">Overall Expertise level</span>
          <p class="metric-note">Enter the level shown beside your Expertise bench.</p>
        </div>

        <input
          class="expertise-level-input"
          id="expertise-level-input"
          type="number"
          min="0"
          max="30"
          value="${progress.level ?? 0}"
        >
      </section>

      <div class="expertise-page-grid">
        ${renderFractionSection('Weapons', 'weapons', progress.weapons)}
        ${renderFractionSection(
          'Named & Exotic Gear',
          'namedGear',
          progress.namedGear,
        )}
        ${renderFractionSection('Skills', 'skills', progress.skills)}
        ${renderLevelSection('Brands', 'brands', progress.brands)}
        ${renderLevelSection('Gear Sets', 'gearSets', progress.gearSets)}
      </div>
    </section>
  `
}

export function readExpertiseForm(progress) {
  const updated = structuredClone(progress)

  updated.level =
    Number(document.querySelector('#expertise-level-input')?.value) || 0

  document.querySelectorAll('.expertise-number').forEach((input) => {
    const group = input.dataset.group
    const name = input.dataset.name
    const field = input.dataset.field
    const value = Number(input.value) || 0

    if (field) {
      updated[group][name][field] = value
    } else {
      updated[group][name] = value
    }
  })

  return updated
}
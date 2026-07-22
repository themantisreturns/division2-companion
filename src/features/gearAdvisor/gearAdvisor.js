const gearTargets = [
  {
    id: 'fenris-chest-obliterate',
    brand: 'Fenris Group AB',
    slot: 'Chest',
    talent: 'Obliterate',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['AR Crit DPS', 'St. Elmo Striker', 'General Heroic DPS'],
    notes:
      'One of the strongest general-purpose AR chest combinations. Keep any copy where only one roll needs recalibration.',
  },
  {
    id: 'fenris-chest-unbreakable',
    brand: 'Fenris Group AB',
    slot: 'Chest',
    talent: 'Unbreakable',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 4,
    verdict: 'Excellent',
    builds: ['Solo AR DPS', 'Survivable Heroic DPS'],
    notes:
      'Lower damage than Obliterate but much safer for solo Heroic content.',
  },
  {
    id: 'ceska-chest-obliterate',
    brand: 'Česká Výroba s.r.o.',
    slot: 'Chest',
    talent: 'Obliterate',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Crit DPS', 'Striker DPS', 'SMG or AR DPS'],
    notes:
      'Especially valuable when the build needs additional Critical Hit Chance.',
  },
  {
    id: 'grupo-chest-obliterate',
    brand: 'Grupo Sombra S.A.',
    slot: 'Chest',
    talent: 'Obliterate',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Crit DPS', 'Striker DPS', 'Raid DPS'],
    notes:
      'A highly reusable damage chest for builds already near the Critical Hit Chance cap.',
  },
  {
    id: 'grupo-backpack-vigilance',
    brand: 'Grupo Sombra S.A.',
    slot: 'Backpack',
    talent: 'Vigilance',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Crit DPS', 'Raid DPS', 'Rifle DPS'],
    notes:
      'Excellent all-red backpack. Keep copies that can be completed with one recalibration.',
  },
  {
    id: 'providence-backpack-vigilance',
    brand: 'Providence Defense',
    slot: 'Backpack',
    talent: 'Vigilance',
    attributes: ['Critical Hit Chance', 'Critical Hit Damage'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Classic DPS', 'Rifle DPS', 'Headshot Crit DPS'],
    notes:
      'A staple high-end damage backpack.',
  },
  {
    id: 'belstone-backpack-bloodsucker',
    brand: 'Belstone Armory',
    slot: 'Backpack',
    talent: 'Bloodsucker',
    attributes: ['Armor Regeneration', 'Critical Hit Chance'],
    priority: 4,
    verdict: 'Excellent',
    builds: ['Solo Armor Regen', 'Bruiser', 'Memento Alternative'],
    notes:
      'Useful for solo builds that want sustain without using Memento.',
  },
  {
    id: 'empress-chest-kinetic-momentum',
    brand: 'Empress International',
    slot: 'Chest',
    talent: 'Kinetic Momentum',
    attributes: ['Skill Damage', 'Skill Haste'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Turret and Drone', 'Legendary Skill Build'],
    notes:
      'A core skill-build chest. Skill Damage is the most important secondary roll.',
  },
  {
    id: 'empress-backpack-combined-arms',
    brand: 'Empress International',
    slot: 'Backpack',
    talent: 'Combined Arms',
    attributes: ['Skill Damage', 'Skill Haste'],
    priority: 5,
    verdict: 'Meta keep',
    builds: ['Turret and Drone', 'Hybrid Skill Damage'],
    notes:
      'Excellent for weapon-assisted skill builds.',
  },
  {
    id: 'eclipse-backpack',
    brand: 'Eclipse Protocol',
    slot: 'Backpack',
    talent: 'Symptom Aggravator',
    attributes: ['Status Effects', 'Skill Haste'],
    priority: 5,
    verdict: 'Keep best copy',
    builds: ['Status Effects', 'Crowd Control'],
    notes:
      'Gear-set pieces are easier to replace, but the backpack is central to Eclipse builds.',
  },
]

function stars(priority) {
  return '★'.repeat(priority) + '☆'.repeat(5 - priority)
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

function matchesTarget(target, filters) {
  const search = normalize(filters.search)
  const brand = normalize(filters.brand)
  const slot = normalize(filters.slot)
  const talent = normalize(filters.talent)

  const searchableText = normalize(
    [
      target.brand,
      target.slot,
      target.talent,
      target.attributes.join(' '),
      target.builds.join(' '),
      target.notes,
    ].join(' '),
  )

  return (
    (!search || searchableText.includes(search)) &&
    (!brand || normalize(target.brand) === brand) &&
    (!slot || normalize(target.slot) === slot) &&
    (!talent || normalize(target.talent) === talent)
  )
}

function uniqueValues(key) {
  return [...new Set(gearTargets.map((item) => item[key]))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function renderOptions(values, placeholder) {
  return `
    <option value="">${placeholder}</option>
    ${values
      .map(
        (value) => `
          <option value="${value}">${value}</option>
        `,
      )
      .join('')}
  `
}

function renderTargetCard(target) {
  return `
    <article class="panel gear-advisor-card">
      <div class="gear-advisor-card-heading">
        <div>
          <p class="eyebrow">${target.slot}</p>
          <h2>${target.brand}</h2>
        </div>

        <div class="gear-advisor-rating">
          <strong>${stars(target.priority)}</strong>
          <span>${target.verdict}</span>
        </div>
      </div>

      <div class="gear-advisor-details">
        <div>
          <span class="card-label">Talent</span>
          <strong>${target.talent}</strong>
        </div>

        <div>
          <span class="card-label">Ideal attributes</span>
          <strong>${target.attributes.join(' + ')}</strong>
        </div>
      </div>

      <div class="gear-advisor-builds">
        ${target.builds
          .map((build) => `<span class="gear-build-tag">${build}</span>`)
          .join('')}
      </div>

      <p class="gear-advisor-notes">${target.notes}</p>
    </article>
  `
}

function readFilters() {
  return {
    search: document.querySelector('#gear-advisor-search')?.value,
    brand: document.querySelector('#gear-advisor-brand')?.value,
    slot: document.querySelector('#gear-advisor-slot')?.value,
    talent: document.querySelector('#gear-advisor-talent')?.value,
  }
}

function updateResults() {
  const results = document.querySelector('#gear-advisor-results')
  const count = document.querySelector('#gear-advisor-count')

  if (!results || !count) return

  const matches = gearTargets
    .filter((target) => matchesTarget(target, readFilters()))
    .sort((a, b) => b.priority - a.priority)

  count.textContent =
    `${matches.length} recommended combination${matches.length === 1 ? '' : 's'}`

  results.innerHTML = matches.length
    ? matches.map(renderTargetCard).join('')
    : `
      <article class="panel empty-state">
        <strong>No matching god-roll targets</strong>
        <p>Try removing one or more filters.</p>
      </article>
    `
}

export function renderGearAdvisorPage() {
  return `
    <section class="feature-page gear-advisor-page">
      <div class="feature-heading">
        <div>
          <p class="eyebrow">Loot decision tool</p>
          <h1>Gear Advisor</h1>
          <p class="subtitle">
            Check high-value gear combinations before donating,
            dismantling, or selling an item.
          </p>
        </div>
      </div>

      <article class="panel gear-advisor-filters">
        <div class="gear-advisor-filter-grid">
          <label>
            <span>Search</span>
            <input
              id="gear-advisor-search"
              type="search"
              placeholder="Brand, talent, attribute, or build"
            />
          </label>

          <label>
            <span>Brand or gear set</span>
            <select id="gear-advisor-brand">
              ${renderOptions(
                uniqueValues('brand'),
                'All brands and sets',
              )}
            </select>
          </label>

          <label>
            <span>Slot</span>
            <select id="gear-advisor-slot">
              ${renderOptions(uniqueValues('slot'), 'All slots')}
            </select>
          </label>

          <label>
            <span>Talent</span>
            <select id="gear-advisor-talent">
              ${renderOptions(
                uniqueValues('talent'),
                'All talents',
              )}
            </select>
          </label>
        </div>

        <div class="gear-advisor-filter-footer">
          <strong id="gear-advisor-count"></strong>

          <button
            class="text-button"
            id="gear-advisor-clear"
            type="button"
          >
            Clear filters
          </button>
        </div>
      </article>

      <div
        class="gear-advisor-results"
        id="gear-advisor-results"
      ></div>
    </section>
  `
}

export function connectGearAdvisorPage() {
  const controls = document.querySelectorAll(
    '#gear-advisor-search, #gear-advisor-brand, #gear-advisor-slot, #gear-advisor-talent',
  )

  controls.forEach((control) => {
    control.addEventListener('input', updateResults)
    control.addEventListener('change', updateResults)
  })

  document
    .querySelector('#gear-advisor-clear')
    ?.addEventListener('click', () => {
      controls.forEach((control) => {
        control.value = ''
      })

      updateResults()
    })

  updateResults()
}

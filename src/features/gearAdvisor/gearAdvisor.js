import {
  ARMOR_SLOTS,
  GEAR_RULES,
  WEAPON_ATTRIBUTES,
  WEAPON_CATEGORIES,
  WEAPON_RULES,
  WEAPON_TALENTS,
} from '../knowledge/knowledgeData.js'
import { evaluateGearItem } from '../knowledge/knowledgeEngine.js'

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function stars(score) {
  const count = Math.max(1, Math.min(5, Math.round(Number(score || 0) / 20)))
  return `${'★'.repeat(count)}${'☆'.repeat(5 - count)}`
}

function uniqueValues(key) {
  return [...new Set(GEAR_RULES.flatMap((rule) => rule[key] ?? []))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

function renderOptions(values, placeholder) {
  return `<option value="">${escapeHtml(placeholder)}</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`
}

function renderEvaluation(result) {
  return `
    <div class="advisor-verdict advisor-tier-${escapeHtml(result.tier)}">
      <div class="advisor-score">
        <strong>${stars(result.score)}</strong>
        <span>${escapeHtml(result.score)} / 100</span>
      </div>
      <div>
        <p class="eyebrow">Recommendation</p>
        <h2>${escapeHtml(result.verdict)}</h2>
        <p>${escapeHtml(result.reason)}</p>
      </div>
    </div>
    <div class="advisor-result-grid">
      <div>
        <span class="card-label">Recalibration advice</span>
        <strong>${escapeHtml(result.recalibration)}</strong>
      </div>
      <div>
        <span class="card-label">Build uses</span>
        <strong>${escapeHtml(result.builds?.length ? result.builds.join(' · ') : 'No specific build match')}</strong>
      </div>
    </div>
  `
}

function readItemForm() {
  const itemType = document.querySelector('#advisor-item-type')?.value ?? 'armor'
  return {
    itemType,
    name: document.querySelector('#advisor-name')?.value,
    brand: document.querySelector('#advisor-brand')?.value,
    slot: document.querySelector('#advisor-slot')?.value,
    category: document.querySelector('#advisor-category')?.value,
    talent: document.querySelector('#advisor-talent')?.value,
    core: document.querySelector('#advisor-core')?.value,
    attributes: document.querySelector('#advisor-attributes')?.value,
    rarity: document.querySelector('#advisor-rarity')?.value,
  }
}

function evaluateForm() {
  const output = document.querySelector('#advisor-result')
  if (!output) return
  output.innerHTML = renderEvaluation(evaluateGearItem(readItemForm()))
}

function renderArmorRuleCard(rule) {
  return `
    <article class="panel gear-advisor-card" data-rule-type="armor" data-rule-search="${escapeHtml([rule.brands, rule.slots, rule.talents, rule.attributes, rule.builds].flat().join(' ').toLowerCase())}">
      <div class="gear-advisor-card-heading">
        <div>
          <p class="eyebrow">Armor · ${escapeHtml(rule.slots.join(' / '))}</p>
          <h2>${escapeHtml(rule.brands.join(' / '))}</h2>
        </div>
        <div class="gear-advisor-rating"><strong>${stars(rule.score)}</strong><span>${escapeHtml(rule.verdict)}</span></div>
      </div>
      <div class="gear-advisor-details">
        <div><span class="card-label">Talent</span><strong>${escapeHtml(rule.talents.length ? rule.talents.join(' / ') : 'Any or slot-specific')}</strong></div>
        <div><span class="card-label">Ideal attributes</span><strong>${escapeHtml(rule.attributes.join(' + '))}</strong></div>
      </div>
      <div class="gear-advisor-builds">${rule.builds.map((build) => `<span class="gear-build-tag">${escapeHtml(build)}</span>`).join('')}</div>
      <p class="gear-advisor-notes">${escapeHtml(rule.reason)}</p>
    </article>
  `
}

function renderWeaponRuleCard(rule) {
  return `
    <article class="panel gear-advisor-card" data-rule-type="weapon" data-rule-search="${escapeHtml([rule.categories, rule.talents, rule.attributes, rule.builds].flat().join(' ').toLowerCase())}">
      <div class="gear-advisor-card-heading">
        <div>
          <p class="eyebrow">Weapon</p>
          <h2>${escapeHtml(rule.categories.join(' / '))}</h2>
        </div>
        <div class="gear-advisor-rating"><strong>${stars(rule.score)}</strong><span>${escapeHtml(rule.verdict)}</span></div>
      </div>
      <div class="gear-advisor-details">
        <div><span class="card-label">Strong talents</span><strong>${escapeHtml(rule.talents.join(' / '))}</strong></div>
        <div><span class="card-label">Preferred third attribute</span><strong>${escapeHtml(rule.attributes.join(' / '))}</strong></div>
      </div>
      <div class="gear-advisor-builds">${rule.builds.map((build) => `<span class="gear-build-tag">${escapeHtml(build)}</span>`).join('')}</div>
      <p class="gear-advisor-notes">${escapeHtml(rule.reason)}</p>
    </article>
  `
}

function updateItemType() {
  const itemType = document.querySelector('#advisor-item-type')?.value ?? 'armor'
  document.querySelectorAll('[data-advisor-for]').forEach((field) => {
    field.hidden = field.dataset.advisorFor !== itemType
  })

  const rarity = document.querySelector('#advisor-rarity')
  if (rarity) {
    rarity.innerHTML = itemType === 'weapon'
      ? '<option value="">High-end</option><option>Named</option><option>Exotic</option>'
      : '<option value="">High-end</option><option>Named</option><option>Exotic</option><option>Gear Set</option>'
  }
}

function updateLibraryResults() {
  const query = String(document.querySelector('#gear-advisor-search')?.value ?? '').trim().toLowerCase()
  const type = document.querySelector('#gear-advisor-library-type')?.value ?? 'all'
  let visible = 0

  document.querySelectorAll('[data-rule-search]').forEach((card) => {
    const matchesType = type === 'all' || card.dataset.ruleType === type
    const matchesQuery = !query || card.dataset.ruleSearch.includes(query)
    card.hidden = !(matchesType && matchesQuery)
    if (!card.hidden) visible += 1
  })

  const count = document.querySelector('#gear-advisor-library-count')
  if (count) count.textContent = `${visible} target${visible === 1 ? '' : 's'} shown`
}

export function renderGearAdvisorPage() {
  const allRules = [
    ...GEAR_RULES.sort((a, b) => b.score - a.score).map(renderArmorRuleCard),
    ...WEAPON_RULES.sort((a, b) => b.score - a.score).map(renderWeaponRuleCard),
  ].join('')

  return `
    <section class="feature-page gear-advisor-page">
      <header class="feature-header">
        <div><p class="eyebrow">Knowledge engine</p><h1>Gear & Weapon Advisor</h1><p class="subtitle">Evaluate every armor slot and all major weapon categories before donating, dismantling, or selling an item.</p></div>
      </header>

      <section class="advisor-workspace">
        <article class="panel advisor-entry-panel">
          <div class="panel-heading"><div><p class="eyebrow">Evaluate a drop</p><h2>Item details</h2></div></div>
          <div class="gear-advisor-filter-grid">
            <label><span>Item type</span><select id="advisor-item-type"><option value="armor">Armor</option><option value="weapon">Weapon</option></select></label>
            <label><span>Item name</span><input id="advisor-name" placeholder="Optional named or exotic item"></label>

            <label data-advisor-for="armor"><span>Brand or gear set</span><select id="advisor-brand">${renderOptions(uniqueValues('brands'), 'Select brand or set')}</select></label>
            <label data-advisor-for="armor"><span>Armor slot</span><select id="advisor-slot">${renderOptions(ARMOR_SLOTS, 'Select slot')}</select></label>
            <label data-advisor-for="armor"><span>Core</span><input id="advisor-core" placeholder="Weapon Damage, Armor, Skill Tier"></label>

            <label data-advisor-for="weapon" hidden><span>Weapon category</span><select id="advisor-category">${renderOptions(WEAPON_CATEGORIES, 'Select category')}</select></label>

            <label><span>Talent</span><input id="advisor-talent" list="advisor-talent-list" placeholder="Enter or select talent"><datalist id="advisor-talent-list">${WEAPON_TALENTS.map((talent) => `<option value="${escapeHtml(talent)}"></option>`).join('')}</datalist></label>
            <label><span data-armor-label>Attributes / rolls</span><input id="advisor-attributes" list="advisor-attribute-list" placeholder="Enter important attributes"><datalist id="advisor-attribute-list">${WEAPON_ATTRIBUTES.map((attribute) => `<option value="${escapeHtml(attribute)}"></option>`).join('')}</datalist></label>
            <label><span>Rarity</span><select id="advisor-rarity"><option value="">High-end</option><option>Named</option><option>Exotic</option><option>Gear Set</option></select></label>
          </div>
          <p class="advisor-help">Armor supports Mask, Chest, Holster, Backpack, Gloves, and Kneepads. For weapons, enter the rolled third attribute in the Attributes field.</p>
          <button type="button" class="primary-button" id="advisor-evaluate">Evaluate item</button>
        </article>

        <article class="panel advisor-result-panel" id="advisor-result">
          <div class="empty-state"><div class="empty-icon">★</div><strong>Ready to evaluate</strong><p>Select armor or weapon, enter the rolls, and choose Evaluate item.</p></div>
        </article>
      </section>

      <section class="panel gear-advisor-filters">
        <div class="panel-heading"><div><p class="eyebrow">Target library</p><h2>Armor and weapon roll targets</h2></div><strong id="gear-advisor-library-count"></strong></div>
        <div class="advisor-library-filters">
          <label class="vendor-search"><span>Search targets</span><input id="gear-advisor-search" type="search" placeholder="Slot, brand, weapon category, talent, attribute, or build"></label>
          <label><span>Show</span><select id="gear-advisor-library-type"><option value="all">All targets</option><option value="armor">Armor only</option><option value="weapon">Weapons only</option></select></label>
        </div>
      </section>
      <div class="gear-advisor-results" id="gear-advisor-results">${allRules}</div>
    </section>
  `
}

export function connectGearAdvisorPage() {
  document.querySelector('#advisor-evaluate')?.addEventListener('click', evaluateForm)
  document.querySelector('#advisor-item-type')?.addEventListener('change', updateItemType)
  document.querySelectorAll('#advisor-name, #advisor-brand, #advisor-slot, #advisor-category, #advisor-talent, #advisor-core, #advisor-attributes, #advisor-rarity').forEach((control) => {
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') evaluateForm()
    })
  })
  document.querySelector('#gear-advisor-search')?.addEventListener('input', updateLibraryResults)
  document.querySelector('#gear-advisor-library-type')?.addEventListener('change', updateLibraryResults)
  updateItemType()
  updateLibraryResults()
}

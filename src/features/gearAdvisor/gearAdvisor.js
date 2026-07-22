import { GEAR_RULES } from '../knowledge/knowledgeData.js'
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
  return {
    name: document.querySelector('#advisor-name')?.value,
    brand: document.querySelector('#advisor-brand')?.value,
    slot: document.querySelector('#advisor-slot')?.value,
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

function renderRuleCard(rule) {
  return `
    <article class="panel gear-advisor-card" data-rule-search="${escapeHtml([rule.brands, rule.slots, rule.talents, rule.attributes, rule.builds].flat().join(' ').toLowerCase())}">
      <div class="gear-advisor-card-heading">
        <div>
          <p class="eyebrow">${escapeHtml(rule.slots.join(' / '))}</p>
          <h2>${escapeHtml(rule.brands.join(' / '))}</h2>
        </div>
        <div class="gear-advisor-rating"><strong>${stars(rule.score)}</strong><span>${escapeHtml(rule.verdict)}</span></div>
      </div>
      <div class="gear-advisor-details">
        <div><span class="card-label">Talent</span><strong>${escapeHtml(rule.talents.length ? rule.talents.join(' / ') : 'Set-specific')}</strong></div>
        <div><span class="card-label">Ideal attributes</span><strong>${escapeHtml(rule.attributes.join(' + '))}</strong></div>
      </div>
      <div class="gear-advisor-builds">${rule.builds.map((build) => `<span class="gear-build-tag">${escapeHtml(build)}</span>`).join('')}</div>
      <p class="gear-advisor-notes">${escapeHtml(rule.reason)}</p>
    </article>
  `
}

export function renderGearAdvisorPage() {
  return `
    <section class="feature-page gear-advisor-page">
      <header class="feature-header">
        <div><p class="eyebrow">Knowledge engine</p><h1>Gear Advisor</h1><p class="subtitle">Enter a dropped item to get a keep, recalibrate, donate, or dismantle recommendation.</p></div>
      </header>

      <section class="advisor-workspace">
        <article class="panel advisor-entry-panel">
          <div class="panel-heading"><div><p class="eyebrow">Evaluate a drop</p><h2>Item details</h2></div></div>
          <div class="gear-advisor-filter-grid">
            <label><span>Item name</span><input id="advisor-name" placeholder="Optional named item"></label>
            <label><span>Brand or gear set</span><select id="advisor-brand">${renderOptions(uniqueValues('brands'), 'Select brand or set')}</select></label>
            <label><span>Slot</span><select id="advisor-slot">${renderOptions(uniqueValues('slots'), 'Select slot')}</select></label>
            <label><span>Talent</span><select id="advisor-talent">${renderOptions(uniqueValues('talents'), 'No talent / select talent')}</select></label>
            <label><span>Core</span><input id="advisor-core" placeholder="Weapon Damage, Armor, Skill Tier"></label>
            <label><span>Attributes</span><input id="advisor-attributes" placeholder="Critical Hit Chance, Critical Hit Damage"></label>
            <label><span>Rarity</span><select id="advisor-rarity"><option value="">High-end</option><option>Named</option><option>Exotic</option><option>Gear Set</option></select></label>
          </div>
          <button type="button" class="primary-button" id="advisor-evaluate">Evaluate item</button>
        </article>

        <article class="panel advisor-result-panel" id="advisor-result">
          <div class="empty-state"><div class="empty-icon">★</div><strong>Ready to evaluate</strong><p>Enter the item exactly as it appears in game, then select Evaluate item.</p></div>
        </article>
      </section>

      <section class="panel gear-advisor-filters">
        <div class="panel-heading"><div><p class="eyebrow">God-roll library</p><h2>Curated targets</h2></div></div>
        <label class="vendor-search"><span>Search targets</span><input id="gear-advisor-search" type="search" placeholder="Brand, talent, attribute, or build"></label>
      </section>
      <div class="gear-advisor-results" id="gear-advisor-results">${GEAR_RULES.sort((a, b) => b.score - a.score).map(renderRuleCard).join('')}</div>
    </section>
  `
}

export function connectGearAdvisorPage() {
  document.querySelector('#advisor-evaluate')?.addEventListener('click', evaluateForm)
  document.querySelectorAll('#advisor-name, #advisor-brand, #advisor-slot, #advisor-talent, #advisor-core, #advisor-attributes, #advisor-rarity').forEach((control) => {
    control.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') evaluateForm()
    })
  })
  document.querySelector('#gear-advisor-search')?.addEventListener('input', (event) => {
    const query = String(event.target.value ?? '').trim().toLowerCase()
    document.querySelectorAll('[data-rule-search]').forEach((card) => {
      card.hidden = Boolean(query) && !card.dataset.ruleSearch.includes(query)
    })
  })
}

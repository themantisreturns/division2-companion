import { BUILD_ARCHETYPES } from '../knowledge/knowledgeData.js'
import { optimizeBuild } from '../../services/builds/buildOptimizer.js'
import { generateBuildFromTemplate } from '../../services/builds/buildGenerator.js'
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
}

const BUILD_SLOTS = [
  { key: 'primary', label: 'Primary weapon', categories: ['weapons', 'exotics'] },
  { key: 'secondary', label: 'Secondary weapon', categories: ['weapons', 'exotics'] },
  { key: 'sidearm', label: 'Sidearm', categories: ['weapons', 'exotics'] },
  { key: 'mask', label: 'Mask', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
  { key: 'chest', label: 'Chest', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
  { key: 'holster', label: 'Holster', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
  { key: 'backpack', label: 'Backpack', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
  { key: 'gloves', label: 'Gloves', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
  { key: 'kneepads', label: 'Kneepads', categories: ['namedGear', 'exotics', 'brands', 'gearSets'] },
]

export const BUILD_TEMPLATES = [
  {
    id: 'striker-dps',
    name: "Striker's DPS",
    role: 'DPS',
    difficulty: 'Easy to assemble',
    description: 'Fast-stacking weapon damage build for solo play, Countdown, and general PvE.',
    rolls: 'Weapon Damage cores. Add Critical Hit Chance until near 60%, then Critical Hit Damage.',
    talents: 'Use the Striker chest or backpack when you can maintain stacks; otherwise pair four pieces with a strong high-end chest or backpack.',
    slots: {
      mask: ['gearSets', "Striker's Battlegear"],
      chest: ['gearSets', "Striker's Battlegear"],
      holster: ['gearSets', "Striker's Battlegear"],
      backpack: ['gearSets', "Striker's Battlegear"],
      gloves: ['brands', 'Fenris Group AB'],
      kneepads: ['brands', 'Grupo Sombra S.A.'],
    },
  },
  {
    id: 'ar-crit',
    name: 'AR Crit DPS',
    role: 'DPS',
    difficulty: 'Flexible',
    description: 'Classic high-end assault-rifle build with reusable double-crit pieces.',
    rolls: 'Weapon Damage, Critical Hit Chance, and Critical Hit Damage.',
    talents: 'Obliterate or Glass Cannon on chest; Vigilance or Composure on backpack.',
    slots: {
      mask: ['brands', 'Česká Výroba s.r.o.'],
      chest: ['brands', 'Fenris Group AB'],
      holster: ['brands', 'Grupo Sombra S.A.'],
      backpack: ['brands', 'Providence Defense'],
      gloves: ['namedGear', "Contractor's Gloves"],
      kneepads: ['namedGear', "Fox's Prayer"],
    },
  },
  {
    id: 'turret-drone',
    name: 'Turret & Drone',
    role: 'Skill',
    difficulty: 'Easy to play',
    description: 'Reliable skill-damage setup for solo farming and difficult PvE content.',
    rolls: 'Skill Tier cores with Skill Damage first and Skill Haste second.',
    talents: 'Kinetic Momentum on chest; Combined Arms or Tech Support on backpack.',
    slots: {
      mask: ['brands', 'Empress International'],
      chest: ['brands', 'Empress International'],
      holster: ['brands', 'Empress International'],
      backpack: ['brands', 'Hana-U Corporation'],
      gloves: ['brands', 'Wyvern Wear'],
      kneepads: ['brands', 'Hana-U Corporation'],
    },
  },
  {
    id: 'status-effects',
    name: 'Status Effects',
    role: 'Crowd control',
    difficulty: 'Team focused',
    description: 'Eclipse-based status build that spreads crowd control and damage-over-time effects.',
    rolls: 'Skill Tier cores with Status Effects on every possible piece; Skill Haste where available.',
    talents: 'Eclipse chest and backpack are the safest default for maximum spread and damage.',
    slots: {
      mask: ['gearSets', 'Eclipse Protocol'],
      chest: ['gearSets', 'Eclipse Protocol'],
      holster: ['gearSets', 'Eclipse Protocol'],
      backpack: ['gearSets', 'Eclipse Protocol'],
      gloves: ['brands', 'Electrique'],
      kneepads: ['brands', 'Golan Gear Ltd'],
    },
  },
  {
    id: 'healer',
    name: 'Healer / Support',
    role: 'Support',
    difficulty: 'Team focused',
    description: 'Repair-focused loadout for raids, Incursion groups, and difficult team content.',
    rolls: 'Skill Tier cores with Repair Skills and Skill Haste.',
    talents: 'Future Initiative chest where available; Safeguard or Opportunistic backpack depending on role.',
    slots: {
      mask: ['gearSets', 'Future Initiative'],
      chest: ['gearSets', 'Future Initiative'],
      holster: ['gearSets', 'Future Initiative'],
      backpack: ['gearSets', 'Future Initiative'],
      gloves: ['brands', 'Alps Summit Armament'],
      kneepads: ['brands', 'Murakami Industries'],
    },
  },
  {
    id: 'armor-bruiser',
    name: 'Armor / Bruiser',
    role: 'Tank',
    difficulty: 'Flexible',
    description: 'Durable close-range setup that balances survivability with usable weapon damage.',
    rolls: 'Armor cores with Armor Regeneration, Hazard Protection, or crit rolls based on playstyle.',
    talents: 'Intimidate, Unbreakable, Vanguard, Adrenaline Rush, or Bloodsucker.',
    slots: {
      mask: ['brands', 'Gila Guard'],
      chest: ['brands', 'Uzina Getica'],
      holster: ['brands', 'Belstone Armory'],
      backpack: ['brands', 'Golan Gear Ltd'],
      gloves: ['brands', 'Gila Guard'],
      kneepads: ['brands', 'Belstone Armory'],
    },
  },
]

function buildSelectionValue(category, name, slotKey) {
  return category === 'brands' || category === 'gearSets'
    ? `${category}|${name}|${slotKey}`
    : `${category}|${name}`
}

function templateToSlots(template, catalog) {
  return Object.fromEntries(
    Object.entries(template.slots ?? {}).flatMap(([slotKey, spec]) => {
      const [category, requestedName] = spec
      const items = catalog?.categories?.[category] ?? []
      const match = items.find((item) => normalizeText(item.name) === normalizeText(requestedName))
      if (!match) return []
      return [[slotKey, buildSelectionValue(category, match.name, slotKey)]]
    }),
  )
}

function getBuildArchetype(build) {
  const explicit = BUILD_TEMPLATES.find((template) => template.id === build?.archetypeId)
  if (explicit) return explicit
  const name = normalizeText(build?.name)
  return BUILD_TEMPLATES.find((template) => name.includes(normalizeText(template.name))) ?? null
}


function createId() {
  return crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
}


const ARMOR_SLOT_KEYS = ['mask', 'chest', 'holster', 'backpack', 'gloves', 'kneepads']
const ATTRIBUTE_OPTIONS = [
  ['none', 'None'],
  ['chc', 'Critical Hit Chance'],
  ['chd', 'Critical Hit Damage'],
  ['hsd', 'Headshot Damage'],
  ['skillDamage', 'Skill Damage'],
  ['skillHaste', 'Skill Haste'],
  ['repairSkills', 'Repair Skills'],
  ['armorRegen', 'Armor Regeneration'],
  ['hazard', 'Hazard Protection'],
]

function defaultSlotSimulator() {
  return {
    coreType: 'weapon',
    coreValue: 15,
    attribute1: 'chc',
    attribute1Value: 6,
    attribute2: 'chd',
    attribute2Value: 12,
  }
}

function createDefaultSimulatorState() {
  return {
    baseArmor: 726015,
    weapon: {
      baseDamage: 100000,
      rpm: 700,
      magazine: 30,
      extraWeaponDamage: 0,
    },
    slots: Object.fromEntries(ARMOR_SLOT_KEYS.map((key) => [key, defaultSlotSimulator()])),
  }
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function normalizeSimulatorState(value) {
  const defaults = createDefaultSimulatorState()
  const source = value && typeof value === 'object' ? value : {}
  const weapon = source.weapon && typeof source.weapon === 'object' ? source.weapon : {}
  const slots = source.slots && typeof source.slots === 'object' ? source.slots : {}

  return {
    baseArmor: finiteNumber(source.baseArmor, defaults.baseArmor),
    weapon: {
      baseDamage: finiteNumber(weapon.baseDamage, defaults.weapon.baseDamage),
      rpm: finiteNumber(weapon.rpm, defaults.weapon.rpm),
      magazine: finiteNumber(weapon.magazine, defaults.weapon.magazine),
      extraWeaponDamage: finiteNumber(weapon.extraWeaponDamage, defaults.weapon.extraWeaponDamage),
    },
    slots: Object.fromEntries(ARMOR_SLOT_KEYS.map((key) => {
      const slot = slots[key] && typeof slots[key] === 'object' ? slots[key] : {}
      const fallback = defaults.slots[key]
      return [key, {
        coreType: ['weapon', 'armor', 'skill'].includes(slot.coreType) ? slot.coreType : fallback.coreType,
        coreValue: finiteNumber(slot.coreValue, fallback.coreValue),
        attribute1: ATTRIBUTE_OPTIONS.some(([id]) => id === slot.attribute1) ? slot.attribute1 : fallback.attribute1,
        attribute1Value: finiteNumber(slot.attribute1Value, fallback.attribute1Value),
        attribute2: ATTRIBUTE_OPTIONS.some(([id]) => id === slot.attribute2) ? slot.attribute2 : fallback.attribute2,
        attribute2Value: finiteNumber(slot.attribute2Value, fallback.attribute2Value),
      }]
    })),
  }
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value || 0))
}

function calculateBuildStats(build) {
  const simulator = normalizeSimulatorState(build?.simulator)
  const totals = {
    weaponDamage: simulator.weapon.extraWeaponDamage,
    armor: simulator.baseArmor,
    skillTier: 0,
    chc: 0,
    chd: 0,
    hsd: 0,
    skillDamage: 0,
    skillHaste: 0,
    repairSkills: 0,
    armorRegen: 0,
    hazard: 0,
  }

  for (const slot of Object.values(simulator.slots)) {
    if (slot.coreType === 'weapon') totals.weaponDamage += slot.coreValue
    if (slot.coreType === 'armor') totals.armor += slot.coreValue
    if (slot.coreType === 'skill') totals.skillTier += slot.coreValue
    if (slot.attribute1 !== 'none') totals[slot.attribute1] += slot.attribute1Value
    if (slot.attribute2 !== 'none') totals[slot.attribute2] += slot.attribute2Value
  }

  const effectiveChc = Math.min(60, Math.max(0, totals.chc))
  const shotDamage = simulator.weapon.baseDamage * (1 + totals.weaponDamage / 100)
  const averageShot = shotDamage * (1 + (effectiveChc / 100) * (totals.chd / 100))
  const burstDps = averageShot * Math.max(0, simulator.weapon.rpm) / 60
  const magazineDamage = averageShot * Math.max(0, simulator.weapon.magazine)
  const configuredSlots = Object.values(build?.slots ?? {}).filter(Boolean).length
  const score = Math.max(0, Math.min(100, Math.round(
    (configuredSlots / BUILD_SLOTS.length) * 45 +
    Math.min(25, effectiveChc / 60 * 25) +
    Math.min(20, totals.chd / 180 * 20) +
    Math.min(10, (totals.weaponDamage + totals.skillTier * 15 + Math.max(0, totals.armor - simulator.baseArmor) / 17000) / 90),
  )))

  const warnings = []
  if (totals.chc > 60) warnings.push(`${(totals.chc - 60).toFixed(1)}% Critical Hit Chance is above the 60% cap.`)
  if (simulator.weapon.baseDamage <= 0 || simulator.weapon.rpm <= 0) warnings.push('Enter weapon base damage and RPM for a useful DPS estimate.')
  if (totals.skillTier > 6) warnings.push(`Skill Tier ${totals.skillTier} exceeds the normal tier-6 cap.`)

  return { simulator, totals, effectiveChc, shotDamage, averageShot, burstDps, magazineDamage, score, warnings }
}

function renderAttributeOptions(selected) {
  return ATTRIBUTE_OPTIONS.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('')
}

function renderSimulatorSlot(build, slotKey) {
  const slot = normalizeSimulatorState(build.simulator).slots[slotKey]
  const slotLabel = BUILD_SLOTS.find((entry) => entry.key === slotKey)?.label ?? slotKey
  return `
    <article class="simulator-slot-card">
      <strong>${escapeHtml(slotLabel)}</strong>
      <div class="simulator-field-grid">
        <label>
          <span>Core</span>
          <select data-sim-slot="${slotKey}" data-sim-field="coreType">
            <option value="weapon" ${slot.coreType === 'weapon' ? 'selected' : ''}>Weapon Damage %</option>
            <option value="armor" ${slot.coreType === 'armor' ? 'selected' : ''}>Armor</option>
            <option value="skill" ${slot.coreType === 'skill' ? 'selected' : ''}>Skill Tier</option>
          </select>
        </label>
        <label>
          <span>Core value</span>
          <input type="number" step="0.1" data-sim-slot="${slotKey}" data-sim-field="coreValue" value="${slot.coreValue}">
        </label>
        <label>
          <span>Attribute 1</span>
          <select data-sim-slot="${slotKey}" data-sim-field="attribute1">${renderAttributeOptions(slot.attribute1)}</select>
        </label>
        <label>
          <span>Value</span>
          <input type="number" step="0.1" data-sim-slot="${slotKey}" data-sim-field="attribute1Value" value="${slot.attribute1Value}">
        </label>
        <label>
          <span>Attribute 2</span>
          <select data-sim-slot="${slotKey}" data-sim-field="attribute2">${renderAttributeOptions(slot.attribute2)}</select>
        </label>
        <label>
          <span>Value</span>
          <input type="number" step="0.1" data-sim-slot="${slotKey}" data-sim-field="attribute2Value" value="${slot.attribute2Value}">
        </label>
      </div>
    </article>
  `
}


function optimizerStatusCopy(row) {
  if (row.status === 'upgrade') return { label: `UPGRADE +${row.improvement}`, className: 'upgrade' }
  if (row.status === 'optimal') return { label: 'BEST REVIEWED', className: 'optimal' }
  if (row.status === 'missing-reviewed-copy') return { label: 'ALTERNATIVE FOUND', className: 'candidate' }
  if (row.status === 'candidate') return { label: 'BEST OWNED', className: 'candidate' }
  if (row.status === 'empty') return { label: 'NO SCANNED COPY', className: 'unreviewed' }
  return { label: 'SCAN TO COMPARE', className: 'unreviewed' }
}

function renderBuildOptimizer(build, inventory, catalog) {
  const analysis = optimizeBuild({ build, inventory, catalog })
  const configuredRows = analysis.slots.filter((row) => row.selected || row.best)

  return `
    <section class="panel build-optimizer-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Best-in-stash analysis</p>
          <h2>Build optimizer</h2>
        </div>
        <span class="build-score-badge">Potential ${analysis.potentialScore}/100</span>
      </div>

      <p class="simulator-disclaimer">The optimizer compares screenshot-reviewed copies in your inventory. Scan gear to make its recommendations more complete.</p>

      <div class="optimizer-summary-grid">
        <article><span>Current reviewed score</span><strong>${analysis.currentScore || '—'}</strong></article>
        <article><span>Potential score</span><strong>${analysis.potentialScore || '—'}</strong></article>
        <article><span>Possible gain</span><strong>${analysis.improvement ? `+${analysis.improvement}` : '0'}</strong></article>
        <article><span>Upgrade slots</span><strong>${analysis.upgradeCount}</strong></article>
        <article><span>Reviewed slots</span><strong>${analysis.reviewedSlots}/${analysis.configuredSlots}</strong></article>
      </div>

      ${configuredRows.length ? `
        <div class="optimizer-slot-list">
          ${configuredRows.map((row) => {
            const slot = BUILD_SLOTS.find((entry) => entry.key === row.slotKey)
            const status = optimizerStatusCopy(row)
            const currentName = row.current?.name ?? row.selected?.displayName ?? 'Not selected'
            const bestName = row.best?.name ?? 'No screenshot-reviewed candidate'
            return `
              <article class="optimizer-slot-row ${status.className}">
                <div class="optimizer-slot-title">
                  <span class="vendor-item-kind">${escapeHtml(slot?.label ?? row.slotKey)}</span>
                  <strong>${escapeHtml(currentName)}</strong>
                  <small>${row.current ? `Current score ${row.current.fitScore}` : 'Current copy has not been screenshot-reviewed'}</small>
                </div>
                <div class="optimizer-best-copy">
                  <span>Best reviewed</span>
                  <strong>${escapeHtml(bestName)}</strong>
                  ${row.best ? `<small>Score ${row.best.fitScore}${row.best.attributes ? ` · ${escapeHtml(row.best.attributes)}` : ''}${row.best.talent ? ` · ${escapeHtml(row.best.talent)}` : ''}</small>` : '<small>Use Inventory Scanner to add roll data.</small>'}
                </div>
                <span class="optimizer-status ${status.className}">${escapeHtml(status.label)}</span>
              </article>
            `
          }).join('')}
        </div>
      ` : `
        <div class="empty-state compact-empty-state">
          <div class="empty-icon">◇</div>
          <strong>No optimizer candidates yet</strong>
          <p>Select build items and keep screenshot-scanned copies in Inventory.</p>
        </div>
      `}
    </section>
  `
}

function renderBuildSimulator(build) {
  const stats = calculateBuildStats(build)
  const { simulator, totals } = stats
  return `
    <section class="panel build-simulator-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Live build simulator</p>
          <h2>Estimated character stats</h2>
        </div>
        <span class="build-score-badge">Build score ${stats.score}/100</span>
      </div>

      <p class="simulator-disclaimer">Enter the visible rolls from each piece. Damage is a comparison estimate before talents, amplified damage, enemy armor, headshots, expertise, and specialization bonuses.</p>

      <div class="simulator-weapon-grid">
        <label><span>Weapon base damage</span><input type="number" data-sim-weapon="baseDamage" value="${simulator.weapon.baseDamage}"></label>
        <label><span>RPM</span><input type="number" data-sim-weapon="rpm" value="${simulator.weapon.rpm}"></label>
        <label><span>Magazine</span><input type="number" data-sim-weapon="magazine" value="${simulator.weapon.magazine}"></label>
        <label><span>Other weapon damage %</span><input type="number" step="0.1" data-sim-weapon="extraWeaponDamage" value="${simulator.weapon.extraWeaponDamage}"></label>
        <label><span>Base armor</span><input type="number" data-sim-root="baseArmor" value="${simulator.baseArmor}"></label>
      </div>

      <div class="simulator-results-grid">
        <article><span>Weapon damage</span><strong>${totals.weaponDamage.toFixed(1)}%</strong></article>
        <article><span>Critical chance</span><strong>${totals.chc.toFixed(1)}%</strong><small>${stats.effectiveChc.toFixed(1)}% effective</small></article>
        <article><span>Critical damage</span><strong>${totals.chd.toFixed(1)}%</strong></article>
        <article><span>Armor</span><strong>${formatCompactNumber(totals.armor)}</strong></article>
        <article><span>Skill tier</span><strong>${totals.skillTier.toFixed(0)}</strong></article>
        <article><span>Est. burst DPS</span><strong>${formatCompactNumber(stats.burstDps)}</strong></article>
        <article><span>Average shot</span><strong>${formatCompactNumber(stats.averageShot)}</strong></article>
        <article><span>Magazine damage</span><strong>${formatCompactNumber(stats.magazineDamage)}</strong></article>
        <article><span>Headshot damage</span><strong>${totals.hsd.toFixed(1)}%</strong></article>
        <article><span>Skill damage</span><strong>${totals.skillDamage.toFixed(1)}%</strong></article>
        <article><span>Skill haste</span><strong>${totals.skillHaste.toFixed(1)}%</strong></article>
        <article><span>Repair skills</span><strong>${totals.repairSkills.toFixed(1)}%</strong></article>
        <article><span>Armor regen</span><strong>${formatCompactNumber(totals.armorRegen)}</strong></article>
        <article><span>Hazard protection</span><strong>${totals.hazard.toFixed(1)}%</strong></article>
      </div>

      ${stats.warnings.length ? `<div class="simulator-warnings">${stats.warnings.map((warning) => `<p>⚠ ${escapeHtml(warning)}</p>`).join('')}</div>` : ''}

      <div class="simulator-slot-grid">
        ${ARMOR_SLOT_KEYS.map((slotKey) => renderSimulatorSlot(build, slotKey)).join('')}
      </div>

      <div class="simulator-actions">
        <button type="button" class="secondary-button" data-reset-simulator>Reset simulator rolls</button>
      </div>
    </section>
  `
}


function renderBuildGenerator() {
  return `
    <section class="panel build-generator-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Intelligent build wizard</p>
          <h2>Generate a build</h2>
        </div>
        <span class="build-score-badge">Uses your inventory</span>
      </div>
      <p class="simulator-disclaimer">Choose a playstyle, then generate the best build from items you own or create a dream build with a personalized farming list.</p>
      <div class="build-generator-controls">
        <label>
          <span>Playstyle</span>
          <select id="build-generator-template">
            ${BUILD_TEMPLATES.map((template) => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)} · ${escapeHtml(template.role)}</option>`).join('')}
          </select>
        </label>
        <label>
          <span>Specialization</span>
          <select id="build-generator-specialization">
            <option>Gunner</option><option>Technician</option><option>Firewall</option><option>Survivalist</option><option>Sharpshooter</option><option>Demolitionist</option>
          </select>
        </label>
        <div class="build-generator-actions">
          <button type="button" class="primary-button" data-generate-build="owned">Use what I own</button>
          <button type="button" class="secondary-button" data-generate-build="dream">Create dream build</button>
        </div>
      </div>
    </section>
  `
}

export function createEmptyBuildsState() {
  return {
    schemaVersion: 2,
    builds: [],
    updatedAt: null,
  }
}

export function normalizeBuildsState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyBuildsState()
  }

  return {
    schemaVersion: 2,
    builds: Array.isArray(value.builds)
      ? value.builds.map((build) => ({
          id: String(build.id || createId()),
          name: String(build.name || 'Untitled build'),
          notes: String(build.notes || ''),
          archetypeId: String(build.archetypeId || ''),
          slots:
            build.slots && typeof build.slots === 'object'
              ? { ...build.slots }
              : {},
          simulator: normalizeSimulatorState(build.simulator),
          createdAt: build.createdAt || new Date().toISOString(),
          updatedAt: build.updatedAt || new Date().toISOString(),
        }))
      : [],
    updatedAt: value.updatedAt ?? null,
  }
}

function normalizeSlotName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

function itemMatchesGearSlot(item, slot) {
  if (!item || !slot) {
    return true
  }

  const itemSlot = item.slot ?? item.category ?? ''

  if (!itemSlot) {
    return true
  }

  return normalizeSlotName(itemSlot) === normalizeSlotName(slot.label)
}

function itemMatchesWeaponSlot(item, slot) {
  if (!item || !slot) {
    return true
  }

  const weaponCategory = String(item.category ?? '').toLowerCase()

  if (slot.key === 'sidearm') {
    return weaponCategory.includes('pistol')
  }

  return !weaponCategory.includes('pistol')
}

function parseBuildSelection(value, fallbackSlotKey = '') {
  if (!value) {
    return null
  }

  const [category, name = '', encodedSlotKey = ''] = String(value).split('|')
  const slotKey = encodedSlotKey || fallbackSlotKey
  const slot = BUILD_SLOTS.find((entry) => entry.key === slotKey)
  const isGenericGear = category === 'brands' || category === 'gearSets'

  return {
    category,
    name,
    slotKey,
    displayName: isGenericGear && slot
      ? `${name} ${slot.label}`
      : name,
  }
}

function inventoryQuantity(inventory, selectedItem) {
  if (!selectedItem) {
    return 0
  }

  const categoryItems = inventory?.items?.[selectedItem.category] ?? {}

  if (
    selectedItem.category === 'brands' ||
    selectedItem.category === 'gearSets'
  ) {
    return Number(categoryItems[selectedItem.displayName]) || 0
  }

  return Number(categoryItems[selectedItem.name]) || 0
}

function getCatalogOptions(catalog, slot) {
  return slot.categories
    .flatMap((category) =>
      (catalog?.categories?.[category] ?? [])
        .filter((item) => {
          if (category === 'namedGear' || category === 'exotics') {
            if (slot.key === 'primary' || slot.key === 'secondary' || slot.key === 'sidearm') {
              // Exotic weapons live in the weapons catalog in Catalog v2.
              return false
            }

            return itemMatchesGearSlot(item, slot)
          }

          if (category === 'weapons') {
            return itemMatchesWeaponSlot(item, slot)
          }

          return true
        })
        .map((item) => {
          const isGenericGear = category === 'brands' || category === 'gearSets'
          const displayName = isGenericGear
            ? `${item.name} ${slot.label}`
            : item.name

          return {
            category,
            name: item.name,
            displayName,
            value: isGenericGear
              ? `${category}|${item.name}|${slot.key}`
              : `${category}|${item.name}`,
            legacyValue: `${category}|${item.name}`,
            label: `${displayName} · ${CATEGORY_LABELS[category] ?? category}`,
          }
        }),
    )
    .sort((a, b) => a.label.localeCompare(b.label))
}

function renderSlot(build, slot, catalog, inventory) {
  const selected = build.slots?.[slot.key] ?? ''
  const selectedItem = parseBuildSelection(selected, slot.key)
  const options = getCatalogOptions(catalog, slot)

  let ownedText = 'Not selected'
  let ownedClass = ''

  if (selectedItem) {
    const quantity = inventoryQuantity(inventory, selectedItem)

    ownedText = quantity > 0
      ? `Owned: ${quantity}`
      : 'Missing'
    ownedClass = quantity > 0 ? 'owned' : 'missing'
  }

  const groups = slot.categories
    .map((category) => {
      const groupOptions = options.filter((option) => option.category === category)

      if (!groupOptions.length) {
        return ''
      }

      return `
        <optgroup label="${escapeHtml(CATEGORY_LABELS[category] ?? category)}">
          ${groupOptions
            .map((option) => {
              const isSelected = selected === option.value || selected === option.legacyValue

              return `
                <option
                  value="${escapeHtml(option.value)}"
                  ${isSelected ? 'selected' : ''}
                >
                  ${escapeHtml(option.displayName)}
                </option>
              `
            })
            .join('')}
        </optgroup>
      `
    })
    .join('')

  return `
    <label class="build-slot">
      <span>${escapeHtml(slot.label)}</span>

      <select data-build-slot="${escapeHtml(slot.key)}">
        <option value="">Not selected</option>
        ${groups}
      </select>

      <small class="build-owned-status ${ownedClass}">
        ${escapeHtml(ownedText)}
      </small>
    </label>
  `
}


function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function getSelectedBuildItems(build) {
  return Object.entries(build?.slots ?? {})
    .filter(([, value]) => Boolean(value))
    .map(([slotKey, value]) => parseBuildSelection(value, slotKey))
    .filter(Boolean)
}


function getVendorItems(vendorData) {
  return [
    ...(vendorData?.weapons ?? []).map((item) => ({
      ...item,
      kind: 'Weapon',
    })),

    ...(vendorData?.gear ?? []).map((item) => ({
      ...item,
      kind: 'Gear',
    })),

    ...(vendorData?.mods ?? []).map((item) => ({
      ...item,
      kind: 'Mod',
    })),
  ]
}

function findVendorMatches(selectedItem, vendorData) {
  const targetName = normalizeText(selectedItem.name)
  const selectedSlot = BUILD_SLOTS.find(
    (entry) => entry.key === selectedItem.slotKey,
  )
  const targetSlot = normalizeText(selectedSlot?.label)

  return getVendorItems(vendorData).filter((vendorItem) => {
    const vendorName = normalizeText(vendorItem.name)
    const vendorBrand = normalizeText(vendorItem.brand)
    const vendorSlot = normalizeText(
      vendorItem.slot ?? vendorItem.type ?? vendorItem.category,
    )

    const slotMatches = !targetSlot || !vendorSlot || vendorSlot.includes(targetSlot)

    if (
      selectedItem.category === 'brands' ||
      selectedItem.category === 'gearSets'
    ) {
      return vendorBrand === targetName && slotMatches
    }

    return vendorName === targetName && slotMatches
  })
}


function getBuildShoppingRows(build, inventory, vendorData) {
  return getSelectedBuildItems(build).map((item) => {
    const quantity = inventoryQuantity(inventory, item)

    const matches = quantity > 0
      ? []
      : findVendorMatches(item, vendorData)

    return {
      ...item,
      quantity,
      matches,
      isOwned: quantity > 0,
    }
  })
}

function renderBuildShoppingList(build, inventory, vendorData) {
  const rows = getBuildShoppingRows(
    build,
    inventory,
    vendorData,
  )

  if (!rows.length) {
    return `
      <section class="panel build-shopping-panel">
        <div class="empty-state compact-empty-state">
          <div class="empty-icon">◆</div>
          <strong>No selected build items yet</strong>
          <p>
            Select items above to compare the build with your
            inventory and this week's vendors.
          </p>
        </div>
      </section>
    `
  }

  const missing = rows.filter((row) => !row.isOwned)
  const vendorAvailable = missing.filter(
    (row) => row.matches.length > 0,
  )

  return `
    <section class="panel build-shopping-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Build shopping list</p>
          <h2>Missing items and vendor matches</h2>
        </div>

        <span class="vendor-count">
          ${vendorAvailable.length} on sale
        </span>
      </div>

      <div class="build-shopping-summary">
        <span>
          <strong>${rows.filter((row) => row.isOwned).length}</strong>
          owned
        </span>

        <span>
          <strong>${missing.length}</strong>
          missing
        </span>

        <span>
          <strong>${vendorAvailable.length}</strong>
          available this week
        </span>
      </div>

      <div class="build-shopping-list">
        ${rows
          .map((row) => {
            const slot = BUILD_SLOTS.find(
              (entry) => entry.key === row.slotKey,
            )

            if (row.isOwned) {
              return `
                <article class="build-shopping-item owned">
                  <div>
                    <span class="vendor-item-kind">
                      ${escapeHtml(slot?.label ?? row.slotKey)}
                    </span>

                    <strong>${escapeHtml(row.displayName)}</strong>

                    <p>Already in inventory · Quantity ${row.quantity}</p>
                  </div>

                  <span class="build-shopping-status owned">
                    Owned
                  </span>
                </article>
              `
            }

            if (row.matches.length) {
              return `
                <article class="build-shopping-item available">
                  <div>
                    <span class="vendor-item-kind">
                      ${escapeHtml(slot?.label ?? row.slotKey)}
                    </span>

                    <strong>${escapeHtml(row.displayName)}</strong>

                    <p>
                      ${row.matches
                        .map((match) =>
                          escapeHtml(
                            `${match.vendor || 'Unknown Vendor'} · ${match.name}`,
                          ),
                        )
                        .join('<br>')}
                    </p>
                  </div>

                  <span class="build-shopping-status available">
                    Buy this week
                  </span>
                </article>
              `
            }

            return `
              <article class="build-shopping-item missing">
                <div>
                  <span class="vendor-item-kind">
                    ${escapeHtml(slot?.label ?? row.slotKey)}
                  </span>

                  <strong>${escapeHtml(row.displayName)}</strong>

                  <p>Not owned and no exact vendor match found.</p>
                </div>

                <span class="build-shopping-status missing">
                  Farm
                </span>
              </article>
            `
          })
          .join('')}
      </div>
    </section>
  `
}


function getBuildIntelligence(build, inventory, vendorData) {
  const rows = getBuildShoppingRows(build, inventory, vendorData)
  const selected = rows.length
  const owned = rows.filter((row) => row.isOwned).length
  const available = rows.filter((row) => !row.isOwned && row.matches.length > 0).length
  const completion = selected ? Math.round((owned / selected) * 100) : 0
  const configured = Math.round((selected / BUILD_SLOTS.length) * 100)
  return { rows, selected, owned, available, completion, configured, missing: selected - owned }
}

function renderBuildIntelligence(build, inventory, vendorData) {
  const stats = getBuildIntelligence(build, inventory, vendorData)
  const archetype = getBuildArchetype(build)
  const missing = stats.rows.filter((row) => !row.isOwned)

  return `
    <section class="panel build-intelligence-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Build intelligence</p>
          <h2>${stats.completion}% inventory completion</h2>
        </div>
        <span class="build-score-badge">${stats.owned}/${stats.selected || 0} owned</span>
      </div>

      <div class="build-progress-track" aria-label="Build completion">
        <span style="width: ${stats.completion}%"></span>
      </div>

      <div class="build-intelligence-grid">
        <article>
          <span>Configured</span>
          <strong>${stats.configured}%</strong>
          <small>${stats.selected} of ${BUILD_SLOTS.length} slots selected</small>
        </article>
        <article>
          <span>Missing</span>
          <strong>${stats.missing}</strong>
          <small>${stats.available} exact vendor match${stats.available === 1 ? '' : 'es'} this week</small>
        </article>
        <article>
          <span>Archetype</span>
          <strong>${escapeHtml(archetype?.role ?? 'Custom')}</strong>
          <small>${escapeHtml(archetype?.difficulty ?? 'Player-defined loadout')}</small>
        </article>
      </div>

      ${archetype ? `
        <div class="build-guidance-card">
          <div>
            <span class="vendor-item-kind">Recommended rolls</span>
            <p>${escapeHtml(archetype.rolls)}</p>
          </div>
          <div>
            <span class="vendor-item-kind">Talent direction</span>
            <p>${escapeHtml(archetype.talents)}</p>
          </div>
        </div>
      ` : `
        <p class="build-intelligence-note">
          Start from a guided template or keep this as a custom build. Inventory completion updates as you select pieces.
        </p>
      `}

      ${missing.length ? `
        <div class="build-priority-list">
          <strong>Next priorities</strong>
          ${missing.slice(0, 4).map((row) => `
            <span>
              ${row.matches.length ? '◆' : '○'}
              ${escapeHtml(row.displayName)}
              <small>${row.matches.length ? 'Available from a vendor' : 'Farm or scan into inventory'}</small>
            </span>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `
}

function renderTemplateLibrary() {
  return `
    <section class="panel build-template-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Build wizard</p>
          <h2>Start from a proven archetype</h2>
        </div>
      </div>
      <div class="build-template-grid">
        ${BUILD_TEMPLATES.map((template) => `
          <article class="build-template-card">
            <div>
              <span class="vendor-item-kind">${escapeHtml(template.role)} · ${escapeHtml(template.difficulty)}</span>
              <strong>${escapeHtml(template.name)}</strong>
              <p>${escapeHtml(template.description)}</p>
            </div>
            <button class="secondary-button" type="button" data-create-template="${escapeHtml(template.id)}">
              Use template
            </button>
          </article>
        `).join('')}
      </div>
    </section>
  `
}

function renderBuildEditor(build, catalog, inventory, vendorData) {
  return `
    <section class="panel build-editor" data-build-editor>
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Build planner</p>
          <h2>${escapeHtml(build.name)}</h2>
        </div>

        <button
          class="text-button danger-text-button"
          type="button"
          data-delete-build
        >
          Delete build
        </button>
      </div>

      <div class="build-meta-grid">
        <label class="vendor-search">
          <span>Build name</span>
          <input
            id="build-name"
            type="text"
            value="${escapeHtml(build.name)}"
            placeholder="Striker DPS"
          >
        </label>

        <label class="vendor-search">
          <span>Notes</span>
          <input
            id="build-notes"
            type="text"
            value="${escapeHtml(build.notes)}"
            placeholder="Target rolls, farming notes…"
          >
        </label>
      </div>

      <div class="build-slots-grid">
        ${BUILD_SLOTS
          .map((slot) =>
            renderSlot(build, slot, catalog, inventory),
          )
          .join('')}
      </div>
    </section>

    ${renderBuildSimulator(build)}

    ${renderBuildOptimizer(build, inventory, catalog)}

    ${renderBuildIntelligence(build, inventory, vendorData)}

    ${renderBuildShoppingList(
      build,
      inventory,
      vendorData,
    )}
  `
}

function renderBuildList(builds, selectedId) {
  if (!builds.length) {
    return `
      <div class="empty-state compact-empty-state">
        <div class="empty-icon">△</div>
        <strong>No builds yet</strong>
        <p>Create your first build to start planning gear.</p>
      </div>
    `
  }

  return `
    <div class="saved-build-list">
      ${builds
        .map(
          (build) => `
            <button
              type="button"
              class="saved-build-item ${
                build.id === selectedId ? 'active' : ''
              }"
              data-select-build="${escapeHtml(build.id)}"
            >
              <strong>${escapeHtml(build.name)}</strong>
              <span>
                ${Object.values(build.slots ?? {}).filter(Boolean).length}
                selected slots
              </span>
            </button>
          `,
        )
        .join('')}
    </div>
  `
}

export function renderBuildsPage({
  catalog,
  buildsState,
  inventory,
  vendorData,
  selectedBuildId,
}) {
  const selectedBuild =
    buildsState.builds.find(
      (build) => build.id === selectedBuildId,
    ) ?? buildsState.builds[0] ?? null

  const totalSelected = buildsState.builds.reduce(
    (sum, build) =>
      sum + Object.values(build.slots ?? {}).filter(Boolean).length,
    0,
  )

  return `
    <section class="feature-page builds-page">
      <header class="feature-header">
        <div>
          <p class="eyebrow">Loadout planning</p>
          <h1>Builds</h1>
          <p class="subtitle">
            Save loadouts and instantly see which selected items
            are already in your inventory.
          </p>
        </div>

        <div class="feature-header-actions">
          <div class="save-status" id="builds-save-status">
            Cloud builds loaded
          </div>

          <button
            class="primary-button"
            type="button"
            id="create-build"
          >
            New build
          </button>
        </div>
      </header>

      <section class="summary-grid">
        <article class="summary-card accent-card">
          <span class="card-label">Saved builds</span>
          <strong class="metric">${buildsState.builds.length}</strong>
          <span class="metric-note">Cloud-synced loadouts</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Selected slots</span>
          <strong class="metric">${totalSelected}</strong>
          <span class="metric-note">Across every saved build</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Vendor matches</span>
          <strong class="metric">
            ${
              selectedBuild
                ? getBuildShoppingRows(
                    selectedBuild,
                    inventory,
                    vendorData,
                  ).filter(
                    (row) =>
                      !row.isOwned &&
                      row.matches.length > 0,
                  ).length
                : 0
            }
          </strong>
          <span class="metric-note">Selected items on sale</span>
        </article>

        <article class="summary-card">
          <span class="card-label">Inventory link</span>
          <strong class="metric">
            ${Object.values(inventory?.items ?? {})
              .flatMap((group) => Object.values(group ?? {}))
              .filter((value) => Number(value) > 0).length}
          </strong>
          <span class="metric-note">Owned item records</span>
        </article>
      </section>

      ${renderBuildGenerator()}

      ${renderTemplateLibrary()}

      <div class="builds-layout">
        <aside class="panel builds-sidebar">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Saved loadouts</p>
              <h2>Your builds</h2>
            </div>
          </div>

          ${renderBuildList(
            buildsState.builds,
            selectedBuild?.id,
          )}
        </aside>

        <div class="builds-main">
          ${
            selectedBuild
              ? renderBuildEditor(
                  selectedBuild,
                  catalog,
                  inventory,
                  vendorData,
                )
              : `
                <section class="panel empty-state">
                  <div class="empty-icon">△</div>
                  <strong>Create your first build</strong>
                  <p>
                    Save a loadout and compare it with your
                    inventory.
                  </p>
                </section>
              `
          }
        </div>
      </div>
    </section>
  `
}

export function connectBuildsPage({
  catalog,
  buildsState,
  inventory,
  selectedBuildId,
  onSelectedBuildChange,
  onBuildsChange,
  rerender,
}) {
  const selectedBuild =
    buildsState.builds.find(
      (build) => build.id === selectedBuildId,
    ) ?? buildsState.builds[0] ?? null

  document
    .querySelector('#create-build')
    ?.addEventListener('click', () => {
      const build = {
        id: createId(),
        name: `Build ${buildsState.builds.length + 1}`,
        notes: '',
        archetypeId: '',
        slots: {},
        simulator: createDefaultSimulatorState(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      buildsState.builds.push(build)
      onSelectedBuildChange(build.id)
      onBuildsChange()
      rerender()
    })

  document.querySelectorAll('[data-generate-build]').forEach((button) => {
    button.addEventListener('click', () => {
      const templateId = document.querySelector('#build-generator-template')?.value
      const specialization = document.querySelector('#build-generator-specialization')?.value ?? 'Gunner'
      const template = BUILD_TEMPLATES.find((entry) => entry.id === templateId)
      if (!template) return
      const result = generateBuildFromTemplate({
        template,
        catalog,
        inventory,
        ownedOnly: button.dataset.generateBuild === 'owned',
      })
      const build = {
        id: createId(),
        name: `${template.name}${button.dataset.generateBuild === 'owned' ? ' · Owned' : ' · Dream'}`,
        notes: `${template.description}\nSpecialization: ${specialization}\n${result.summary}`,
        archetypeId: template.id,
        slots: result.slots,
        simulator: createDefaultSimulatorState(),
        generator: { mode: button.dataset.generateBuild, specialization, missing: result.missing },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      buildsState.builds.push(build)
      onSelectedBuildChange(build.id)
      onBuildsChange()
      rerender()
    })
  })

  document
    .querySelectorAll('[data-create-template]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const template = BUILD_TEMPLATES.find((entry) => entry.id === button.dataset.createTemplate)
        if (!template) return
        const build = {
          id: createId(),
          name: template.name,
          notes: template.description,
          archetypeId: template.id,
          slots: templateToSlots(template, catalog),
          simulator: createDefaultSimulatorState(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        buildsState.builds.push(build)
        onSelectedBuildChange(build.id)
        onBuildsChange()
        rerender()
      })
    })

  document
    .querySelectorAll('[data-select-build]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        onSelectedBuildChange(button.dataset.selectBuild)
        rerender()
      })
    })

  if (!selectedBuild) {
    return
  }

  document
    .querySelector('#build-name')
    ?.addEventListener('input', (event) => {
      selectedBuild.name =
        event.target.value.trim() || 'Untitled build'
      selectedBuild.updatedAt = new Date().toISOString()
      onBuildsChange()
    })

  document
    .querySelector('#build-notes')
    ?.addEventListener('input', (event) => {
      selectedBuild.notes = event.target.value
      selectedBuild.updatedAt = new Date().toISOString()
      onBuildsChange()
    })

  document
    .querySelectorAll('[data-build-slot]')
    .forEach((select) => {
      select.addEventListener('change', () => {
        selectedBuild.slots[select.dataset.buildSlot] =
          select.value

        selectedBuild.updatedAt = new Date().toISOString()
        onBuildsChange()
        rerender()
      })
    })

  selectedBuild.simulator = normalizeSimulatorState(selectedBuild.simulator)

  document.querySelectorAll('[data-sim-slot]').forEach((control) => {
    control.addEventListener('change', () => {
      const slot = selectedBuild.simulator.slots[control.dataset.simSlot]
      const field = control.dataset.simField
      slot[field] = control.type === 'number' ? finiteNumber(control.value) : control.value
      selectedBuild.updatedAt = new Date().toISOString()
      onBuildsChange()
      rerender()
    })
  })

  document.querySelectorAll('[data-sim-weapon]').forEach((control) => {
    control.addEventListener('change', () => {
      selectedBuild.simulator.weapon[control.dataset.simWeapon] = finiteNumber(control.value)
      selectedBuild.updatedAt = new Date().toISOString()
      onBuildsChange()
      rerender()
    })
  })

  document.querySelectorAll('[data-sim-root]').forEach((control) => {
    control.addEventListener('change', () => {
      selectedBuild.simulator[control.dataset.simRoot] = finiteNumber(control.value)
      selectedBuild.updatedAt = new Date().toISOString()
      onBuildsChange()
      rerender()
    })
  })

  document.querySelector('[data-reset-simulator]')?.addEventListener('click', () => {
    selectedBuild.simulator = createDefaultSimulatorState()
    selectedBuild.updatedAt = new Date().toISOString()
    onBuildsChange()
    rerender()
  })

  document
    .querySelector('[data-delete-build]')
    ?.addEventListener('click', () => {
      const confirmed = window.confirm(
        `Delete "${selectedBuild.name}"?`,
      )

      if (!confirmed) {
        return
      }

      const index = buildsState.builds.findIndex(
        (build) => build.id === selectedBuild.id,
      )

      buildsState.builds.splice(index, 1)

      onSelectedBuildChange(
        buildsState.builds[0]?.id ?? null,
      )

      onBuildsChange()
      rerender()
    })
}

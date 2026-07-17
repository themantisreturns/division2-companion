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

function createId() {
  return crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createEmptyBuildsState() {
  return {
    schemaVersion: 1,
    builds: [],
    updatedAt: null,
  }
}

export function normalizeBuildsState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyBuildsState()
  }

  return {
    schemaVersion: 1,
    builds: Array.isArray(value.builds)
      ? value.builds.map((build) => ({
          id: String(build.id || createId()),
          name: String(build.name || 'Untitled build'),
          notes: String(build.notes || ''),
          slots:
            build.slots && typeof build.slots === 'object'
              ? { ...build.slots }
              : {},
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

  // Support a future slot-specific inventory key while retaining the
  // existing brand/set-level inventory records.
  return (
    Number(categoryItems[selectedItem.displayName]) ||
    Number(categoryItems[selectedItem.name]) ||
    0
  )
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
        slots: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      buildsState.builds.push(build)
      onSelectedBuildChange(build.id)
      onBuildsChange()
      rerender()
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

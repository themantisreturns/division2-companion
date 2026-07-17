const VENDOR_BASE_URL =
  'https://rubenalamina.mx/division/'

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(value) {
  if (!value) return 'Using bundled vendor files'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function assertJsonArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} did not return a JSON array.`)
  }

  return value
}

async function readJsonFile(file, label) {
  if (!file) throw new Error(`${label} file is required.`)

  let parsed

  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error(`${label} is not valid JSON.`)
  }

  return assertJsonArray(parsed, label)
}

async function fetchVendorFile(filename) {
  const url =
    `${VENDOR_BASE_URL}${filename}?t=${Date.now()}`

  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(
      `${filename} request failed with status ${response.status}.`,
    )
  }

  return assertJsonArray(
    await response.json(),
    filename,
  )
}

async function fetchLatestVendorData() {
  const [gear, weapons, mods] = await Promise.all([
    fetchVendorFile('gear.json'),
    fetchVendorFile('weapons.json'),
    fetchVendorFile('mods.json'),
  ])

  return {
    gear,
    weapons,
    mods,
    importedAt: new Date().toISOString(),
    importMethod: 'direct-fetch',
  }
}

function setWorkingState({
  button,
  status,
  buttonText,
  statusText,
}) {
  if (button) {
    button.disabled = true
    button.textContent = buttonText
  }

  if (status) {
    status.textContent = statusText
    status.className = 'save-status saving'
  }
}

function restoreButton(button, text) {
  if (button) {
    button.disabled = false
    button.textContent = text
  }
}

function showError(status, error) {
  if (status) {
    status.textContent = error.message
    status.className = 'save-status error'
  }
}

export function renderVendorImportPanel(vendorData) {
  const sourceLabel =
    vendorData?.source === 'profile-import'
      ? 'Imported vendor data'
      : 'Bundled vendor files'

  return `
    <section class="panel vendor-import-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Weekly data maintenance</p>
          <h2>Vendor Data Import</h2>
        </div>

        <span class="vendor-count">
          ${escapeHtml(sourceLabel)}
        </span>
      </div>

      <p class="metric-note vendor-import-description">
        Fetch the current reset directly from Ruben Alamina, or
        upload gear.json, weapons.json, and mods.json manually.
        Saved data powers Dashboard, Weekly Vendors,
        recommendations, and Build matching.
      </p>

      <div class="vendor-import-summary">
        <span>
          <strong>${vendorData?.gear?.length ?? 0}</strong>
          gear
        </span>

        <span>
          <strong>${vendorData?.weapons?.length ?? 0}</strong>
          weapons
        </span>

        <span>
          <strong>${vendorData?.mods?.length ?? 0}</strong>
          mods
        </span>

        <span>
          <strong>${vendorData?.total ?? 0}</strong>
          total
        </span>
      </div>

      <div class="vendor-import-primary-actions">
        <button
          class="primary-button"
          id="fetch-latest-vendors"
          type="button"
        >
          Fetch latest vendor data
        </button>

        <a
          class="text-button vendor-source-link"
          href="https://rubenalamina.mx/the-division-weekly-vendor-reset/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open vendor source
        </a>
      </div>

      <details class="vendor-manual-import">
        <summary>Manual JSON upload</summary>

        <div class="vendor-import-grid">
          <label class="vendor-file-input">
            <span>gear.json</span>
            <input
              id="vendor-import-gear"
              type="file"
              accept=".json,application/json"
            >
          </label>

          <label class="vendor-file-input">
            <span>weapons.json</span>
            <input
              id="vendor-import-weapons"
              type="file"
              accept=".json,application/json"
            >
          </label>

          <label class="vendor-file-input">
            <span>mods.json</span>
            <input
              id="vendor-import-mods"
              type="file"
              accept=".json,application/json"
            >
          </label>
        </div>

        <button
          class="primary-button vendor-manual-save"
          id="save-vendor-import"
          type="button"
        >
          Import selected JSON files
        </button>
      </details>

      <div class="vendor-import-actions">
        <button
          class="text-button danger-text-button"
          id="clear-vendor-import"
          type="button"
          ${
            vendorData?.source === 'profile-import'
              ? ''
              : 'disabled'
          }
        >
          Use bundled files
        </button>

        <span
          class="save-status"
          id="vendor-import-status"
        >
          ${escapeHtml(formatDate(vendorData?.importedAt))}
        </span>
      </div>
    </section>
  `
}

export function connectVendorImportPanel({
  onImport,
  onClear,
}) {
  document
    .querySelector('#fetch-latest-vendors')
    ?.addEventListener('click', async () => {
      const button = document.querySelector(
        '#fetch-latest-vendors',
      )

      const status = document.querySelector(
        '#vendor-import-status',
      )

      setWorkingState({
        button,
        status,
        buttonText: 'Fetching…',
        statusText: 'Fetching current vendor data…',
      })

      try {
        const vendorData =
          await fetchLatestVendorData()

        await onImport(vendorData)
      } catch (error) {
        console.error(
          'Direct vendor fetch failed:',
          error,
        )

        showError(
          status,
          new Error(
            `Direct fetch was blocked or unavailable: ` +
            `${error.message} Use Manual JSON upload below.`,
          ),
        )

        restoreButton(
          button,
          'Fetch latest vendor data',
        )
      }
    })

  document
    .querySelector('#save-vendor-import')
    ?.addEventListener('click', async () => {
      const button = document.querySelector(
        '#save-vendor-import',
      )

      const status = document.querySelector(
        '#vendor-import-status',
      )

      setWorkingState({
        button,
        status,
        buttonText: 'Reading files…',
        statusText: 'Validating files…',
      })

      try {
        const [gear, weapons, mods] =
          await Promise.all([
            readJsonFile(
              document.querySelector(
                '#vendor-import-gear',
              )?.files?.[0],
              'gear.json',
            ),

            readJsonFile(
              document.querySelector(
                '#vendor-import-weapons',
              )?.files?.[0],
              'weapons.json',
            ),

            readJsonFile(
              document.querySelector(
                '#vendor-import-mods',
              )?.files?.[0],
              'mods.json',
            ),
          ])

        await onImport({
          gear,
          weapons,
          mods,
          importedAt: new Date().toISOString(),
          importMethod: 'manual-upload',
        })
      } catch (error) {
        showError(status, error)

        restoreButton(
          button,
          'Import selected JSON files',
        )
      }
    })

  document
    .querySelector('#clear-vendor-import')
    ?.addEventListener('click', async () => {
      const confirmed = window.confirm(
        'Return to the bundled vendor files?',
      )

      if (confirmed) {
        await onClear()
      }
    })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getAgeHours(value) {
  if (!value) {
    return null
  }

  const time = new Date(value).getTime()

  if (Number.isNaN(time)) {
    return null
  }

  return Math.max(
    0,
    (Date.now() - time) / 3_600_000,
  )
}

function getHealth(meta) {
  if (meta?.status === 'error') {
    return {
      className: 'error',
      label: 'Sync error',
    }
  }

  const ageHours = getAgeHours(
    meta?.lastSuccessfulSyncAt,
  )

  if (ageHours === null) {
    return {
      className: 'unknown',
      label: 'Status unknown',
    }
  }

  if (ageHours > 192) {
    return {
      className: 'stale',
      label: 'Data may be stale',
    }
  }

  return {
    className: 'healthy',
    label: 'Current',
  }
}

export function renderVendorStatusPanel(
  meta,
  { compact = false } = {},
) {
  const health = getHealth(meta)

  if (compact) {
    return `
      <div class="vendor-sync-compact">
        <span
          class="vendor-sync-dot ${health.className}"
        ></span>

        <span>
          Vendor data:
          <strong>${escapeHtml(health.label)}</strong>
          · Last sync
          ${escapeHtml(
            formatDate(meta?.lastSuccessfulSyncAt),
          )}
        </span>
      </div>
    `
  }

  return `
    <section class="panel vendor-sync-panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">Automatic weekly sync</p>
          <h2>Vendor Data Status</h2>
        </div>

        <span
          class="catalog-status ${health.className}"
        >
          ${escapeHtml(health.label)}
        </span>
      </div>

      <div class="vendor-sync-grid">
        <div>
          <span>Last successful sync</span>
          <strong>
            ${escapeHtml(
              formatDate(meta?.lastSuccessfulSyncAt),
            )}
          </strong>
        </div>

        <div>
          <span>Last data change</span>
          <strong>
            ${escapeHtml(
              formatDate(meta?.lastChangedAt),
            )}
          </strong>
        </div>

        <div>
          <span>Source</span>
          <strong>
            ${escapeHtml(meta?.source ?? 'Unknown')}
          </strong>
        </div>

        <div>
          <span>Items loaded</span>
          <strong>
            ${escapeHtml(meta?.counts?.total ?? 0)}
          </strong>
        </div>
      </div>

      ${
        meta?.error
          ? `
            <p class="vendor-sync-error">
              ${escapeHtml(meta.error)}
            </p>
          `
          : ''
      }
    </section>
  `
}

export function showDashboardVendorStatus(meta) {
  const topbar = document.querySelector('.topbar')

  if (!topbar) {
    return
  }

  topbar
    .querySelector('.vendor-sync-compact')
    ?.remove()

  topbar.insertAdjacentHTML(
    'afterend',
    renderVendorStatusPanel(meta, {
      compact: true,
    }),
  )
}

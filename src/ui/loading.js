function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function renderShdLoader(message = 'INITIALIZING SHD NETWORK', { panel = true, compact = false } = {}) {
  return `
    <div class="shd-loader ${panel ? 'panel' : ''} ${compact ? 'compact' : ''}" role="status" aria-live="polite">
      <div class="shd-loader-mark" aria-hidden="true">
        <span class="shd-loader-ring ring-one"></span>
        <span class="shd-loader-ring ring-two"></span>
        <span class="shd-loader-core"></span>
        <span class="shd-loader-scan"></span>
      </div>
      <div class="shd-loader-copy">
        <strong>${escapeHtml(message)}</strong>
        <span>PLEASE STAND BY</span>
      </div>
    </div>
  `
}

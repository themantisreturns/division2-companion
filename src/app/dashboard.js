const navigation = [
  { label: 'Dashboard', icon: '⌂', active: true },
  { label: 'Expertise', icon: '◎' },
  { label: 'Weekly Vendors', icon: '◆' },
  { label: 'Library', icon: '◫' },
  { label: 'Inventory', icon: '▣' },
  { label: 'Builds', icon: '△' },
  { label: 'Settings', icon: '⚙' },
]

const expertiseGroups = [
  { label: 'Weapons', value: 8 },
  { label: 'Brands', value: 58 },
  { label: 'Gear Sets', value: 14 },
  { label: 'Skills', value: 18 },
]

const vendorItems = [
  {
    title: 'Fenris Group AB gear',
    reason: 'Useful for Expertise donations',
    vendor: 'Check weekly vendors',
    type: 'expertise',
  },
  {
    title: 'Providence Defense gear',
    reason: 'Still below maximum proficiency',
    vendor: 'Check weekly vendors',
    type: 'expertise',
  },
  {
    title: 'Assault rifles',
    reason: 'Check exact item proficiency',
    vendor: 'Buy inexpensive duplicates',
    type: 'priority',
  },
]

export function renderDashboard() {
  document.querySelector('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">D2</div>
          <div>
            <strong>Division 2</strong>
            <span>Companion</span>
          </div>
        </div>

        <nav class="navigation">
          ${navigation
            .map(
              (item) => `
                <button
                  class="nav-item ${item.active ? 'active' : ''}"
                  data-page="${item.label}"
                >
                  <span class="nav-icon">${item.icon}</span>
                  <span>${item.label}</span>
                </button>
              `,
            )
            .join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="connection-dot"></div>
          <div>
            <strong>Local profile</strong>
            <span>Cloud sync coming next</span>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div>
            <p class="eyebrow">Agent dashboard</p>
            <h1>Welcome back, Jay</h1>
            <p class="subtitle">
              Track Expertise progress and find the best weekly vendor purchases.
            </p>
          </div>

          <button class="login-button">
            Sign in with GitHub
          </button>
        </header>

        <section class="summary-grid">
          <article class="summary-card accent-card">
            <span class="card-label">Expertise level</span>
            <strong class="metric">0</strong>
            <span class="metric-note">Profile setup in progress</span>
          </article>

          <article class="summary-card">
            <span class="card-label">Weekly reset</span>
            <strong class="metric" id="reset-countdown">
              Calculating…
            </strong>
            <span class="metric-note">Tuesday at reset time</span>
          </article>

          <article class="summary-card">
            <span class="card-label">Shopping priorities</span>
            <strong class="metric">${vendorItems.length}</strong>
            <span class="metric-note">
              Based on current Expertise
            </span>
          </article>

          <article class="summary-card cloud-card">
            <span class="card-label">Cloud status</span>
            <strong class="metric status-metric">Offline</strong>
            <span class="metric-note">Saved locally for now</span>
          </article>
        </section>

        <section class="dashboard-grid">
          <article class="panel expertise-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Current progress</p>
                <h2>Expertise overview</h2>
              </div>

              <button
                class="text-button"
                data-action="open-expertise"
              >
                View all
              </button>
            </div>

            <div class="progress-list">
              ${expertiseGroups
                .map(
                  (group) => `
                    <div class="progress-row">
                      <div class="progress-copy">
                        <span>${group.label}</span>
                        <strong>${group.value}%</strong>
                      </div>

                      <div class="progress-track">
                        <div
                          class="progress-fill"
                          style="width: ${group.value}%"
                        ></div>
                      </div>
                    </div>
                  `,
                )
                .join('')}
            </div>
          </article>

          <article class="panel reset-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Weekly activity</p>
                <h2>Reset status</h2>
              </div>
            </div>

            <div class="reset-visual">
              <div class="reset-ring">
                <span>RESET</span>
                <strong>Tue</strong>
              </div>

              <div>
                <strong id="reset-detail">
                  Calculating next reset
                </strong>

                <p>
                  Vendor recommendations will refresh after the
                  weekly data is loaded.
                </p>
              </div>
            </div>
          </article>

          <article class="panel vendor-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Recommended purchases</p>
                <h2>Vendor priorities</h2>
              </div>

              <button class="primary-button">
                Open vendor tool
              </button>
            </div>

            <div class="vendor-list">
              ${vendorItems
                .map(
                  (item) => `
                    <div class="vendor-item">
                      <div class="vendor-icon ${item.type}">
                        +
                      </div>

                      <div class="vendor-copy">
                        <strong>${item.title}</strong>
                        <span>${item.reason}</span>
                      </div>

                      <span class="vendor-location">
                        ${item.vendor}
                      </span>
                    </div>
                  `,
                )
                .join('')}
            </div>
          </article>

          <article class="panel activity-panel">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Account activity</p>
                <h2>Recent changes</h2>
              </div>
            </div>

            <div class="empty-state">
              <div class="empty-icon">◎</div>
              <strong>No synced activity yet</strong>

              <p>
                Your purchases, donations, and Expertise changes
                will appear here.
              </p>
            </div>
          </article>
        </section>
      </main>
    </div>
  `
}

export function getDashboardElements() {
  return {
    loginButton: document.querySelector('.login-button'),
    cloudStatus: document.querySelector('.status-metric'),
    cloudStatusNote: document.querySelector(
      '.cloud-card .metric-note',
    ),
    sidebarProfileName: document.querySelector(
      '.sidebar-footer strong',
    ),
    sidebarProfileStatus: document.querySelector(
      '.sidebar-footer span',
    ),
    connectionDot: document.querySelector('.connection-dot'),
    welcomeHeading: document.querySelector('.topbar h1'),
    expertiseLevelMetric: document.querySelector(
      '.accent-card .metric',
    ),
    expertiseLevelNote: document.querySelector(
      '.accent-card .metric-note',
    ),
  }
}

export function showSignedOutDashboard() {
  const elements = getDashboardElements()

  if (!elements.loginButton) return

  elements.cloudStatus.textContent = 'Offline'
  elements.cloudStatusNote.textContent =
    'Sign in to enable cloud sync'
  elements.sidebarProfileName.textContent = 'Local profile'
  elements.sidebarProfileStatus.textContent =
    'Cloud sync available'
  elements.connectionDot.style.background = '#f0a020'
  elements.welcomeHeading.textContent = 'Welcome back, Jay'
  elements.expertiseLevelMetric.textContent = '0'
  elements.expertiseLevelNote.textContent =
    'Profile setup in progress'
}

export function showSignedInDashboard({
  displayName,
  expertiseLevel,
}) {
  const elements = getDashboardElements()

  if (!elements.loginButton) return

  elements.cloudStatus.textContent = 'Connected'
  elements.cloudStatusNote.textContent =
    'Your profile is synced securely'
  elements.sidebarProfileName.textContent = displayName
  elements.sidebarProfileStatus.textContent =
    'Cloud profile connected'
  elements.connectionDot.style.background = '#49d17d'
  elements.welcomeHeading.textContent =
    `Welcome back, ${displayName}`
  elements.expertiseLevelMetric.textContent =
    expertiseLevel ?? 0
  elements.expertiseLevelNote.textContent =
    'Loaded from your cloud profile'
}

function getNextWeeklyReset() {
  const now = new Date()
  const reset = new Date(now)
  const daysUntilTuesday =
    (2 - now.getDay() + 7) % 7

  reset.setDate(now.getDate() + daysUntilTuesday)
  reset.setHours(3, 0, 0, 0)

  if (reset <= now) {
    reset.setDate(reset.getDate() + 7)
  }

  return reset
}

function updateCountdown() {
  const countdown = document.querySelector('#reset-countdown')
  const resetDetail = document.querySelector('#reset-detail')

  if (!countdown || !resetDetail) return

  const now = new Date()
  const reset = getNextWeeklyReset()
  const difference = reset.getTime() - now.getTime()

  const days = Math.floor(difference / 86_400_000)
  const hours = Math.floor(
    (difference % 86_400_000) / 3_600_000,
  )
  const minutes = Math.floor(
    (difference % 3_600_000) / 60_000,
  )

  countdown.textContent =
    `${days}d ${hours}h ${minutes}m`

  resetDetail.textContent = reset.toLocaleString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function startResetCountdown() {
  updateCountdown()
  return window.setInterval(updateCountdown, 60_000)
}

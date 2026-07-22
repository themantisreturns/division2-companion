let deferredInstallPrompt = null
let registrationRef = null

function ensureStatusHost() {
  let host = document.querySelector('#app-status-host')
  if (host) return host

  host = document.createElement('div')
  host.id = 'app-status-host'
  host.className = 'app-status-host'
  host.setAttribute('aria-live', 'polite')
  document.body.append(host)
  return host
}

function showStatus({ id, title, message, actionLabel, onAction, tone = 'info', persistent = false }) {
  const host = ensureStatusHost()
  host.querySelector(`[data-status-id="${id}"]`)?.remove()

  const notice = document.createElement('section')
  notice.className = `app-status-notice ${tone}`
  notice.dataset.statusId = id
  notice.innerHTML = `
    <div>
      <strong>${title}</strong>
      <span>${message}</span>
    </div>
    <div class="app-status-actions">
      ${actionLabel ? `<button type="button" class="status-action">${actionLabel}</button>` : ''}
      <button type="button" class="status-dismiss" aria-label="Dismiss">×</button>
    </div>
  `

  notice.querySelector('.status-action')?.addEventListener('click', onAction)
  notice.querySelector('.status-dismiss')?.addEventListener('click', () => notice.remove())
  host.append(notice)

  if (!persistent) {
    window.setTimeout(() => notice.remove(), 6500)
  }
}

function showNetworkState() {
  if (navigator.onLine) {
    showStatus({
      id: 'network',
      title: 'Back online',
      message: 'Live vendor and cloud data are available again.',
      tone: 'success',
    })
    return
  }

  showStatus({
    id: 'network',
    title: 'Offline mode',
    message: 'Cached pages remain available. Cloud saves and fresh vendor data will resume when you reconnect.',
    tone: 'warning',
    persistent: true,
  })
}

function promptForUpdate(worker) {
  showStatus({
    id: 'update',
    title: 'Update ready',
    message: 'A newer version of Division 2 Companion is available.',
    actionLabel: 'Reload',
    tone: 'success',
    persistent: true,
    onAction: () => worker.postMessage({ type: 'SKIP_WAITING' }),
  })
}

function watchRegistration(registration) {
  registrationRef = registration

  if (registration.waiting) promptForUpdate(registration.waiting)

  registration.addEventListener('updatefound', () => {
    const worker = registration.installing
    if (!worker) return

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        promptForUpdate(worker)
      }
    })
  })
}

export async function initializePwa() {
  window.addEventListener('online', showNetworkState)
  window.addEventListener('offline', showNetworkState)

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredInstallPrompt = event
    document.documentElement.dataset.installable = 'true'

    showStatus({
      id: 'install',
      title: 'Install the app',
      message: 'Add Division 2 Companion to your device for faster access and offline support.',
      actionLabel: 'Install',
      persistent: true,
      onAction: installPwa,
    })
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    document.documentElement.dataset.installable = 'false'
    document.querySelector('[data-status-id="install"]')?.remove()
    showStatus({
      id: 'installed',
      title: 'App installed',
      message: 'Division 2 Companion is ready from your home screen or app launcher.',
      tone: 'success',
    })
  })

  if (!navigator.onLine) showNetworkState()
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL },
    )
    watchRegistration(registration)

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  } catch (error) {
    console.error('Could not register offline support:', error)
  }
}

export async function installPwa() {
  if (!deferredInstallPrompt) return false

  await deferredInstallPrompt.prompt()
  const result = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  document.documentElement.dataset.installable = 'false'
  return result.outcome === 'accepted'
}

export async function checkForAppUpdate() {
  if (!registrationRef) return false
  await registrationRef.update()
  return Boolean(registrationRef.waiting)
}

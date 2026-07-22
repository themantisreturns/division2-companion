import './style.css'

import { updateDashboardIntelligence, updateDashboardMetrics } from './app/dashboardMetrics.js'
import {
  ensureGameCatalog,
  ensureVendorData,
} from './app/dataLoaders.js'
import {
  connectPurchaseButtons,
  connectVendorFilters,
  renderVendorPage,
} from './features/vendors/vendors.js'
import { createVendorRecommendations } from './features/vendors/recommendationEngine.js'
import {
  getPurchasedIdsForCurrentReset,
  togglePurchasedItem,
} from './features/vendors/purchases.js'
import {
  connectExpertiseFilters,
  connectExpertiseLiveCounts,
  mergeExpertiseProgress,
  readExpertiseForm,
  renderExpertisePage,
  serializeExpertiseProgress,
} from './features/expertise/expertise.js'
import { scanExpertiseOverview } from './features/expertise/expertiseScanner.js'
import { fallbackExpertiseCatalog } from './features/expertise/expertiseData.js'
import { getExpertiseCatalog } from './services/catalog.js'
import {
  getDashboardElements,
  renderDashboard,
  showSignedInDashboard,
  showSignedOutDashboard,
  startResetCountdown,
} from './app/dashboard.js'
import { connectNavigation } from './app/navigation.js'
import { appState } from './app/state.js'
import {
  initializeAuthentication,
  signInWithGitHub,
  signOut,
} from './services/auth.js'
import { loadUserProfile, saveUserProfile } from './services/profile.js'
import { openSettingsPage } from './features/catalog/catalogHealthPageController.js'
import {
  connectCatalogBrowser,
  renderCatalogBrowser,
} from './features/catalog/catalogBrowser.js'
import {
  connectInventoryPage,
  normalizeInventory,
  renderInventoryPage,
} from './features/inventory/inventory.js'
import {
  connectBuildsPage,
  normalizeBuildsState,
  renderBuildsPage,
} from './features/builds/builds.js'
import {
  connectGearAdvisorPage,
  renderGearAdvisorPage,
} from './features/gearAdvisor/gearAdvisor.js'
import {
  connectCollectionPage,
  renderCollectionPage,
} from './features/collection/collection.js'

let currentVendorData = null
let currentRecommendations = []

function getDisplayName(user) {
  const metadata = user.user_metadata ?? {}
  return metadata.full_name || metadata.name || metadata.user_name || user.email || 'Agent'
}

async function refreshDashboardMetrics() {
  if (!appState.activeProfile) return

  try {
    const vendorData = await ensureVendorData()
    const expertiseProgress = mergeExpertiseProgress(appState.activeProfile.expertise_progress)
    currentRecommendations = createVendorRecommendations(vendorData, expertiseProgress)
    const purchasedIds = getPurchasedIdsForCurrentReset(appState.activeProfile.purchased_items ?? [])

    updateDashboardMetrics({ expertiseProgress, recommendations: currentRecommendations, purchasedIds })

    updateDashboardIntelligence({
      inventory: normalizeInventory(appState.activeProfile.app_settings?.inventory),
      buildsState: normalizeBuildsState(appState.activeProfile.saved_builds),
    })
  } catch (error) {
    console.error('Could not update dashboard metrics:', error)
  }
}

async function handleSignIn() {
  const { loginButton } = getDashboardElements()
  if (loginButton) {
    loginButton.disabled = true
    loginButton.textContent = 'Opening GitHub…'
  }

  try {
    await signInWithGitHub()
  } catch (error) {
    if (loginButton) {
      loginButton.disabled = false
      loginButton.textContent = 'Sign in with GitHub'
    }
    window.alert(`GitHub sign-in failed: ${error.message}`)
  }
}

async function handleSignOut() {
  const { loginButton } = getDashboardElements()
  if (loginButton) {
    loginButton.disabled = true
    loginButton.textContent = 'Signing out…'
  }

  try {
    await signOut()
  } catch (error) {
    window.alert(`Sign-out failed: ${error.message}`)
    if (loginButton) loginButton.disabled = false
  }
}

function configureSignedOutDashboard() {
  appState.activeUser = null
  appState.activeProfile = null
  showSignedOutDashboard()

  const { loginButton } = getDashboardElements()
  if (loginButton) {
    loginButton.disabled = false
    loginButton.textContent = 'Sign in with GitHub'
    loginButton.onclick = handleSignIn
  }
}

async function configureSignedInDashboard(user) {
  appState.activeUser = user

  try {
    appState.activeProfile = await loadUserProfile(user.id)
  } catch (error) {
    console.error(error)
    appState.activeProfile = null
  }

  const displayName = getDisplayName(user)
  const progress = mergeExpertiseProgress(appState.activeProfile?.expertise_progress ?? {})

  showSignedInDashboard({ displayName, expertiseLevel: progress.level })

  const { loginButton } = getDashboardElements()
  if (loginButton) {
    loginButton.disabled = false
    loginButton.textContent = `Sign out · ${displayName}`
    loginButton.onclick = handleSignOut
  }

  await refreshDashboardMetrics()
}

function openDashboard() {
  window.location.reload()
}

async function openExpertisePage() {
  if (!appState.activeUser || !appState.activeProfile) {
    window.alert('Sign in with GitHub before editing your Expertise profile.')
    return
  }

  const catalogDocument = await ensureGameCatalog()
  const catalog = catalogDocument
    ? getExpertiseCatalog(catalogDocument)
    : fallbackExpertiseCatalog

  appState.expertiseProgress = mergeExpertiseProgress(
    appState.activeProfile.expertise_progress,
  )

  document.querySelector('.main-content').innerHTML = renderExpertisePage(
    appState.expertiseProgress,
    catalog,
  )

  connectExpertiseFilters()
  connectExpertiseLiveCounts()
  connectExpertiseScanner()

  document
    .querySelectorAll('.expertise-item-checkbox, .expertise-number, #expertise-level-input, #expertise-progress-current, #expertise-progress-total, #expertise-proficient-current, #expertise-proficient-total, #expertise-shd-level')
    .forEach((input) => input.addEventListener('input', scheduleExpertiseSave))
}

function connectExpertiseScanner() {
  const button = document.querySelector('#expertise-scan-button')
  const input = document.querySelector('#expertise-screenshot-input')
  const status = document.querySelector('#expertise-scan-status')
  if (!button || !input || !status) return

  button.addEventListener('click', () => input.click())
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return

    button.disabled = true
    status.hidden = false
    status.className = 'expertise-scan-status scanning'
    status.textContent = 'Preparing screenshot reader…'

    try {
      const result = await scanExpertiseOverview(file, (percent, message) => {
        status.textContent = `${message} ${percent}%`
      })

      document.querySelector('#expertise-level-input').value = result.level
      document.querySelector('#expertise-progress-current').value = result.levelProgress.current
      document.querySelector('#expertise-progress-total').value = result.levelProgress.total
      document.querySelector('#expertise-proficient-current').value = result.proficient.current
      document.querySelector('#expertise-proficient-total').value = result.proficient.total

      appState.expertiseProgress.legacySummary.weapons = Object.fromEntries(
        Object.entries(result.categories.weapons).filter(([, value]) => value),
      )
      appState.expertiseProgress.legacySummary.namedGear = Object.fromEntries(
        Object.entries(result.categories.namedGear).filter(([, value]) => value),
      )

      status.className = 'expertise-scan-status success'
      status.textContent = `Imported ${result.fileName}: level ${result.level}, ${result.levelProgress.current}/${result.levelProgress.total}, ${result.proficient.current}/${result.proficient.total} proficient.`
      scheduleExpertiseSave()
    } catch (error) {
      console.error(error)
      status.className = 'expertise-scan-status error'
      status.textContent = error.message || 'The screenshot could not be read.'
    } finally {
      button.disabled = false
      input.value = ''
    }
  })
}

function scheduleExpertiseSave() {
  const status = document.querySelector('#expertise-save-status')
  if (status) {
    status.textContent = 'Saving changes…'
    status.className = 'save-status saving'
  }

  window.clearTimeout(appState.saveTimer)
  appState.saveTimer = window.setTimeout(saveExpertiseProgress, 700)
}

async function saveExpertiseProgress() {
  const status = document.querySelector('#expertise-save-status')

  try {
    appState.expertiseProgress = readExpertiseForm(appState.expertiseProgress)
    const savedProfile = await saveUserProfile(appState.activeUser.id, {
      expertise_progress: serializeExpertiseProgress(appState.expertiseProgress),
    })

    appState.activeProfile = savedProfile
    if (status) {
      status.textContent = 'Saved to cloud'
      status.className = 'save-status saved'
    }
  } catch (error) {
    console.error(error)
    if (status) {
      status.textContent = 'Could not save'
      status.className = 'save-status error'
    }
  }
}

function renderCurrentVendorPage() {
  const purchasedIds = getPurchasedIdsForCurrentReset(
    appState.activeProfile?.purchased_items ?? [],
  )

  document.querySelector('.main-content').innerHTML = renderVendorPage({
    vendorData: currentVendorData,
    recommendations: currentRecommendations,
    purchasedIds,
  })

  connectVendorFilters()
  connectPurchaseButtons(handleTogglePurchase)
}

async function handleTogglePurchase(recommendationId) {
  if (!appState.activeUser || !appState.activeProfile) {
    window.alert('Sign in before saving purchased items.')
    return
  }

  const recommendation = currentRecommendations.find((item) => item.id === recommendationId)
  if (!recommendation) {
    window.alert('The selected recommendation could not be found.')
    return
  }

  try {
    const updatedPurchases = togglePurchasedItem(
      appState.activeProfile.purchased_items ?? [],
      recommendation,
    )

    appState.activeProfile = await saveUserProfile(appState.activeUser.id, {
      purchased_items: updatedPurchases,
    })

    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)
    window.alert(`Could not save purchase: ${error.message}`)
    renderCurrentVendorPage()
  }
}

async function openVendorPage() {
  const mainContent = document.querySelector('.main-content')
  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state"><strong>Loading weekly vendor data…</strong></div>
    </section>
  `

  try {
    const vendorData = await ensureVendorData()
    currentVendorData = vendorData
    currentRecommendations = []

    if (appState.activeProfile) {
      const progress = mergeExpertiseProgress(appState.activeProfile.expertise_progress)
      currentRecommendations = createVendorRecommendations(vendorData, progress)
    }

    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)
    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>Could not load vendor data</strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}


async function openLibraryPage() {
  const mainContent = document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state">
        <strong>Loading item library…</strong>
      </div>
    </section>
  `

  try {
    const catalog = await ensureGameCatalog()

    if (!catalog) {
      throw new Error(
        'The generated catalog could not be loaded.',
      )
    }

    const expertiseProgress = appState.activeProfile
      ? mergeExpertiseProgress(
          appState.activeProfile.expertise_progress,
        )
      : null

    mainContent.innerHTML = renderCatalogBrowser({
      catalog,
      expertiseProgress,
    })

    if (!expertiseProgress) {
      return
    }

    appState.expertiseProgress = expertiseProgress

    connectCatalogBrowser({
      expertiseProgress,
      onProgressChange: scheduleLibrarySave,
    })
  } catch (error) {
    console.error(error)

    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>Could not load item library</strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}

function scheduleLibrarySave() {
  const status = document.querySelector('#library-save-status')

  if (status) {
    status.textContent = 'Saving changes…'
    status.className = 'save-status saving'
  }

  window.clearTimeout(appState.saveTimer)

  appState.saveTimer = window.setTimeout(
    saveLibraryProgress,
    700,
  )
}

async function saveLibraryProgress() {
  const status = document.querySelector('#library-save-status')

  if (!appState.activeUser || !appState.activeProfile) {
    return
  }

  try {
    const savedProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        expertise_progress: serializeExpertiseProgress(
          appState.expertiseProgress,
        ),
      },
    )

    appState.activeProfile = savedProfile

    if (status) {
      status.textContent = 'Saved to cloud'
      status.className = 'save-status saved'
    }
  } catch (error) {
    console.error(error)

    if (status) {
      status.textContent = 'Could not save'
      status.className = 'save-status error'
    }
  }
}


async function openCollectionPage() {
  const mainContent = document.querySelector('.main-content')
  mainContent.innerHTML = `
    <section class="feature-page"><div class="panel empty-state"><strong>Loading collection…</strong></div></section>
  `

  try {
    const catalog = await ensureGameCatalog()
    if (!catalog) throw new Error('The generated catalog could not be loaded.')

    const inventory = normalizeInventory(
      appState.activeProfile?.app_settings?.inventory,
    )

    mainContent.innerHTML = renderCollectionPage({ catalog, inventory })
    connectCollectionPage({ catalog, inventory })
  } catch (error) {
    console.error(error)
    mainContent.innerHTML = `
      <section class="feature-page"><div class="panel empty-state"><strong>Could not load collection</strong><p>${error.message}</p></div></section>
    `
  }
}

async function openInventoryPage() {
  if (!appState.activeUser || !appState.activeProfile) {
    window.alert(
      'Sign in with GitHub before editing inventory.',
    )
    return
  }

  const mainContent = document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state">
        <strong>Loading inventory…</strong>
      </div>
    </section>
  `

  try {
    const catalog = await ensureGameCatalog()

    if (!catalog) {
      throw new Error(
        'The generated catalog could not be loaded.',
      )
    }

    const inventory = normalizeInventory(
      appState.activeProfile.app_settings?.inventory,
    )

    appState.inventory = inventory

    mainContent.innerHTML = renderInventoryPage({
      catalog,
      inventory,
    })

    connectInventoryPage({
      catalog,
      inventory,
      onInventoryChange:
        scheduleInventorySave,
    })
  } catch (error) {
    console.error(error)

    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>Could not load inventory</strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}

function scheduleInventorySave() {
  const status = document.querySelector(
    '#inventory-save-status',
  )

  if (status) {
    status.textContent = 'Saving changes…'
    status.className = 'save-status saving'
  }

  window.clearTimeout(appState.saveTimer)

  appState.saveTimer = window.setTimeout(
    saveInventory,
    700,
  )
}

async function saveInventory() {
  const status = document.querySelector(
    '#inventory-save-status',
  )

  if (
    !appState.activeUser ||
    !appState.activeProfile ||
    !appState.inventory
  ) {
    return
  }

  try {
    appState.inventory.updatedAt =
      new Date().toISOString()

    const nextSettings = {
      ...(appState.activeProfile.app_settings ?? {}),
      inventory: appState.inventory,
    }

    const savedProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        app_settings: nextSettings,
      },
    )

    appState.activeProfile = savedProfile

    if (status) {
      status.textContent = 'Saved to cloud'
      status.className = 'save-status saved'
    }
  } catch (error) {
    console.error(error)

    if (status) {
      status.textContent = 'Could not save'
      status.className = 'save-status error'
    }
  }
}


let selectedBuildId = null

function openGearAdvisorPage() {
  const mainContent = document.querySelector('.main-content')

  mainContent.innerHTML = renderGearAdvisorPage()

  connectGearAdvisorPage()
}

async function openBuildsPage() {
  if (!appState.activeUser || !appState.activeProfile) {
    window.alert(
      'Sign in with GitHub before editing builds.',
    )
    return
  }

  const mainContent = document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state">
        <strong>Loading builds…</strong>
      </div>
    </section>
  `

  try {
    const catalog = await ensureGameCatalog()

    if (!catalog) {
      throw new Error(
        'The generated catalog could not be loaded.',
      )
    }

    const vendorData = await ensureVendorData()

    const inventory = normalizeInventory(
      appState.activeProfile.app_settings?.inventory,
    )

    const buildsState = normalizeBuildsState(
      appState.activeProfile.saved_builds,
    )

    appState.inventory = inventory
    appState.buildsState = buildsState

    if (
      !selectedBuildId ||
      !buildsState.builds.some(
        (build) => build.id === selectedBuildId,
      )
    ) {
      selectedBuildId = buildsState.builds[0]?.id ?? null
    }

    const renderPage = () => {
      mainContent.innerHTML = renderBuildsPage({
        catalog,
        buildsState,
        inventory,
        vendorData,
        selectedBuildId,
      })

      connectBuildsPage({
        catalog,
        buildsState,
        inventory,
        selectedBuildId,
        onSelectedBuildChange: (nextId) => {
          selectedBuildId = nextId
        },
        onBuildsChange: scheduleBuildsSave,
        rerender: renderPage,
      })
    }

    renderPage()
  } catch (error) {
    console.error(error)

    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>Could not load builds</strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}

function scheduleBuildsSave() {
  const status = document.querySelector(
    '#builds-save-status',
  )

  if (status) {
    status.textContent = 'Saving changes…'
    status.className = 'save-status saving'
  }

  window.clearTimeout(appState.saveTimer)

  appState.saveTimer = window.setTimeout(
    saveBuilds,
    700,
  )
}

async function saveBuilds() {
  const status = document.querySelector(
    '#builds-save-status',
  )

  if (
    !appState.activeUser ||
    !appState.activeProfile ||
    !appState.buildsState
  ) {
    return
  }

  try {
    appState.buildsState.updatedAt =
      new Date().toISOString()

    const savedProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        saved_builds: appState.buildsState,
      },
    )

    appState.activeProfile = savedProfile

    if (status) {
      status.textContent = 'Saved to cloud'
      status.className = 'save-status saved'
    }
  } catch (error) {
    console.error(error)

    if (status) {
      status.textContent = 'Could not save'
      status.className = 'save-status error'
    }
  }
}

async function initializeApp() {
  renderDashboard()
  startResetCountdown()

  connectNavigation({
    openDashboard,
    openExpertise: openExpertisePage,
    openVendors: openVendorPage,
    openLibrary: openLibraryPage,
    openCollection: openCollectionPage,
    openInventory: openInventoryPage,
    openBuilds: openBuildsPage,
    openGearAdvisor: openGearAdvisorPage,
    openSettings: openSettingsPage,
  })

  await initializeAuthentication({
    onSignedIn: configureSignedInDashboard,
    onSignedOut: configureSignedOutDashboard,
  })
}

initializeApp()

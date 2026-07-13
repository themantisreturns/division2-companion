import './style.css'

import { loadVendorData } from './features/vendors/vendorData.js'

import {
  connectPurchaseButtons,
  connectVendorFilters,
  renderVendorPage,
} from './features/vendors/vendors.js'

import {
  createVendorRecommendations,
} from './features/vendors/recommendationEngine.js'

import {
  getPurchasedIdsForCurrentReset,
  togglePurchasedItem,
} from './features/vendors/purchases.js'

import {
  mergeExpertiseProgress,
  readExpertiseForm,
  renderExpertisePage,
} from './features/expertise/expertise.js'

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

import {
  loadUserProfile,
  saveUserProfile,
} from './services/profile.js'

let currentVendorData = null
let currentRecommendations = []

function getDisplayName(user) {
  const metadata = user.user_metadata ?? {}

  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    user.email ||
    'Agent'
  )
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

    window.alert(
      `GitHub sign-in failed: ${error.message}`,
    )
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

    if (loginButton) {
      loginButton.disabled = false
    }
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

  let profile = null

  try {
    profile = await loadUserProfile(user.id)
  } catch (error) {
    console.error(error)
  }

  appState.activeProfile = profile

  const displayName = getDisplayName(user)
  const expertiseLevel =
    profile?.expertise_progress?.level ?? 0

  showSignedInDashboard({
    displayName,
    expertiseLevel,
  })

  const { loginButton } = getDashboardElements()

  if (loginButton) {
    loginButton.disabled = false
    loginButton.textContent =
      `Sign out · ${displayName}`

    loginButton.onclick = handleSignOut
  }
}

function openDashboard() {
  window.location.reload()
}

async function openExpertisePage() {
  if (
    !appState.activeUser ||
    !appState.activeProfile
  ) {
    window.alert(
      'Sign in with GitHub before editing your Expertise profile.',
    )
    return
  }

  appState.expertiseProgress =
    mergeExpertiseProgress(
      appState.activeProfile.expertise_progress,
    )

  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = renderExpertisePage(
    appState.expertiseProgress,
  )

  document
    .querySelectorAll(
      '.expertise-number, #expertise-level-input',
    )
    .forEach((input) => {
      input.addEventListener(
        'input',
        scheduleExpertiseSave,
      )
    })
}

function scheduleExpertiseSave() {
  const status = document.querySelector(
    '#expertise-save-status',
  )

  if (status) {
    status.textContent = 'Saving changes…'
    status.className = 'save-status saving'
  }

  window.clearTimeout(appState.saveTimer)

  appState.saveTimer = window.setTimeout(
    saveExpertiseProgress,
    700,
  )
}

async function saveExpertiseProgress() {
  const status = document.querySelector(
    '#expertise-save-status',
  )

  try {
    appState.expertiseProgress = readExpertiseForm(
      appState.expertiseProgress,
    )

    const savedProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        expertise_progress:
          appState.expertiseProgress,
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

function renderCurrentVendorPage() {
  const mainContent =
    document.querySelector('.main-content')

  const purchasedIds =
    getPurchasedIdsForCurrentReset(
      appState.activeProfile?.purchased_items ?? [],
    )

  mainContent.innerHTML = renderVendorPage({
    vendorData: currentVendorData,
    recommendations: currentRecommendations,
    purchasedIds,
  })

  connectVendorFilters()

  connectPurchaseButtons(
    handleTogglePurchase,
  )
}

async function handleTogglePurchase(recommendationId) {
  if (
    !appState.activeUser ||
    !appState.activeProfile
  ) {
    window.alert(
      'Sign in before saving purchased items.',
    )
    return
  }

  const recommendation =
    currentRecommendations.find(
      (item) => item.id === recommendationId,
    )

  if (!recommendation) {
    window.alert(
      'The selected recommendation could not be found.',
    )
    return
  }

  try {
    const updatedPurchases = togglePurchasedItem(
      appState.activeProfile.purchased_items ?? [],
      recommendation,
    )

    const savedProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        purchased_items: updatedPurchases,
      },
    )

    appState.activeProfile = savedProfile
    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)

    window.alert(
      `Could not save purchase: ${error.message}`,
    )

    renderCurrentVendorPage()
  }
}

async function openVendorPage() {
  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state">
        <strong>Loading weekly vendor data…</strong>
      </div>
    </section>
  `

  try {
    currentVendorData = await loadVendorData()
    currentRecommendations = []

    if (appState.activeProfile) {
      const expertiseProgress =
        mergeExpertiseProgress(
          appState.activeProfile.expertise_progress,
        )

      currentRecommendations =
        createVendorRecommendations(
          currentVendorData,
          expertiseProgress,
        )
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

async function initializeApp() {
  renderDashboard()
  startResetCountdown()

  connectNavigation({
    openDashboard,
    openExpertise: openExpertisePage,
    openVendors: openVendorPage,
  })

  await initializeAuthentication({
    onSignedIn: configureSignedInDashboard,
    onSignedOut: configureSignedOutDashboard,
  })
}

initializeApp()
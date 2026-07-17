import { updateDashboardMetrics } from './dashboardMetrics.js'
import {
  getDashboardElements,
  showSignedInDashboard,
  showSignedOutDashboard,
} from './dashboard.js'
import { showDashboardVendorStatus } from './vendorStatus.js'
import { appState } from './state.js'
import {
  initializeAuthentication,
  signInWithGitHub,
  signOut,
} from '../services/auth.js'
import { loadUserProfile } from '../services/profile.js'
import { loadVendorMeta } from '../services/vendorMeta.js'
import { mergeExpertiseProgress } from '../features/expertise/expertise.js'
import { createVendorRecommendations } from '../features/vendors/recommendationEngine.js'
import { getPurchasedIdsForCurrentReset } from '../features/vendors/purchases.js'
import { ensureVendorData } from './dataLoaders.js'

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

async function refreshDashboardMetrics() {
  try {
    const meta = await loadVendorMeta()
    showDashboardVendorStatus(meta)

    if (!appState.activeProfile) {
      return
    }

    const vendorData = await ensureVendorData()
    const expertiseProgress =
      mergeExpertiseProgress(
        appState.activeProfile.expertise_progress,
      )

    const recommendations =
      createVendorRecommendations(
        vendorData,
        expertiseProgress,
      )

    const purchasedIds =
      getPurchasedIdsForCurrentReset(
        appState.activeProfile.purchased_items ??
          [],
      )

    updateDashboardMetrics({
      expertiseProgress,
      recommendations,
      purchasedIds,
    })
  } catch (error) {
    console.error(
      'Could not update dashboard metrics:',
      error,
    )
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
      loginButton.textContent =
        'Sign in with GitHub'
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
    window.alert(
      `Sign-out failed: ${error.message}`,
    )

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
    loginButton.textContent =
      'Sign in with GitHub'
    loginButton.onclick = handleSignIn
  }

  refreshDashboardMetrics()
}

async function configureSignedInDashboard(user) {
  appState.activeUser = user

  try {
    appState.activeProfile =
      await loadUserProfile(user.id)
  } catch (error) {
    console.error(error)
    appState.activeProfile = null
  }

  const displayName = getDisplayName(user)
  const progress = mergeExpertiseProgress(
    appState.activeProfile
      ?.expertise_progress ?? {},
  )

  showSignedInDashboard({
    displayName,
    expertiseLevel: progress.level,
  })

  const { loginButton } = getDashboardElements()

  if (loginButton) {
    loginButton.disabled = false
    loginButton.textContent =
      `Sign out · ${displayName}`
    loginButton.onclick = handleSignOut
  }

  await refreshDashboardMetrics()
}

export async function initializeSession() {
  await initializeAuthentication({
    onSignedIn: configureSignedInDashboard,
    onSignedOut: configureSignedOutDashboard,
  })
}

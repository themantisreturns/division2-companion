import { renderShdLoader } from '../../ui/loading.js'
import { appState } from '../../app/state.js'
import { ensureVendorData } from '../../app/dataLoaders.js'
import { renderVendorStatusPanel } from '../../app/vendorStatus.js'
import { saveUserProfile } from '../../services/profile.js'
import { loadVendorMeta, clearVendorMetaCache } from '../../services/vendorMeta.js'
import {
  clearVendorHistoryCache,
  loadVendorHistoryIndex,
  loadVendorHistorySnapshot,
} from '../../services/vendorHistory.js'
import { mergeExpertiseProgress } from '../expertise/expertise.js'
import { normalizeInventory } from '../inventory/inventory.js'
import { normalizeBuildsState } from '../builds/builds.js'
import {
  connectPurchaseButtons,
  connectVendorFilters,
  renderVendorPage,
  renderVendorHistoryPanel,
  renderVendorHistorySnapshot,
} from './vendors.js'
import { createVendorRecommendations } from './recommendationEngine.js'
import {
  getPurchasedIdsForCurrentReset,
  togglePurchasedItem,
} from './purchases.js'

let currentRecommendations = []
let currentVendorData = null
let currentVendorMeta = null
let currentVendorHistory = { entries: [] }

function renderCurrentVendorPage() {
  const purchasedIds =
    getPurchasedIdsForCurrentReset(
      appState.activeProfile?.purchased_items ??
        [],
    )

  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = renderVendorPage({
    vendorData: currentVendorData,
    recommendations: currentRecommendations,
    purchasedIds,
  })

  const header = mainContent.querySelector(
    '.vendor-feature-page .feature-header',
  )

  header?.insertAdjacentHTML(
    'afterend',
    `${renderVendorStatusPanel(currentVendorMeta)}${renderVendorHistoryPanel(currentVendorHistory, currentVendorMeta)}`,
  )

  connectVendorFilters()
  connectVendorHistoryPanel()
  connectPurchaseButtons(handleTogglePurchase, handleToggleWishlist)
}


function connectVendorHistoryPanel() {
  const button = document.querySelector('#view-vendor-history')
  const select = document.querySelector('#vendor-history-select')
  const results = document.querySelector('#vendor-history-results')

  if (!button || !select || !results) return

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Loading…'
    results.innerHTML = '<p class="metric-note">Loading saved reset…</p>'

    try {
      const snapshot = await loadVendorHistorySnapshot(select.value)
      results.innerHTML = renderVendorHistorySnapshot(snapshot)
    } catch (error) {
      console.error(error)
      results.innerHTML = `<p class="save-status error">Could not load snapshot: ${error.message}</p>`
    } finally {
      button.disabled = false
      button.textContent = 'View snapshot'
    }
  })
}

async function handleTogglePurchase(
  recommendationId,
) {
  if (!appState.activeUser ||
      !appState.activeProfile) {
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
    const updatedPurchases =
      togglePurchasedItem(
        appState.activeProfile.purchased_items ??
          [],
        recommendation,
      )

    appState.activeProfile =
      await saveUserProfile(
        appState.activeUser.id,
        {
          purchased_items:
            updatedPurchases,
        },
      )

    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)
    window.alert(
      `Could not save purchase: ${error.message}`,
    )
    renderCurrentVendorPage()
  }
}


async function handleToggleWishlist(wishlistKey) {
  if (!appState.activeUser || !appState.activeProfile) {
    window.alert('Sign in before saving wishlist items.')
    return
  }

  try {
    const inventory = normalizeInventory(
      appState.activeProfile.app_settings?.inventory,
    )

    const index = inventory.wishlist.indexOf(wishlistKey)
    if (index >= 0) inventory.wishlist.splice(index, 1)
    else inventory.wishlist.push(wishlistKey)
    inventory.updatedAt = new Date().toISOString()

    appState.activeProfile = await saveUserProfile(
      appState.activeUser.id,
      {
        app_settings: {
          ...(appState.activeProfile.app_settings ?? {}),
          inventory,
        },
      },
    )

    const progress = mergeExpertiseProgress(
      appState.activeProfile.expertise_progress,
    )
    currentRecommendations = createVendorRecommendations(
      currentVendorData,
      progress,
      {
        inventory,
        buildsState: normalizeBuildsState(
          appState.activeProfile.saved_builds,
        ),
      },
    )

    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)
    window.alert(`Could not save wishlist: ${error.message}`)
    renderCurrentVendorPage()
  }
}

export async function openVendorPage() {
  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      ${renderShdLoader('SYNCING VENDOR INTELLIGENCE')}
    </section>
  `

  try {
    clearVendorMetaCache()
    clearVendorHistoryCache()

    ;[
      currentVendorData,
      currentVendorMeta,
      currentVendorHistory,
    ] = await Promise.all([
      ensureVendorData(),
      loadVendorMeta({ force: true }),
      loadVendorHistoryIndex({ force: true }),
    ])

    currentRecommendations = []

    if (appState.activeProfile) {
      const progress =
        mergeExpertiseProgress(
          appState.activeProfile
            .expertise_progress,
        )

      currentRecommendations =
        createVendorRecommendations(
          currentVendorData,
          progress,
          {
            inventory: normalizeInventory(
              appState.activeProfile.app_settings?.inventory,
            ),
            buildsState: normalizeBuildsState(
              appState.activeProfile.saved_builds,
            ),
          },
        )
    }

    renderCurrentVendorPage()
  } catch (error) {
    console.error(error)

    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>
            Could not load vendor data
          </strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}

import { appState } from '../../app/state.js'
import { ensureVendorData } from '../../app/dataLoaders.js'
import { renderVendorStatusPanel } from '../../app/vendorStatus.js'
import { saveUserProfile } from '../../services/profile.js'
import { loadVendorMeta } from '../../services/vendorMeta.js'
import { mergeExpertiseProgress } from '../expertise/expertise.js'
import {
  connectPurchaseButtons,
  connectVendorFilters,
  renderVendorPage,
} from './vendors.js'
import { createVendorRecommendations } from './recommendationEngine.js'
import {
  getPurchasedIdsForCurrentReset,
  togglePurchasedItem,
} from './purchases.js'

let currentRecommendations = []
let currentVendorData = null
let currentVendorMeta = null

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
    renderVendorStatusPanel(currentVendorMeta),
  )

  connectVendorFilters()
  connectPurchaseButtons(handleTogglePurchase)
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

export async function openVendorPage() {
  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      <div class="panel empty-state">
        <strong>
          Loading weekly vendor data…
        </strong>
      </div>
    </section>
  `

  try {
    ;[
      currentVendorData,
      currentVendorMeta,
    ] = await Promise.all([
      ensureVendorData(),
      loadVendorMeta(),
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

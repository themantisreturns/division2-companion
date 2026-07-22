import { renderShdLoader } from '../../ui/loading.js'
import { appState } from '../../app/state.js'
import {
  clearVendorDataCache,
  ensureGameCatalog,
  ensureVendorData,
  resetCatalogData,
  setVendorDataOverride,
} from '../../app/dataLoaders.js'
import { renderVendorStatusPanel } from '../../app/vendorStatus.js'
import { saveUserProfile } from '../../services/profile.js'
import {
  clearVendorMetaCache,
  loadVendorMeta,
} from '../../services/vendorMeta.js'
import { renderCatalogHealthPage } from './catalogHealth.js'
import {
  connectVendorImportPanel,
  renderVendorImportPanel,
} from '../vendors/vendorImport.js'

async function saveVendorImport(vendorImport) {
  if (!appState.activeUser ||
      !appState.activeProfile) {
    window.alert(
      'Sign in with GitHub before importing vendor files.',
    )
    return
  }

  const nextSettings = {
    ...(appState.activeProfile.app_settings ??
      {}),
    vendor_import: vendorImport,
  }

  const savedProfile =
    await saveUserProfile(
      appState.activeUser.id,
      { app_settings: nextSettings },
    )

  appState.activeProfile = savedProfile
  setVendorDataOverride(vendorImport)
}

async function clearVendorImport() {
  if (!appState.activeUser ||
      !appState.activeProfile) {
    return
  }

  const nextSettings = {
    ...(appState.activeProfile.app_settings ??
      {}),
  }

  delete nextSettings.vendor_import

  const savedProfile =
    await saveUserProfile(
      appState.activeUser.id,
      { app_settings: nextSettings },
    )

  appState.activeProfile = savedProfile
  clearVendorDataCache()
}

export async function openSettingsPage() {
  const mainContent =
    document.querySelector('.main-content')

  mainContent.innerHTML = `
    <section class="feature-page">
      ${renderShdLoader('LOADING APPLICATION SETTINGS')}
    </section>
  `

  try {
    const [
      catalog,
      vendorData,
      vendorMeta,
    ] = await Promise.all([
      ensureGameCatalog(),
      ensureVendorData(),
      loadVendorMeta(),
    ])

    if (!catalog) {
      throw new Error(
        'The generated catalog could not be loaded.',
      )
    }

    mainContent.innerHTML = `
      ${renderCatalogHealthPage(catalog)}
      ${renderVendorStatusPanel(vendorMeta)}
      ${renderVendorImportPanel(vendorData)}
    `

    connectVendorImportPanel({
      onImport: async (vendorImport) => {
        await saveVendorImport(vendorImport)
        await openSettingsPage()
      },
      onClear: async () => {
        await clearVendorImport()
        await openSettingsPage()
      },
    })

    document
      .querySelector(
        '#refresh-catalog-health',
      )
      ?.addEventListener(
        'click',
        async () => {
          const button =
            document.querySelector(
              '#refresh-catalog-health',
            )

          if (button) {
            button.disabled = true
            button.textContent =
              'Refreshing…'
          }

          resetCatalogData()
          clearVendorMetaCache()
          await openSettingsPage()
        },
      )
  } catch (error) {
    console.error(error)

    mainContent.innerHTML = `
      <section class="feature-page">
        <div class="panel empty-state">
          <strong>
            Could not load settings
          </strong>
          <p>${error.message}</p>
        </div>
      </section>
    `
  }
}

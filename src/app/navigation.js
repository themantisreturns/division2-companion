function setActivePage(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.page === activePage,
    )
  })
}

export function connectNavigation({
  openDashboard,
  openExpertise,
  openVendors,
  openLibrary,
  openInventory,
  openBuilds,
  openSettings,
}) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const page = button.dataset.page

    button.addEventListener('click', () => {
      if (page === 'Dashboard') {
        setActivePage('Dashboard')
        openDashboard()
      }

      if (page === 'Expertise') {
        setActivePage('Expertise')
        openExpertise()
      }

      if (page === 'Weekly Vendors') {
        setActivePage('Weekly Vendors')
        openVendors()
      }

      if (page === 'Library') {
        setActivePage('Library')
        openLibrary()
      }

      if (page === 'Inventory') {
        setActivePage('Inventory')
        openInventory()
      }

      if (page === 'Builds') {
        setActivePage('Builds')
        openBuilds()
      }

      if (page === 'Settings') {
        setActivePage('Settings')
        openSettings()
      }
    })
  })

  document
    .querySelector('[data-action="open-expertise"]')
    ?.addEventListener('click', () => {
      setActivePage('Expertise')
      openExpertise()
    })

  document
    .querySelector('.vendor-panel .primary-button')
    ?.addEventListener('click', () => {
      setActivePage('Weekly Vendors')
      openVendors()
    })
}

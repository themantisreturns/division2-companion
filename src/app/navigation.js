function setActivePage(activePage) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const isActive = button.dataset.page === activePage
    button.classList.toggle('active', isActive)
  })
}

export function connectNavigation({
  openDashboard,
  openExpertise,
  openVendors,
}) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const page = button.dataset.page

    button.addEventListener('click', () => {
      setActivePage(page)

      if (page === 'Dashboard') {
        openDashboard()
      }

      if (page === 'Expertise') {
        openExpertise()
      }

      if (page === 'Weekly Vendors') {
        openVendors()
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
    .querySelector('.primary-button')
    ?.addEventListener('click', () => {
      setActivePage('Weekly Vendors')
      openVendors()
    })
}
export function connectNavigation({
  openDashboard,
  openExpertise,
  openVendors,
}) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const page = button.dataset.page

    if (page === 'Dashboard') {
      button.addEventListener('click', openDashboard)
    }

    if (page === 'Expertise') {
      button.addEventListener('click', openExpertise)
    }

    if (page === 'Weekly Vendors') {
      button.addEventListener('click', openVendors)
    }
  })

  document
    .querySelector('[data-action="open-expertise"]')
    ?.addEventListener('click', openExpertise)

  document
    .querySelector('.primary-button')
    ?.addEventListener('click', openVendors)
}
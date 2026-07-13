export function connectNavigation({
  openDashboard,
  openExpertise,
}) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    const page = button.dataset.page

    if (page === 'Dashboard') {
      button.addEventListener('click', openDashboard)
    }

    if (page === 'Expertise') {
      button.addEventListener('click', openExpertise)
    }
  })

  document
    .querySelector('[data-action="open-expertise"]')
    ?.addEventListener('click', openExpertise)
}
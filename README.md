# Division 2 Companion

A browser-based companion app for **Tom Clancy's The Division 2** that helps players manage inventory, evaluate loot, plan builds, track Expertise, and decide what is worth buying from weekly vendors.

**Live app:** https://themantisreturns.github.io/division2-companion/

> Spend less time sorting gear and more time playing.

## Highlights

- **Personalized Command Center** with suggested next actions
- **Weekly Vendor Intelligence** with shopping scores, purchase tracking, and reset history
- **Inventory Management** with OCR-assisted scanning, duplicate analysis, wishlist support, and loot decisions
- **Build Tools** including guided templates, a live stat simulator, best-in-stash optimization, and an inventory-aware build generator
- **Gear Advisor** for armor and weapons, including recalibration guidance and build compatibility
- **Collection Tracking** for weapons, named gear, Exotics, brands, and gear sets
- **Expertise Tracking** with searchable categories and proficiency progress
- **Installable PWA** with offline access to previously loaded app resources and data
- **Cloud Profiles** through Supabase authentication

## Screenshots

Screenshots and a guided tour will be added as the public interface is finalized.

## Getting Started

### Requirements

- Node.js 20 or newer
- npm
- A Supabase project for authentication and cloud profile storage

### Local setup

```bash
git clone https://github.com/themantisreturns/division2-companion.git
cd division2-companion
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase values to `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### Available commands

```bash
npm run dev              # Validate catalog and start the development server
npm run build            # Validate catalog and create a production build
npm run preview          # Preview the production build
npm run catalog:build    # Regenerate the catalog
npm run catalog:validate # Validate catalog structure and content
npm run catalog:check    # Build and validate the catalog
```

## Project Structure

```text
src/                 Application code
public/catalog/      Generated catalog and reviewed source data
public/data/         Current vendor data and reset history
scripts/             Catalog and vendor maintenance scripts
docs/                Architecture, roadmap, design notes, and release notes
.github/workflows/   Deployment and scheduled vendor synchronization
```

More technical detail is available in [docs/architecture.md](docs/architecture.md). Planned work is tracked in [docs/roadmap.md](docs/roadmap.md).

## Data and Privacy

- OCR item screenshots are processed in the browser.
- Supabase is used for authentication and cloud profile storage.
- Fresh vendor data, cloud login, and cloud saves require an internet connection.
- Offline mode uses previously cached application resources and data.

## Contributing

Contributions and bug reports are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Disclaimer

This is an unofficial, fan-made project and is not affiliated with or endorsed by Ubisoft or Massive Entertainment.

*Tom Clancy's The Division 2* and related names, logos, and trademarks belong to their respective owners.

## License

This project is available under the [MIT License](LICENSE).

# Contributing

Thanks for helping improve Division 2 Companion.

## Before You Start

- Search existing issues before opening a new one.
- Keep changes focused on one feature or fix.
- Do not commit `.env` files, credentials, user exports, screenshots containing personal information, or generated build folders.
- Preserve the existing catalog and profile data formats unless the change includes a documented migration.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Before submitting a pull request, run:

```bash
npm run catalog:check
npm run build
```

## Pull Requests

Include:

- A clear description of the problem and solution
- Testing steps
- Screenshots for interface changes
- Any catalog, profile-schema, or migration implications

## Vendor and Catalog Data

- Keep provenance information when adding reviewed catalog data.
- Do not replace reviewed data with unverified scraped values.
- Run the catalog and vendor validators after data changes.

## Legal

Do not add copyrighted artwork, extracted game assets, or proprietary data unless its use is clearly permitted. This project is unofficial and is not affiliated with Ubisoft or Massive Entertainment.

# Catalog Search + Exotics Patch

This patch does two things:

1. Adds search boxes to Brands and Gear Sets.
2. Seeds the Exotics section so it is no longer empty.

## Install

Copy these two replacement files into your project:

- `src/features/expertise/expertise.js`
- `public/catalog/sources/manual.json`

Then run:

```bash
npm run catalog:build
npm run dev
```

Open Expertise and verify:

- Brands has a search box.
- Gear Sets has a search box.
- Exotics contains entries.
- Changes still save to Supabase.

## Data note

The exotic list is a reviewed starter seed, not a guarantee that every
live-service addition is represented. The catalog pipeline now has a usable
source list and can be extended without changing app code.

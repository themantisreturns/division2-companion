# Division 2 V3 Catalog Foundation

This bundle moves game data out of the weekly vendor feature and into a
generated, versioned catalog.

## Install

1. Copy the folders in this bundle into the root of your project.
2. Replace the matching files when Finder asks.
3. Apply the script changes from `PACKAGE_JSON_CHANGES.txt`.
4. In the VS Code terminal run:

   npm run catalog:build
   npm run dev

5. Open Expertise and confirm weapons, named gear, skills, brands, gear
   sets, specializations, and exotics render.

## Important limitation

The generator can only know about exact weapons, named gear, and exotics
that are present in your weekly JSON files or added to
`public/catalog/sources/manual.json`.

That means this is the production-quality catalog pipeline, not a claim
that the first generated catalog is already a complete copy of every item
currently in The Division 2.

## Adding reviewed catalog data

Add objects or names to the arrays in:

public/catalog/sources/manual.json

Then run:

npm run catalog:build

The generated file is:

public/catalog/catalog.json

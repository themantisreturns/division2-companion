# Knowledge Engine Update

This version adds a shared Division 2 item-evaluation layer used by Gear Advisor, Inventory, and Weekly Vendor recommendations.

## Added

- `src/features/knowledge/knowledgeData.js`
  - Curated build archetypes
  - High-value gear rules
  - Named/exotic keep rules
- `src/features/knowledge/knowledgeEngine.js`
  - Normalization and matching
  - Recalibration feasibility
  - Keep/donate/dismantle verdicts
  - Vendor item parsing
  - Inventory collection guidance

## Updated

- Gear Advisor now evaluates entered item details and shows:
  - score
  - verdict
  - recalibration advice
  - matching builds
- Inventory cards now show collection guidance.
- Weekly Vendor Expertise recommendations now include Gear Advisor verdicts and boost genuinely strong gear combinations.
- Responsive styling for the new evaluation workspace and rule library.

## Validation

The catalog builder and catalog validator both pass with zero warnings and zero errors.
All modified JavaScript files pass `node --check` syntax validation.
A complete Vite bundle could not be produced in the isolated environment because dependencies could not be installed there; GitHub Actions or a local `npm install && npm run build` will perform the final bundle validation.

## Inventory Screenshot Scanner

The Inventory page now includes a browser-based OCR scanner. Players can upload one or more item-detail screenshots, review the suggested catalog match, inspect detected rolls/talent text, and add the confirmed item to inventory. OCR is loaded at runtime from the jsDelivr-hosted Tesseract.js browser bundle; screenshots remain in the browser and are not sent to the app backend.

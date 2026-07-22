# Game Intelligence Engine v1.5.0

The app now uses a shared intelligence service layer instead of duplicating evaluation and personalization logic inside individual features.

## Shared modules

- `src/services/intelligence/evaluator.js` — armor, weapon, named-item, exotic, recalibration, and rule evaluation.
- `src/services/intelligence/compatibility.js` — build-archetype matching with compatibility scores and matched tags.
- `src/services/intelligence/context.js` — inventory quantity, wishlist, and saved-build matching.
- `src/services/intelligence/scoring.js` — centralized personalized score weights and vendor verdict thresholds.
- `src/services/intelligence/text.js` — consistent game-text normalization and matching.

## Compatibility

The existing `knowledgeEngine.js` API remains available as a compatibility facade, so current pages continue to work while using the unified service layer underneath.

## Result shape

Evaluated armor and weapons now include a `compatibility` array in addition to the existing score, verdict, reason, builds, and recalibration fields. Each compatibility entry contains the build name, score, matching tags, and whether it came from an explicit knowledge rule.

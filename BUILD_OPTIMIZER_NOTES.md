# Build Optimizer v1.6.0

The Builds page now compares each configured slot with screenshot-reviewed copies stored by the Inventory Scanner.

## How scoring works

- The existing Knowledge Engine score is used as the copy's base score.
- An exact match to the build's selected item receives a small fit bonus.
- Armor candidates must match the slot.
- Sidearms are separated from primary and secondary weapons.

The optimizer reports current reviewed score, potential score, possible gain, reviewed coverage, and the best reviewed candidate for each slot. Recommendations improve as more loot is scanned and kept.

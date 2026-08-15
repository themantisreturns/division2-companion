// Snapshot transcribed from Jay's 66 in-game Expertise screenshots captured 2026-08-14.
// Only values that are clearly readable in the screenshots are included. Merge logic
// never lowers an existing rank, so later progress is safe.
export const EXPERTISE_SCREENSHOT_SNAPSHOT = {
  id: '2026-08-14-66-screenshots',
  level: 13,
  levelProgress: { current: 195, total: 200 },
  proficient: { current: 210, total: 486 },
  legacySummary: {
    weapons: {
      Rifles: { current: 16, total: 36 },
      'Assault Rifles': { current: 28, total: 55 },
      'Marksman Rifles': { current: 16, total: 33 },
      Shotguns: { current: 19, total: 32 },
      SMGs: { current: 25, total: 44 },
      LMGs: { current: 18, total: 38 },
      Pistols: { current: 15, total: 32 },
      Specialization: { current: 6, total: 6 },
    },
    namedGear: {
      Masks: { current: 3, total: 12 },
      'Body Armor': { current: 3, total: 28 },
      Backpacks: { current: 3, total: 27 },
      Gloves: { current: 0, total: 11 },
      Holsters: { current: 1, total: 13 },
      Kneepads: { current: 0, total: 12 },
    },
  },
  individualRanks: {
    weapons: {
      Diamondback: 0,
      'The Virginian': 1,
      'Doctor Home': 1,
      'Born Great': 3,
      'The Apartment': 0,
      'The Chatterbox': 0,
      'Invisible Hand': 1,
      Pyromaniac: 2,
      Chameleon: 6,
      'FAL SA-58 Para': 10,
      Strega: 3,
      'The White Death': 10,
      'St. Elmo\'s Engine': 0,
      Lullaby: 4,
      'ACS-12': 10,
      'Dark Winter': 0,
      "Emeline's Guard": 0,
      'Swap Chain': 0,
      Pestilence: 10,
      Sleipner: 0,
      Dare: 0,
      'Bullet King': 9,
      Liberty: 0,
      'Mozambique Special': 2,
      'Busy Little Bee': 10,
    },
    namedGear: {
      'Punch Drunk': 10,
      'Everyday Carrier': 1,
      "Caesar's Guard": 2,
      'Hunter-Killer': 3,
      'Liquid Engineer': 0,
      'Strategic Alignment': 8,
      Backbone: 8,
      'Percussive Maintenance': 2,
      "Contractor's Gloves": 3,
      Forge: 4,
      'Claws Out': 10,
      "Emperor's Guard": 0,
    },
    exotics: {
      'Imperial Dynasty': 0,
      Vile: 0,
      Memento: 10,
      'Bloody Knuckles': 2,
      'BTSU Datagloves': 0,
      "Sawyer's Kneepads": 2,
    },
    skills: {
      'Sticky Bomb — Explosive': 5,
      'Trap — Shrapnel': 0,
      'Pulse — Remote': 0,
      'Turret — Assault': 10,
      'Hive — Stinger': 0,
      'Chem Launcher — Firestarter': 0,
      'Firefly — Demolisher': 0,
      'Seeker Mine — Airburst': 0,
      'Drone — Bombardier': 0,
      'Ballistic Shield — Deflector': 0,
    },
    specializations: {},
  },
}

export function mergeScreenshotSnapshot(progress) {
  const snapshot = EXPERTISE_SCREENSHOT_SNAPSHOT
  if (progress?.migration?.screenshotSnapshot === snapshot.id) return progress

  const merged = structuredClone(progress)
  merged.individualRanks ??= {}
  for (const [kind, values] of Object.entries(snapshot.individualRanks)) {
    merged.individualRanks[kind] ??= {}
    for (const [name, rank] of Object.entries(values)) {
      merged.individualRanks[kind][name] = Math.max(Number(merged.individualRanks[kind][name]) || 0, rank)
    }
  }

  merged.level = Math.max(Number(merged.level) || 0, snapshot.level)
  if (merged.level === snapshot.level) {
    merged.levelProgress = {
      current: Math.max(Number(merged.levelProgress?.current) || 0, snapshot.levelProgress.current),
      total: snapshot.levelProgress.total,
    }
  }
  merged.proficient = {
    current: Math.max(Number(merged.proficient?.current) || 0, snapshot.proficient.current),
    total: Math.max(Number(merged.proficient?.total) || 0, snapshot.proficient.total),
  }
  merged.legacySummary ??= {}
  for (const [section, values] of Object.entries(snapshot.legacySummary)) {
    merged.legacySummary[section] ??= {}
    for (const [name, ratio] of Object.entries(values)) {
      const existing = merged.legacySummary[section][name]
      merged.legacySummary[section][name] = {
        current: Math.max(Number(existing?.current) || 0, ratio.current),
        total: ratio.total,
      }
    }
  }

  merged.migration = {
    ...(merged.migration ?? {}),
    screenshotSnapshot: snapshot.id,
    screenshotSnapshotAppliedAt: new Date().toISOString(),
    screenshotSnapshotItems: Object.values(snapshot.individualRanks).reduce((sum, values) => sum + Object.keys(values).length, 0),
  }
  return merged
}

export const fallbackExpertiseCatalog = {
  weapons: [],
  namedGear: [],
  exotics: [],
  skills: [],
  specializations: [],
  brands: [],
  gearSets: [],
}

const LEGACY_DEFAULTS = {
  level: 0,

  weapons: {
    Rifles: { current: 1, total: 36 },
    'Assault Rifles': { current: 1, total: 55 },
    'Marksman Rifles': { current: 2, total: 32 },
    Shotguns: { current: 1, total: 32 },
    SMGs: { current: 0, total: 44 },
    LMGs: { current: 1, total: 38 },
    Pistols: { current: 1, total: 31 },
    Specialization: { current: 0, total: 6 },
  },

  namedGear: {
    Masks: { current: 1, total: 12 },
    'Body Armor': { current: 0, total: 28 },
    Backpacks: { current: 0, total: 27 },
    Gloves: { current: 0, total: 11 },
    Holsters: { current: 0, total: 13 },
    Kneepads: { current: 0, total: 12 },
  },

  skills: {
    'Sticky Bomb': { current: 0, total: 3 },
    Trap: { current: 0, total: 3 },
    Decoy: { current: 0, total: 1 },
    Pulse: { current: 0, total: 5 },
    Turret: { current: 1, total: 4 },
    Hive: { current: 1, total: 5 },
    'Chem Launcher': { current: 0, total: 4 },
    Firefly: { current: 0, total: 3 },
    'Seeker Mine': { current: 0, total: 4 },
    Drone: { current: 2, total: 5 },
    'Ballistic Shield': { current: 1, total: 4 },
    'Smart Cover': { current: 0, total: 2 },
  },
}

export const defaultExpertiseProgress = {
  ...LEGACY_DEFAULTS,
  brands: {},
  gearSets: {},
}

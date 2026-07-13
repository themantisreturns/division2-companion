const CURRENT_SCHEMA_VERSION = 2

function clone(value) {
  return structuredClone(value)
}

function normalizeBooleanMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key)
      .map(([key, isProficient]) => [
        key,
        Boolean(isProficient),
      ]),
  )
}

function normalizeRankMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, rank]) => [
      key,
      Math.max(0, Math.min(10, Number(rank) || 0)),
    ]),
  )
}

function getLegacySummary(progress = {}) {
  return {
    weapons: clone(progress.weapons ?? {}),
    namedGear: clone(progress.namedGear ?? {}),
    skills: clone(progress.skills ?? {}),
  }
}

export function createEmptyExpertiseProfile() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    level: 0,

    individual: {
      weapons: {},
      namedGear: {},
      exotics: {},
      skills: {},
      specializations: {},
    },

    ranks: {
      brands: {},
      gearSets: {},
    },

    legacySummary: {
      weapons: {},
      namedGear: {},
      skills: {},
    },

    migration: {
      migratedFromLegacy: false,
      migratedAt: null,
    },
  }
}

export function migrateExpertiseProgress(savedProgress = {}) {
  const emptyProfile = createEmptyExpertiseProfile()

  if (
    Number(savedProgress.schemaVersion) ===
    CURRENT_SCHEMA_VERSION
  ) {
    return {
      ...emptyProfile,
      ...savedProgress,

      individual: {
        ...emptyProfile.individual,
        ...savedProgress.individual,

        weapons: normalizeBooleanMap(
          savedProgress.individual?.weapons,
        ),

        namedGear: normalizeBooleanMap(
          savedProgress.individual?.namedGear,
        ),

        exotics: normalizeBooleanMap(
          savedProgress.individual?.exotics,
        ),

        skills: normalizeBooleanMap(
          savedProgress.individual?.skills,
        ),

        specializations: normalizeBooleanMap(
          savedProgress.individual?.specializations,
        ),
      },

      ranks: {
        brands: normalizeRankMap(
          savedProgress.ranks?.brands,
        ),

        gearSets: normalizeRankMap(
          savedProgress.ranks?.gearSets,
        ),
      },

      legacySummary: {
        ...emptyProfile.legacySummary,
        ...savedProgress.legacySummary,
      },
    }
  }

  return {
    ...emptyProfile,

    level: Number(savedProgress.level) || 0,

    ranks: {
      brands: normalizeRankMap(savedProgress.brands),
      gearSets: normalizeRankMap(savedProgress.gearSets),
    },

    legacySummary: getLegacySummary(savedProgress),

    migration: {
      migratedFromLegacy: true,
      migratedAt: new Date().toISOString(),
    },
  }
}

export function getExpertiseSchemaVersion() {
  return CURRENT_SCHEMA_VERSION
}
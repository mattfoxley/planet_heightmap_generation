// world-profiles.js — named world profiles for the normalize-world-scale change.
//
// A profile makes physical scale EXPLICIT (radius + art-directed geological feature scales) instead of
// the current implicit Earth calibration. Phase 1 only DEFINES and threads profiles; algorithm code does
// not consume them yet, so behavior is unchanged. Later phases migrate subsystems to read these values.
//
// All non-Earth values are EXPERIMENTAL defaults (design.md §3), not claims of physical correctness.

// LEGACY: a thin marker meaning "use the existing hard-coded constants / behavior". radiusKm = 6371 so
// world-scale metrics match today's `(π·6371)/√N`. Default during migration (nothing changes).
export const LEGACY_PROFILE = {
  id: 'legacy',
  radiusKm: 6371,          // HEIGHT_KM/DISTANCE_KM reference — Earth
  climateEnabled: true,
  legacy: true,            // algorithms keep using terrain-config.js constants directly
  // Elevation curve params consumed by elevation-scale.js; these reproduce color-map's legacy curve.
  elevation: { maxLandHeightKm: 6, oceanScaleKmPerUnit: 10 },
};

// EARTHLIKE: the radius-normalized profile that should reproduce Earth behavior once subsystems read it.
// Feature scales left mostly unset here → migrated subsystems fall back to legacy constants until tuned.
export const EARTHLIKE_PROFILE = {
  id: 'earthlike',
  radiusKm: 6371,
  climateEnabled: true,
  elevation: {
    // Earth parity: same curve endpoints as the legacy conversion.
    maxLandHeightKm: 6, oceanScaleKmPerUnit: 10,
    maxOceanDepthKm: 6.0,
    typicalLandKm: 0.5,
    typicalMountainKm: 4.0,
    exceptionalPeakKm: 8.0,
    // TODO(experiment): calibrate normalized↔km curve endpoints (inventory §12.5;
    // anchor with MAX_OCEAN_ARC_ELEV comment "0.60 = 6 km").
  },
};

// COMPACT 40 km — the initial interior-sphere game world (design §3, experiments.md).
export const COMPACT_40KM_PROFILE = {
  id: 'compact-40km',
  radiusKm: 20,
  diameterKm: 40,
  climateEnabled: false,   // Earth latitude climate invalid on an interior sphere (design §13)

  elevation: {
    // EXPERIMENTAL curve endpoints (Phase 10 tuning). maxLandHeightKm = exceptional peak; ocean scale
    // chosen so a deep abyss (~elevNorm -0.33) reaches ~-2 km. TODO(experiment): tune against relief targets.
    maxLandHeightKm: 4.0, oceanScaleKmPerUnit: 6.0,
    maxOceanDepthKm: 2.0,
    typicalLandKm: 0.25,
    typicalMountainKm: 1.5,
    exceptionalPeakKm: 4.0,
    hardPeakClampKm: 4.25,
  },
  tectonics: {
    plateCountRange: [8, 18], initialPlateCount: 12,
    superPlateCountRange: [3, 6], initialSuperPlateCount: 4,
    stressReachKm: 8.0,
    mountainBeltHalfWidthKm: 4.0, mountainInfluenceKm: 9.0,
    riftFloorHalfWidthKm: 0.75, riftShoulderInnerKm: 1.5, riftShoulderOuterKm: 3.5,
  },
  terrain: {
    ridgeSpacingKm: 0.8, ridgeEnvelopeKm: 2.5, ridgeDirectionSmoothingKm: 4.0,
    foothillReachKm: 3.5, coastalPlainWidthKm: 1.5, shelfWidthKm: 0.8,
    continentalSlopeWidthKm: 0.8, basinScaleKm: 8.0, detailMinWavelengthKm: 0.12,
    warpAmplitudeKm: 0.3, maxWarpKm: 1.0,   // domain warp (design §7); clamped vs smallest protected feature
  },
  erosion: {
    talusAngleDeg: 34, smoothingRadiusKm: 0.15, canyonCarveRadiusKm: 0.20,
    hydraulicLengthScaleKm: 1.0, minimumRiverWidthKm: 0.10,
  },
  validation: {
    minCellsAcross: { mountainInfluence: 40, mountainBelt: 20, ridgeSpacing: 6, riverValley: 3, smoothingRadius: 2, noiseWavelength: 3 },
  },
};

const PROFILES = {
  legacy: LEGACY_PROFILE,
  earthlike: EARTHLIKE_PROFILE,
  'compact-40km': COMPACT_40KM_PROFILE,
};

export const DEFAULT_PROFILE_ID = 'legacy';

/** Resolve a profile by id. Unknown / missing id falls back to LEGACY (safe, unchanged behavior). */
export function getWorldProfile(id) {
  return PROFILES[id] || LEGACY_PROFILE;
}

export function listWorldProfileIds() { return Object.keys(PROFILES); }

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
  // Make the Land Coverage slider a genuine target (ocean-land.js top-up): 0.3 → ~30% land,
  // 1.0 → ~no ocean (one continuous landmass). Off for legacy/earthlike (would shift the Earth baseline).
  logicalLandCoverage: true,

  elevation: {
    // Compact terrain spec (interior 40 km world). maxLandHeightKm is a RARE cap (exceptional summit),
    // not a routine height. `hypsometricExponent` replaces the strongly bottom-heavy legacy t⁴(5−4t) curve
    // with the gentler t^p so the land distribution is weighted to lowlands/uplands (median ~300–500 m)
    // instead of crushing everything near sea level. Oceans are shallow (limited deep water on a 40 km world).
    // Tuned to the visual-summary spec (measured sweep, seed 42 @ detail 300): median ~320 m, p90 ~1.43 km,
    // p99 ~2.82 km, rare peaks to ~3.9 km; ~74% of land below 800 m; mountain terrain ~10%.
    maxLandHeightKm: 4.2, hypsometricExponent: 1.5, oceanScaleKmPerUnit: 2.5,
    maxOceanDepthKm: 2.0,
    typicalLandKm: 0.4,          // median land target (spec: 300–500 m)
    typicalMountainKm: 1.5,
    highMountainKm: 2.8,
    exceptionalPeakKm: 4.2,
    hardPeakClampKm: 4.5,
  },
  // Compact-spec erosion balance: moderate hydraulic, LOW-moderate thermal, very low ridge sharpening,
  // light smoothing, low roughness (noise modifies forms, doesn't define them). Glacial off. Applied to
  // the sculpt sliders on profile-select (generate.js); the user can still adjust.
  sculpt: {
    // Measured balance (seed 42 @ detail 400): thermal 0.5 tames upper-percentile slopes (p90 ≈ 30°,
    // p95 ≈ 41°) while keeping the spec hypsometry (median ~315 m, max ~3.2 km). Raise thermal toward
    // 0.65 for gentler/shorter mountains, lower it toward 0.3 for taller/steeper — the tall-peak vs
    // sane-slope trade-off is inherent until broad-uplift mountain generation exists (see docs).
    // Tuned to the visual spec: LOW roughness (mountains only where tectonics builds them, not uniform
    // mini-mountains everywhere) + STRONG thermal erosion (grinds flanks to broad, coherent massifs with
    // deeply organized drainage, run width ~4.6 km vs ~2 km scattered). Few plates (12) → a few large
    // tectonic provinces. See the visual-summary sweep.
    noise: 0.1, smoothing: 0.2, thermalErosion: 0.7, hydraulicErosion: 0.35, ridgeSharpening: 0.12,
    // generation sliders (measured): MOSTLY-LAND comes from FEW continents, not plate count / landCoverage.
    // ocean-land.js only assigns a plate to a continent if it touches no OTHER continent, so 3+ continents
    // leave permanent ocean corridors that cap land at ~42%. With 2 continents the corridors vanish and land
    // reaches the target — measured 69% land at landCoverage 0.7 (spec: "2–4 major land regions").
    landCoverage: 0.7, plates: 12, continents: 2,
    // Default detail: a 40 km world needs far fewer regions than Earth. ~300 (~100k regions) gives a
    // detailed look in ~2 s; the phasor + mostly-land drainage scale super-linearly, so 600 (~204k) is
    // ~26 s — reserve high detail for a final bake. Fast iteration by default.
    detail: 300,
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
    // Phasor structural-ridge system scaled for the 20 km radius. The Earth defaults (55 / 180 km) are
    // larger than this whole sphere → global kernels + a searchBins explosion (generation hangs). These
    // local values give ~a few km ridge spacing within mountain belts and keep the kernel envelope local
    // (bandwidth 6 km → searchBins ~11, vs ~540 with the Earth default — the perf fix).
    phasorWavelengthKm: 3.5, phasorBandwidthKm: 6.0,
    foothillReachKm: 3.5, coastalPlainWidthKm: 1.5, shelfWidthKm: 0.8,
    continentalSlopeWidthKm: 0.8, basinScaleKm: 8.0, detailMinWavelengthKm: 0.12,
    warpAmplitudeKm: 0.3, maxWarpKm: 1.0,   // domain warp (design §7); clamped vs smallest protected feature
    // Phase 9 (design §11.2): compact uses much less ridge sharpening than the Earth-art default, plus a
    // physical max-added-height cap. EXPERIMENTAL — activated in Phase 10 (currently dormant).
    ridgeSharpenScale: 0.5, maxRidgeGainKm: 0.15,
  },
  erosion: {
    talusAngleDeg: 34, smoothingRadiusKm: 0.15, canyonCarveRadiusKm: 0.20,
    hydraulicLengthScaleKm: 1.0, minimumRiverWidthKm: 0.10,
    // Phase 6 (design §8.3/§8.4): terrain-only runoff (climate disabled on the interior sphere) + physical
    // incision safety caps. EXPERIMENTAL — activated only when the physical erosion mode runs (Phase 10).
    uniformRunoff: 0.35, maxIncisionKmPerIteration: 0.05, maxReliefFractionPerIteration: 0.35,
    physical: true,   // Phase 10: activate physical erosion mode (physical runoff + recalibrated K +
                      // km-based incision/ridge caps + physical canyon radius). Legacy/earthlike omit this.
  },
  // Phase 8 (design §10): Earth latitude-driven glacier placement is invalid on an interior sphere, so
  // glacial erosion is OFF by default. A future habitat-climate system can supply a `glaciationPotential`
  // field (imported temperature / altitude / author mask) to re-enable ice-flow carving decoupled from
  // latitude. See runPostProcessing + erodeComposite(glaciationPotential).
  glacial: { enabled: false },
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

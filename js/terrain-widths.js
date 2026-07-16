// terrain-widths.js — convert terrain feature widths between physical km and mesh hops (Phase 3).
//
// LEGACY model (confirmed in elevation.js): a width is `Math.max(FLOOR, Math.round(BASE * scaleFactor))`
// hops, where scaleFactor = √(numRegions / REF_REGIONS), REF_REGIONS = 10000. Since
// avgEdgeKm = π·radiusKm/√numRegions, the physical width is:
//     hops · avgEdgeKm = BASE · √(N/10000) · (π·radiusKm/√N) = BASE · (π·radiusKm/100)
// i.e. each BASE unit = π·radiusKm/100 km  (≈ 200.06 km at Earth radius). Derived + empirically
// verified against the legacy formula in tests/terrain-widths.test.mjs — NOT guessed (inventory §12.1).
//
// Migration pattern per site:
//     Math.max(FLOOR, Math.round(BASE * scaleFactor))
//   → widthKmToHops(widthKm, meshMetrics, FLOOR)
// where widthKm = baseWidthKm(BASE, profile.radiusKm) for the legacy/earthlike profile (reproduces the
// legacy width to floating-point tolerance), or an explicit profile km value for physical worlds.

import { cellsAcrossFeature } from './world-scale.js';

export const REF_REGIONS = 10000;

/**
 * Cells-per-feature validation (design §12): warn when a profile's configured physical feature width
 * resolves to fewer than the minimum cells at the current mesh resolution — i.e. the feature is too
 * small to render coherently. Returns an array of human-readable warning strings (empty if all OK, or
 * if the profile declares no feature widths / minimums — e.g. the legacy profile).
 */
export function featureWidthWarnings(profile, meshMetrics) {
  const mins = (profile.validation && profile.validation.minCellsAcross) || {};
  const t = profile.tectonics || {}, tr = profile.terrain || {}, er = profile.erosion || {};
  const checks = [
    ['mountainInfluence', t.mountainInfluenceKm, mins.mountainInfluence],
    ['mountainBelt', t.mountainBeltHalfWidthKm != null ? t.mountainBeltHalfWidthKm * 2 : undefined, mins.mountainBelt],
    ['ridgeSpacing', tr.ridgeSpacingKm, mins.ridgeSpacing],
    ['riverValley', er.minimumRiverWidthKm, mins.riverValley],
    ['smoothingRadius', er.smoothingRadiusKm, mins.smoothingRadius],
    ['noiseWavelength', tr.detailMinWavelengthKm, mins.noiseWavelength],
  ];
  const warnings = [];
  for (const [name, widthKm, minCells] of checks) {
    if (widthKm == null || minCells == null) continue;
    const cells = cellsAcrossFeature(widthKm, meshMetrics);
    if (cells < minCells) {
      warnings.push(`${name}: ${widthKm} km ≈ ${cells.toFixed(1)} cells across (min ${minCells}) `
                  + `— under-resolved at ${meshMetrics.numRegions} regions`);
    }
  }
  return warnings;
}

/** Physical km represented by a legacy `*_BASE` width unit at the given radius. */
export function baseWidthKm(base, radiusKm) {
  return base * Math.PI * radiusKm / 100;
}

/** Feature width in mesh hops from a physical km width, honoring a per-feature minimum-hop floor. */
export function widthKmToHops(widthKm, meshMetrics, floorHops = 1) {
  return Math.max(floorHops, Math.round(widthKm / meshMetrics.averageEdgeKm));
}

/**
 * Feature width in hops, using the PROFILE's declared physical km when present, else the legacy
 * `BASE`-derived width (design §5–6). This is what lets a compact world's features occupy their
 * intended physical size instead of Earth's angular pattern. When `profileKm == null` (e.g. the
 * legacy profile, which declares no feature km) this is byte-identical to the pre-existing
 * `widthKmToHops(baseWidthKm(BASE, radiusKm), …)`.
 */
export function featureHops(profileKm, legacyBase, meshMetrics, floorHops = 1) {
  const km = (profileKm != null && !isNaN(profileKm)) ? profileKm : baseWidthKm(legacyBase, meshMetrics.radiusKm);
  return widthKmToHops(km, meshMetrics, floorHops);
}

/** Continuous form of {@link featureHops} — profile km when present, else legacy BASE-derived km. */
export function featureHopsFloat(profileKm, legacyBase, meshMetrics) {
  const km = (profileKm != null && !isNaN(profileKm)) ? profileKm : baseWidthKm(legacyBase, meshMetrics.radiusKm);
  return km / meshMetrics.averageEdgeKm;
}

/**
 * Continuous (un-rounded) hop distance from a physical km width — for sites that use scaleFactor as a
 * smooth multiplier in ramps/thresholds (e.g. rift floor/shoulder), not a discrete hop count.
 * For legacy (Earth radius) this equals BASE·scaleFactor.
 */
export function widthKmToHopsFloat(widthKm, meshMetrics) {
  return widthKm / meshMetrics.averageEdgeKm;
}

/** Legacy scaleFactor (kept for reference / the legacy code path). */
export function scaleFactor(numRegions) {
  return Math.sqrt(numRegions / REF_REGIONS);
}

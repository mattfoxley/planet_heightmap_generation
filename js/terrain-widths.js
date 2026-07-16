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

export const REF_REGIONS = 10000;

/** Physical km represented by a legacy `*_BASE` width unit at the given radius. */
export function baseWidthKm(base, radiusKm) {
  return base * Math.PI * radiusKm / 100;
}

/** Feature width in mesh hops from a physical km width, honoring a per-feature minimum-hop floor. */
export function widthKmToHops(widthKm, meshMetrics, floorHops = 1) {
  return Math.max(floorHops, Math.round(widthKm / meshMetrics.averageEdgeKm));
}

/** Legacy scaleFactor (kept for reference / the legacy code path). */
export function scaleFactor(numRegions) {
  return Math.sqrt(numRegions / REF_REGIONS);
}

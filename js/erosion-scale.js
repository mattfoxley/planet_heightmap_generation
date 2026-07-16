// erosion-scale.js — physical-unit primitives for hydraulic & thermal erosion (design §8–9, Phase 6).
//
// Pure, unit-tested functions. The erosion loop in terrain-post.js stays in its LEGACY unit-flow mode
// by default (flow=1, normalized-elevation slopes); a physical profile opts into these alternatives.
// Keeping the physical model here — rather than inlined in the perf-critical loop — makes it reviewable
// and testable independently, and keeps the legacy path byte-identical (the loop only calls these when a
// finite/enabled option is supplied; legacy passes none).
//
// Nothing here changes behavior on its own: the deep physical-runoff rework + K recalibration + watershed
// verification are the Phase-10 experiment matrix. This is the safe, reusable foundation for it.

import { chordToAngularRad, angularToKm } from './world-scale.js';
import { heightKmToElevNorm } from './elevation-scale.js';

/**
 * §8.2 — neighbor/downstream distance in KILOMETERS from the unit-sphere CHORD distance the mesh stores
 * (`computeNeighborDist` = √Σ(Δxyz)² on the unit sphere). chord → angular → km.
 */
export function chordDistToKm(chordDist, radiusKm) {
  return angularToKm(chordToAngularRad(chordDist), radiusKm);
}

/**
 * §8.3 — physical flow initialization: runoff VOLUME per cell, replacing the legacy resolution-dependent
 * `flow[r] = 1`. `flow = cellAreaKm2 · runoff`, where `runoff = precipitationRate · runoffCoefficient`
 * (climate) or a uniform terrain-only value (design §8.3, `profile.erosion.uniformRunoff`).
 */
export function physicalFlowInit(cellAreaKm2, runoff) {
  return cellAreaKm2 * runoff;
}

/**
 * §8.5 — physical receiver slope, km rise per km run, replacing the unit-sphere `ΔnormalizedElev / chord`.
 * Requires heights already in km (elevation-scale.js) and distance in km (`chordDistToKm`).
 */
export function physicalSlopeKm(heightKmA, heightKmB, distKm) {
  return (distKm > 0) ? Math.abs(heightKmA - heightKmB) / distKm : 0;
}

/**
 * §8.4 — catastrophic-update clamp: limit a single-iteration lowering (km) to BOTH an absolute cap and a
 * fraction of local relief. Defaults are no-ops (Infinity cap, full relief) so the legacy path is
 * unaffected; a physical profile supplies finite values to prevent runaway incision at fine resolution.
 * `deltaKm` is the proposed (non-negative) lowering; returns the allowed lowering.
 */
export function clampIncisionKm(deltaKm, maxIncisionKm = Infinity, localReliefKm = Infinity, maxReliefFrac = 1) {
  const reliefCap = localReliefKm === Infinity ? Infinity : localReliefKm * maxReliefFrac;
  return Math.min(deltaKm, maxIncisionKm, reliefCap);
}

/**
 * Resolve the terrain-only uniform runoff for a profile (design §8.3). Returns `null` when the profile
 * declares none (legacy/earthlike) → the caller keeps legacy unit flow. Never throws.
 */
export function resolveUniformRunoff(profile) {
  const er = profile && profile.erosion;
  return (er && er.uniformRunoff != null && !isNaN(er.uniformRunoff)) ? er.uniformRunoff : null;
}

/**
 * §8.6 — canyon carve half-width in hops. Decouples canyon WIDTH from drainage-path LENGTH: when a
 * physical radius (hops, from `canyonCarveRadiusKm`) is supplied, use it; otherwise fall back to the
 * legacy `ceil(pathLength · legacyFrac)`. With `physicalRadiusHops == null` this is byte-identical to the
 * pre-existing `Math.max(minHops, Math.ceil(pathLength · FLOOD_CARVE_RADIUS_FRAC))`.
 */
export function canyonCarveRadiusHops(physicalRadiusHops, pathLength, legacyFrac, minHops = 3) {
  if (physicalRadiusHops != null && physicalRadiusHops > 0) return Math.max(minHops, Math.round(physicalRadiusHops));
  return Math.max(minHops, Math.ceil(pathLength * legacyFrac));
}

/**
 * §11.2 — cap the height a sharpening/uplift step may ADD above a baseline (the "maximum added height"
 * physical cap for ridge sharpening). Units follow the caller (km, or normalized when pre-converted).
 * Default `maxAdded = Infinity` → no-op (legacy path unchanged).
 */
export function clampAddedHeight(proposedNew, baseHeight, maxAdded = Infinity) {
  return (maxAdded !== Infinity && proposedNew - baseHeight > maxAdded) ? baseHeight + maxAdded : proposedNew;
}

/**
 * §11.2 — smallest wavelength (km) that resolves to at least `minCells` cells at this mesh resolution.
 * Detail noise below this is under-resolved (aliased). Used to audit / clamp detail-noise wavelengths.
 */
export function minResolvableWavelengthKm(averageEdgeKm, minCells) {
  return averageEdgeKm * minCells;
}

/**
 * Phase 10 (design §8.3-8.4) — recalibrate the stream-power coefficient when switching from legacy unit
 * flow (`flow=1`) to physical flow (`flow = cellAreaKm2·runoff`). Because flow scales by `cellArea·runoff`
 * everywhere, `factor = K·flow^m` is held at the reference resolution by dividing K by `(cellArea·runoff)^m`.
 * This keeps erosion MAGNITUDE anchored to the legacy look at the reference mesh while the flow field —
 * and thus flow TOTALS — become resolution-independent (Σ cellArea·runoff = landArea·runoff, vs Σ1 = landCount).
 */
export function recalibratedHydraulicK(baseK, cellAreaKm2, runoff, m) {
  const scale = cellAreaKm2 * runoff;
  return scale > 0 ? baseK / Math.pow(scale, m) : baseK;
}

/**
 * Phase 10 — convert a physical per-iteration height cap (km) to a NORMALIZED-elevation delta, using the
 * local slope of the (nonlinear) land curve at an operating reference height. `elev` is a profile's
 * elevation block. Returns Infinity when `capKm` is null/NaN → caller treats as no cap.
 */
export function kmCapToNorm(capKm, referenceKm, elev) {
  if (capKm == null || isNaN(capKm)) return Infinity;
  const n0 = heightKmToElevNorm(referenceKm, elev);
  const n1 = heightKmToElevNorm(referenceKm + capKm, elev);
  return Math.abs(n1 - n0);
}

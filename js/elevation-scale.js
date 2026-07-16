// elevation-scale.js — reversible normalized-elevation <-> physical-km conversion (Phase 2).
//
// The legacy curve (color-map.js `elevToHeightKm`) is reproduced exactly by LEGACY_ELEVATION, so
// selecting the legacy/earthlike profile is unchanged (to floating-point tolerance; exact pixel
// identity is an explicit non-goal). Physical profiles set their own endpoints.
//
// Land shape  g(t) = t^4 * (5 - 4t),  t in [0,1]:  g(0)=0, g(1)=1, monotonic increasing
// (g'(t) = 20 t^3 (1 - t) >= 0), so it is invertible on [0,1].
//   heightKm = maxLandHeightKm * g(min(elevNorm, 1))     (land, elevNorm > 0)
//   heightKm = elevNorm * oceanScaleKmPerUnit            (ocean, elevNorm <= 0; negative)
//
// Scalar semantics (design §2.6): higher elevNorm = uphill; positive = land, negative = ocean.
// Inward radial displacement for the interior sphere happens at export/render, NOT here.

import { clamp } from './world-scale.js';

// Reproduces color-map.js `elevToHeightKm`: land 6·t^4·(5-4t), ocean elev·10.
export const LEGACY_ELEVATION = { maxLandHeightKm: 6, oceanScaleKmPerUnit: 10 };

/** Land hypsometric shape g(t): [0,1] → [0,1]. */
export function landHeightShape(t) {
  const t2 = t * t;
  return t2 * t2 * (5 - 4 * t);
}

/** NORMALIZED_ELEVATION → HEIGHT_KM. `elev` is an elevation profile ({maxLandHeightKm, oceanScaleKmPerUnit}). */
export function elevNormToHeightKm(elevNorm, elev = LEGACY_ELEVATION) {
  if (elevNorm <= 0) return elevNorm * elev.oceanScaleKmPerUnit;
  return elev.maxLandHeightKm * landHeightShape(Math.min(elevNorm, 1));
}

/**
 * HEIGHT_KM → NORMALIZED_ELEVATION (inverse of the above). Ocean is linear; land solves g(t)=target by
 * bisection (60 iters → ~1e-18 bracket; stable because g is monotonic). Heights above maxLandHeightKm
 * clamp to elevNorm 1 (mirrors the forward min(elevNorm,1) cap).
 */
export function heightKmToElevNorm(heightKm, elev = LEGACY_ELEVATION) {
  if (heightKm <= 0) return heightKm / elev.oceanScaleKmPerUnit;
  const target = clamp(heightKm / elev.maxLandHeightKm, 0, 1);
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (landHeightShape(mid) < target) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

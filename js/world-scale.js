// world-scale.js — physical-scale conversion helpers for the normalize-world-scale change.
//
// PURE math only (no browser/Three/DOM deps) so it is unit-testable under Node. Topology stays on
// the unit sphere; these helpers convert to/from physical units using an explicit world radius.
//
// Unit conventions (see docs/scale-constant-inventory.md §1):
//   ANGLE_RAD    angular distance on the unit sphere
//   DISTANCE_KM  horizontal physical distance
//   AREA_KM2     physical area
//   MESH_HOPS    neighbour-graph hop count (resolution dependent)
//
// Legacy consistency: `averageEdgeKm` reproduces the existing repo idiom
//   avgEdgeRad = Math.PI / Math.sqrt(numRegions);  avgEdgeKm = avgEdgeRad * radiusKm   (= (π·Rearth)/√N at Earth)
// so selecting the legacy/earthlike profile (radiusKm = Rearth) yields identical numbers to today.

export function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

export function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

/** Robust great-circle angular distance between two unit vectors. Returns ANGLE_RAD in [0, π]. */
export function angularDistanceRad(a, b) {
  return Math.acos(clamp(dot3(a, b), -1, 1));
}

/** Chord length (Euclidean distance between unit vectors) → ANGLE_RAD. Cheaper for near neighbours. */
export function chordToAngularRad(chordLength) {
  return 2 * Math.asin(clamp(chordLength * 0.5, 0, 1));
}

/** ANGLE_RAD → DISTANCE_KM for the given world radius. */
export function angularToKm(angleRad, radiusKm) { return angleRad * radiusKm; }

/** DISTANCE_KM → ANGLE_RAD for the given world radius. */
export function kmToAngular(km, radiusKm) { return km / radiusKm; }

/** Mean edge angular length on a Fibonacci-sphere mesh ≈ π / √numRegions (matches existing avgEdgeRad). */
export function averageEdgeAngleRad(numRegions) { return Math.PI / Math.sqrt(numRegions); }

/**
 * Precompute the physical metrics of a mesh once, to be threaded through generation instead of
 * recomputing `(π·Rearth)/√N` inline in each subsystem.
 */
export function computeMeshPhysicalMetrics(numRegions, radiusKm) {
  const edgeAngleRad = averageEdgeAngleRad(numRegions);
  const averageEdgeKm = edgeAngleRad * radiusKm;                        // == (π·radiusKm)/√N
  const approximateCellAreaKm2 = (4 * Math.PI * radiusKm * radiusKm) / numRegions;
  return {
    numRegions,
    radiusKm,
    averageEdgeAngleRad: edgeAngleRad,
    averageEdgeKm,
    approximateCellAreaKm2,
    cellsPerKm: 1 / averageEdgeKm,
    kmPerCell: averageEdgeKm,
  };
}

/** DISTANCE_KM → MESH_HOPS (≥1). Transitional bridge until weighted edge-distance fields (design §5.3). */
export function kmToApproxHops(km, meshMetrics) {
  return Math.max(1, Math.round(km / meshMetrics.averageEdgeKm));
}

/** How many cells span a feature of the given width — for resolution/coherence validation (design §12). */
export function cellsAcrossFeature(featureWidthKm, meshMetrics) {
  return featureWidthKm / meshMetrics.averageEdgeKm;
}

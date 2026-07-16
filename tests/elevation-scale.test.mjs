// Unit tests for js/elevation-scale.js (Phase 2). Round-trip + legacy parity.
// Run: node --experimental-modules tests/elevation-scale.test.mjs   (needs local package.json type:module)

import { elevNormToHeightKm, heightKmToElevNorm, landHeightShape, LEGACY_ELEVATION } from '../js/elevation-scale.js';
import { elevToHeightKm } from '../js/color-map.js';
import { getWorldProfile } from '../js/world-profiles.js';

let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + name); } }
function approx(a, b, eps = 1e-9) { return Math.abs(a - b) <= eps; }

// reference = the exact legacy formula from color-map.js history
function ref(e) {
  if (e <= 0) return e * 10;
  const t = Math.min(e, 1), t2 = t * t;
  return 6 * t2 * t2 * (5 - 4 * t);
}

// legacy parity (to floating-point tolerance; exact bit identity is a non-goal)
for (const e of [-0.5, -0.35, -0.1, 0, 0.25, 0.5, 0.75, 1.0, 1.2]) {
  ok(`legacy parity @ ${e}`, approx(elevNormToHeightKm(e, LEGACY_ELEVATION), ref(e), 1e-12));
  ok(`color-map delegation @ ${e}`, approx(elevToHeightKm(e), elevNormToHeightKm(e, LEGACY_ELEVATION), 0));
}

// spec: sea level
ok('elevNorm 0 → 0 km', elevNormToHeightKm(0, LEGACY_ELEVATION) === 0);
ok('0 km → elevNorm 0', heightKmToElevNorm(0, LEGACY_ELEVATION) === 0);

// spec: positive peak round-trip
ok('max land (e=1) → 6 km', approx(elevNormToHeightKm(1, LEGACY_ELEVATION), 6, 1e-12));
ok('6 km → e≈1 round-trip', approx(heightKmToElevNorm(6, LEGACY_ELEVATION), 1, 1e-6));

// land round-trips
for (const e of [0.05, 0.25, 0.5, 0.75, 0.95, 1.0]) {
  ok(`land round-trip e=${e}`, approx(heightKmToElevNorm(elevNormToHeightKm(e, LEGACY_ELEVATION), LEGACY_ELEVATION), e, 1e-6));
}
// ocean round-trips (linear → tight) + sign/depth preserved
for (const e of [-0.05, -0.2, -0.35, -0.5]) {
  const km = elevNormToHeightKm(e, LEGACY_ELEVATION);
  ok(`ocean km<0 @ e=${e}`, km < 0);
  ok(`ocean round-trip e=${e}`, approx(heightKmToElevNorm(km, LEGACY_ELEVATION), e, 1e-12));
}
ok('ocean depth: -0.3 → -3 km', approx(elevNormToHeightKm(-0.3, LEGACY_ELEVATION), -3, 1e-12));

// compact profile endpoints
{
  const ce = getWorldProfile('compact-40km').elevation;
  // Tuning-robust: assert against the profile's own endpoints, not frozen numbers (values are art-directed).
  ok('compact max land (e=1) → maxLandHeightKm', approx(elevNormToHeightKm(1, ce), ce.maxLandHeightKm, 1e-12));
  ok('compact maxLandHeightKm → e≈1', approx(heightKmToElevNorm(ce.maxLandHeightKm, ce), 1, 1e-6));
  ok('compact ocean is linear in oceanScaleKmPerUnit', approx(elevNormToHeightKm(-0.3333333, ce), -0.3333333 * ce.oceanScaleKmPerUnit, 1e-9));
  // hypsometricExponent (if set) lifts the median: g(0.5) with the gentler curve exceeds the legacy g(0.5).
  ok('compact curve gentler than legacy (higher mid)', ce.hypsometricExponent == null || landHeightShape(0.5, ce) > landHeightShape(0.5));
}

// land shape monotonic increasing on [0,1]
{
  let mono = true, prev = -1;
  for (let i = 0; i <= 20; i++) { const g = landHeightShape(i / 20); if (g < prev) mono = false; prev = g; }
  ok('landHeightShape monotonic ↑', mono);
  ok('g(0)=0', landHeightShape(0) === 0);
  ok('g(1)=1', approx(landHeightShape(1), 1, 1e-12));
}

console.log(`elevation-scale tests: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

// Unit tests for js/world-scale.js and js/world-profiles.js.
// Run: node tests/world-scale.test.mjs   (add --experimental-modules on Node < 12.17)
// No test framework (repo has no package.json / build step) — plain asserts, exit 1 on failure.

import {
  angularDistanceRad, chordToAngularRad, angularToKm, kmToAngular,
  averageEdgeAngleRad, computeMeshPhysicalMetrics, kmToApproxHops, cellsAcrossFeature,
} from '../js/world-scale.js';
import { getWorldProfile, DEFAULT_PROFILE_ID, listWorldProfileIds } from '../js/world-profiles.js';

let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + name); } }
function approx(a, b, eps = 1e-9) { return Math.abs(a - b) <= eps; }
const PI = Math.PI;

// angularDistanceRad
ok('same dir → 0', approx(angularDistanceRad([1,0,0],[1,0,0]), 0, 1e-7));
ok('orthogonal → π/2', approx(angularDistanceRad([1,0,0],[0,1,0]), PI/2, 1e-9));
ok('opposite → π', approx(angularDistanceRad([1,0,0],[-1,0,0]), PI, 1e-7));
ok('chordToAngular(√2) → π/2 (orthogonal chord)', approx(chordToAngularRad(Math.SQRT2), PI/2, 1e-9));

// km <-> angle round trip
ok('km→angle→km round trip', approx(angularToKm(kmToAngular(137.5, 20), 20), 137.5, 1e-9));
// spec scenario: 1 km warp @ radius 20 → 0.05 rad
ok('spec: warp 1km @ r20 = 0.05 rad', approx(kmToAngular(1, 20), 0.05, 1e-12));

// mesh metrics — legacy consistency with (π·radiusKm)/√N
{
  const N = 500000, R = 6371;
  const m = computeMeshPhysicalMetrics(N, R);
  ok('averageEdgeAngleRad = π/√N', approx(m.averageEdgeAngleRad, PI/Math.sqrt(N)));
  ok('averageEdgeKm = (π·R)/√N (legacy idiom)', approx(m.averageEdgeKm, (PI*R)/Math.sqrt(N)));
  ok('kmPerCell mirrors averageEdgeKm', approx(m.kmPerCell, m.averageEdgeKm));
  ok('cellsPerKm = 1/averageEdgeKm', approx(m.cellsPerKm, 1/m.averageEdgeKm));
}
// compact sphere area sums to 4πR² (≈ 5026.548 km² at R=20)
{
  const N = 500000, R = 20;
  const m = computeMeshPhysicalMetrics(N, R);
  ok('cell area × N = 4πR² (5026.55 km²)', approx(m.approximateCellAreaKm2 * N, 4*PI*R*R, 1e-6));
  const hops = kmToApproxHops(8, m);
  ok('kmToApproxHops(8km) = round(8/edgeKm) ≥1', hops === Math.max(1, Math.round(8/m.averageEdgeKm)) && hops >= 1);
  ok('cellsAcrossFeature(8km) = 8/edgeKm', approx(cellsAcrossFeature(8, m), 8/m.averageEdgeKm));
}

// profiles
ok('compact-40km radius = 20', getWorldProfile('compact-40km').radiusKm === 20);
ok('legacy radius = 6371', getWorldProfile('legacy').radiusKm === 6371);
ok('unknown id → legacy', getWorldProfile('does-not-exist').id === 'legacy');
ok('default profile id = legacy', DEFAULT_PROFILE_ID === 'legacy');
ok('lists 3 profiles', listWorldProfileIds().length === 3);
ok('compact climate disabled', getWorldProfile('compact-40km').climateEnabled === false);

// NOTE: deterministic-seed *generation* tests are deferred (need the worker). Per the Phase-0
// baseline finding (seeds 42≡400 at detail 600), such tests must assert SAME-seed reproducibility,
// not cross-seed uniqueness.

console.log(`world-scale tests: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

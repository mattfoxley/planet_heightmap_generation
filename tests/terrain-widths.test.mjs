// Parity test for js/terrain-widths.js (Phase 3 foundation).
// Verifies the km-based width conversion reproduces the legacy `round(BASE*scaleFactor)` hop count
// EXACTLY across representative *_BASE values and mesh resolutions, for the Earth radius.
// Run: node --experimental-modules tests/terrain-widths.test.mjs

import { baseWidthKm, widthKmToHops, widthKmToHopsFloat, featureWidthWarnings, scaleFactor, REF_REGIONS } from '../js/terrain-widths.js';
import { computeMeshPhysicalMetrics } from '../js/world-scale.js';
import { getWorldProfile } from '../js/world-profiles.js';

let passed = 0, failed = 0, maxDiff = 0;
function ok(name, cond) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + name); } }

const R = 6371;
// (BASE, FLOOR) pairs mirroring real elevation.js sites.
const CASES = [
  [16, 4], [20, 6], [3.2, 2], [8, 8], [4, 2], [12, 4], [7, 3], [2, 1], [10, 4], [3, 2], [5, 3],
];
const RESOLUTIONS = [10000, 31000, 50000, 200000, 500000, 1000000, 2000000];

ok('REF_REGIONS = 10000', REF_REGIONS === 10000);

for (const N of RESOLUTIONS) {
  const m = computeMeshPhysicalMetrics(N, R);
  for (const [base, floor] of CASES) {
    const legacy = Math.max(floor, Math.round(base * scaleFactor(N)));
    const kmHops = widthKmToHops(baseWidthKm(base, R), m, floor);
    const diff = Math.abs(legacy - kmHops);
    if (diff > maxDiff) maxDiff = diff;
    ok(`parity base=${base} floor=${floor} N=${N} (legacy=${legacy} km=${kmHops})`, legacy === kmHops);
  }
}

// continuous (float) parity vs BASE*scaleFactor — for rift/arc smooth-ramp sites
let maxRelDiff = 0;
for (const N of RESOLUTIONS) {
  const m = computeMeshPhysicalMetrics(N, R);
  for (const [base] of CASES) {
    const legacy = base * scaleFactor(N);
    const kmFloat = widthKmToHopsFloat(baseWidthKm(base, R), m);
    const rel = legacy === 0 ? 0 : Math.abs(legacy - kmFloat) / legacy;
    if (rel > maxRelDiff) maxRelDiff = rel;
  }
}
ok(`float parity vs BASE*scaleFactor (rel diff ${maxRelDiff.toExponential(2)} < 1e-12)`, maxRelDiff < 1e-12);

// baseWidthKm sanity: 1 base unit ≈ 200.06 km at Earth radius
ok('baseWidthKm(1) ≈ 200.06 km', Math.abs(baseWidthKm(1, R) - Math.PI * R / 100) < 1e-9);

// cells-per-feature warnings (design §12)
{
  const legacy = getWorldProfile('legacy');
  const compact = getWorldProfile('compact-40km');
  ok('legacy profile → no warnings', featureWidthWarnings(legacy, computeMeshPhysicalMetrics(500000, 6371)).length === 0);
  const wLow  = featureWidthWarnings(compact, computeMeshPhysicalMetrics(50000, compact.radiusKm));
  const wHigh = featureWidthWarnings(compact, computeMeshPhysicalMetrics(1000000, compact.radiusKm));
  ok('compact @ 50k → some under-resolved warnings', wLow.length > 0);
  ok('warnings decrease (or hold) with resolution', wHigh.length <= wLow.length);
  ok('warning text mentions "cells across"', wLow.length === 0 || wLow[0].includes('cells across'));
}

console.log(`terrain-widths tests: ${passed} passed, ${failed} failed (max hop diff = ${maxDiff})`);
if (failed) process.exit(1);

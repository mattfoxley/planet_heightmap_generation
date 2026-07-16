// Parity test for js/terrain-widths.js (Phase 3 foundation).
// Verifies the km-based width conversion reproduces the legacy `round(BASE*scaleFactor)` hop count
// EXACTLY across representative *_BASE values and mesh resolutions, for the Earth radius.
// Run: node --experimental-modules tests/terrain-widths.test.mjs

import { baseWidthKm, widthKmToHops, scaleFactor, REF_REGIONS } from '../js/terrain-widths.js';
import { computeMeshPhysicalMetrics } from '../js/world-scale.js';

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

// baseWidthKm sanity: 1 base unit ≈ 200.06 km at Earth radius
ok('baseWidthKm(1) ≈ 200.06 km', Math.abs(baseWidthKm(1, R) - Math.PI * R / 100) < 1e-9);

console.log(`terrain-widths tests: ${passed} passed, ${failed} failed (max hop diff = ${maxDiff})`);
if (failed) process.exit(1);

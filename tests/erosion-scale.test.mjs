// Unit tests for js/erosion-scale.js (Phase 6 — hydraulic/thermal physical primitives).
// Run: node --experimental-modules tests/erosion-scale.test.mjs

import { chordDistToKm, physicalFlowInit, physicalSlopeKm, clampIncisionKm, resolveUniformRunoff, canyonCarveRadiusHops } from '../js/erosion-scale.js';
import { angularToKm, chordToAngularRad } from '../js/world-scale.js';
import { getWorldProfile } from '../js/world-profiles.js';

let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + name); } }
function approx(a, b, eps = 1e-9) { return Math.abs(a - b) <= eps; }

// chordDistToKm — matches the explicit chord→angular→km path
{
  const chord = 0.001, R = 20;
  ok('chordDistToKm = angularToKm(chordToAngular)', approx(chordDistToKm(chord, R), angularToKm(chordToAngularRad(chord), R)));
  // tiny chord ≈ angular ≈ chord (small-angle), so km ≈ chord·R
  ok('small chord ≈ chord·R', approx(chordDistToKm(0.0005, 20), 0.0005 * 20, 1e-6));
  // radius scales linearly
  ok('km scales with radius', approx(chordDistToKm(0.01, 6371) / chordDistToKm(0.01, 20), 6371 / 20, 1e-6));
}

// physicalFlowInit
ok('physicalFlowInit = area·runoff', physicalFlowInit(2.5, 0.4) === 1.0);
ok('physicalFlowInit zero runoff → 0', physicalFlowInit(100, 0) === 0);

// physicalSlopeKm — km rise / km run (design §8.5 spec: 0.5 km / 1 km → 0.5)
ok('slope 0.5km/1km = 0.5', approx(physicalSlopeKm(1.0, 0.5, 1.0), 0.5));
ok('slope is absolute (sign-independent)', approx(physicalSlopeKm(0.5, 1.0, 1.0), 0.5));
ok('zero distance → 0 (no div-by-zero)', physicalSlopeKm(1, 0, 0) === 0);

// clampIncisionKm — defaults are no-ops (legacy path unchanged)
ok('default (Infinity) passes delta through', clampIncisionKm(5.0) === 5.0);
ok('absolute cap applies', clampIncisionKm(5.0, 2.0) === 2.0);
ok('relief-fraction cap applies', approx(clampIncisionKm(5.0, Infinity, 4.0, 0.5), 2.0));
ok('tightest of the two caps wins', clampIncisionKm(5.0, 1.5, 4.0, 0.5) === 1.5);
ok('delta under all caps passes through', clampIncisionKm(0.3, 1.5, 4.0, 0.5) === 0.3);
ok('Infinity relief → only absolute cap', clampIncisionKm(9, 3, Infinity, 0.5) === 3);

// resolveUniformRunoff
ok('legacy → null (no erosion.uniformRunoff)', resolveUniformRunoff(getWorldProfile('legacy')) === null);
ok('missing profile → null', resolveUniformRunoff(undefined) === null);
{
  const fake = { erosion: { uniformRunoff: 0.35 } };
  ok('declared uniformRunoff returned', resolveUniformRunoff(fake) === 0.35);
  ok('NaN uniformRunoff → null', resolveUniformRunoff({ erosion: { uniformRunoff: NaN } }) === null);
}
// compact profile: once it declares uniformRunoff, it should resolve (see world-profiles.js Phase 6 field).
{
  const c = getWorldProfile('compact-40km');
  const ru = resolveUniformRunoff(c);
  ok('compact uniformRunoff resolves to a number or null', ru === null || typeof ru === 'number');
}

// canyonCarveRadiusHops (Phase 7 §8.6) — decouple canyon width from drainage path length
{
  const FRAC = 0.15; // representative FLOOD_CARVE_RADIUS_FRAC
  // null physical radius → byte-identical to legacy Math.max(3, ceil(pathLength·FRAC))
  for (const len of [0, 5, 20, 100, 333]) {
    const legacy = Math.max(3, Math.ceil(len * FRAC));
    ok(`legacy carve radius pathLen=${len}`, canyonCarveRadiusHops(null, len, FRAC) === legacy);
  }
  // physical radius overrides path length entirely (the decoupling)
  ok('physical radius overrides long path', canyonCarveRadiusHops(8, 100000, FRAC) === 8);
  ok('physical radius overrides short path', canyonCarveRadiusHops(8, 1, FRAC) === 8);
  ok('physical radius rounds', canyonCarveRadiusHops(8.6, 50, FRAC) === 9);
  ok('physical radius respects min floor', canyonCarveRadiusHops(1, 50, FRAC) === 3);
  ok('zero/negative physical radius → legacy', canyonCarveRadiusHops(0, 40, FRAC) === Math.max(3, Math.ceil(40 * FRAC)));
}

console.log(`erosion-scale tests: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

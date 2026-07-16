// Unit tests for js/export-metadata.js (Phase 2 physical export mode).
// Run: node --experimental-modules tests/export-metadata.test.mjs

import { heightmapMetadata } from '../js/export-metadata.js';
import { getWorldProfile } from '../js/world-profiles.js';

let passed = 0, failed = 0;
function ok(name, cond) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + name); } }
function approx(a, b, eps = 1e-9) { return Math.abs(a - b) <= eps; }

const legacy = getWorldProfile('legacy');
const compact = getWorldProfile('compact-40km');

// heightmap (full range) vs land heightmap — ranges must match the encoder
const hm = heightmapMetadata('heightmap', legacy);
ok('heightmap min -5', hm.minHeightKm === -5);
ok('heightmap max 6', hm.maxHeightKm === 6);
ok('heightmap encoding linear', hm.heightEncoding === 'linear-physical-km');
ok('heightmap projection equirect', hm.projection === 'equirectangular');
ok('heightmap 16-bit', hm.bitDepth === 16);

const lhm = heightmapMetadata('landheightmap', legacy);
ok('landheightmap min 0', lhm.minHeightKm === 0);
ok('landheightmap max 6', lhm.maxHeightKm === 6);

// radius + sphere mode follow the profile
ok('legacy radius 6371', hm.worldRadiusKm === 6371);
ok('legacy exterior', hm.sphereMode === 'exterior');
const cm = heightmapMetadata('heightmap', compact);
ok('compact radius 20', cm.worldRadiusKm === 20);
ok('compact interior', cm.sphereMode === 'interior');
ok('compact seaLevelRadius 20', cm.seaLevelRadiusKm === 20);

// the documented value→km mapping must round-trip the encoder endpoints
function v2km(meta, value) { return value / 65535 * (meta.maxHeightKm - meta.minHeightKm) + meta.minHeightKm; }
ok('heightmap value 0 → -5 km', approx(v2km(hm, 0), -5));
ok('heightmap value 65535 → 6 km', approx(v2km(hm, 65535), 6));
ok('landheightmap value 0 → 0 km', approx(v2km(lhm, 0), 0));
ok('landheightmap value 65535 → 6 km', approx(v2km(lhm, 65535), 6));

console.log(`export-metadata tests: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

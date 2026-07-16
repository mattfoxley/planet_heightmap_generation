// Guard: no NEW direct `6371` (Earth radius) uses in terrain algorithms (spec: "Earth constant audit").
// Run: node tests/guard-earth-radius.mjs   (add --experimental-modules on Node < 12.17)
//
// RATCHET: the codebase still has legacy `6371` sites (catalogued in docs/scale-constant-inventory.md §2).
// They are removed across later phases (terrain by Phase 3; climate by the separate climate change).
// Until then this guard ALLOWLISTS the known sites so it passes, and FAILS on any 6371 in a file not on
// the list — preventing new Earth-radius coupling. Shrink ALLOWLIST as sites are migrated; target = empty
// (except world-profiles.js radius definitions).

import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JS_DIR = path.join(__dirname, '..', 'js');

// Allowed to contain 6371: profile definitions (Earth radius IS the value) + known legacy sites pending migration.
const ALLOWLIST = new Set([
  'world-profiles.js',   // earthlike/legacy radiusKm — legitimate
  // --- legacy, pending migration (see inventory §2) ---
  'elevation.js',        // TERRAIN — remove in Phase 3
  'terrain-metrics.js',  // TERRAIN — Phase 1/3 (metrics km via profile radius)
  'heuristic-precip.js', // climate — deferred
  'ocean.js',            // climate — deferred
  'precipitation.js',    // climate — deferred
  'wind.js',             // climate — deferred
  'temperature.js',      // climate — deferred
]);

const RE = /\b6371\b/;
const offenders = [];
const legacyHits = [];

for (const f of readdirSync(JS_DIR)) {
  if (!f.endsWith('.js')) continue;
  const txt = readFileSync(path.join(JS_DIR, f), 'utf8');
  if (!RE.test(txt)) continue;
  const count = (txt.match(/\b6371\b/g) || []).length;
  if (ALLOWLIST.has(f)) legacyHits.push(`${f} (${count})`);
  else offenders.push(`${f} (${count})`);
}

console.log('guard-earth-radius: legacy 6371 sites (allowed, pending migration):');
for (const h of legacyHits) console.log('  - ' + h);

if (offenders.length) {
  console.error('\nFAIL: new/unexpected direct 6371 usage (not on allowlist):');
  for (const o of offenders) console.error('  - ' + o);
  console.error('If this is a legacy site, migrate it to profile.radiusKm; do not add to the allowlist.');
  process.exit(1);
}
console.log(`\nPASS: no new 6371 usage. Legacy sites remaining: ${legacyHits.length} (target: shrink to 1 = world-profiles.js).`);

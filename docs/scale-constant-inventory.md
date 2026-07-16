# Scale Constant Inventory

Phase 0 artifact for the `normalize-world-scale` OpenSpec change. This catalogs where World
Orogen couples to physical scale today, classifies each relevant constant by unit category, and
flags constants whose unit meaning is uncertain (to be resolved by experiment, **not** guessed).

**Status:** inventory complete; baseline artifacts pending (see §11).
**Scope note:** this migration targets the **terrain** pipeline first. The **climate** subsystem
(`wind.js`, `temperature.js`, `precipitation.js`, `heuristic-precip.js`, `ocean.js`, `climate-*.js`)
stays Earth-only for now (design §13), so its `6371` uses are catalogued but deferred.

## 1. Unit categories (design §4)

| Tag | Meaning |
|---|---|
| `DIMENSIONLESS` | pure ratio / weight / normalized noise; no physical unit |
| `ANGLE_RAD` | angular distance or displacement on the unit sphere |
| `DISTANCE_KM` | horizontal physical distance |
| `HEIGHT_KM` | vertical physical height |
| `SLOPE_RATIO` | rise/run (dimensionless but must compare compatible units) |
| `AREA_KM2` | physical area |
| `RATE_PER_ITERATION` | per-pass fraction/rate (iteration-count dependent) |
| `MESH_HOPS_LEGACY` | resolution-scaled hop/width count standing in for a physical distance |
| `NORMALIZED_ELEVATION_LEGACY` | internal `[-1,1]`-ish elevation, non-linear vs km |

## 2. Direct `6371` (Earth radius) usage

Guard test target: no direct `6371` in terrain algorithms outside profiles/tests.

| File:line | Context | Classification | Migration |
|---|---|---|---|
| `js/elevation.js:1386-1387` | `PHASOR_WAVELENGTH_KM / 6371`, `PHASOR_BANDWIDTH_KM / 6371` → radians | DISTANCE_KM→ANGLE_RAD | **terrain** — replace `6371` with `profile.radiusKm` (Phase 3) |
| `js/elevation.js:1403` | `avgEdgeKm = (π·6371)/√N` | MESH metric | **terrain** — from `computeMeshPhysicalMetrics` (Phase 1) |
| `js/terrain-metrics.js:19` | `hops · avgEdgeRad · 6371` → km | MESH_HOPS_LEGACY→DISTANCE_KM | **terrain** — use profile radius (Phase 1) |
| `js/heuristic-precip.js:133` | `avgEdgeKm` | MESH metric | climate — deferred |
| `js/ocean.js:210` | `avgEdgeKm` | MESH metric | climate — deferred |
| `js/precipitation.js:207-209` | `avgEdgeKm` | MESH metric | climate — deferred |
| `js/wind.js:545` | `avgEdgeKm` | MESH metric | climate — deferred |
| `js/temperature.js:219,389,428,529,796` | lat-band km, `avgEdgeKm` | DISTANCE_KM (Earth-latitude) | climate — deferred |
| `CLAUDE.md:67` | doc formula `avgEdgeKm=(π·6371)/√N` | doc | update after Phase 1 |

**Note:** the `avgEdgeKm = (Math.PI * 6371) / Math.sqrt(numRegions)` idiom is duplicated in ≥6 files.
Phase 1 centralizes it in `computeMeshPhysicalMetrics(numRegions, radiusKm)`; terrain call sites switch
first, climate call sites remain on the Earth value until the climate change.

## 3. Explicit physical-km constants (already physical — reparameterize, don't reclassify)

`terrain-config.js`:

| Constant | Value | Tag | Note |
|---|---:|---|---|
| `PHASOR_WAVELENGTH_KM` | 55 | DISTANCE_KM | ridge spacing; compact profile target ~0.8 km |
| `PHASOR_BANDWIDTH_KM` | 180 | DISTANCE_KM | kernel envelope |
| `PHASOR_DIRECTION_SMOOTHING_KM` | 220 | DISTANCE_KM | smoothing radius (→passes via avgEdgeKm) |
| `DETAIL_NOISE_AMP_KM` | 0.10 | HEIGHT_KM | 100 m bump — **already km height** |
| `PHASOR_WARP_AMPLITUDE` | 0.006 | ANGLE_RAD | unit-sphere displacement (~38 km @ Earth); §7 warp risk |

These are the model to extend: physical km at the config layer, converted to angular/hops at use.

## 4. Resolution-scaled width / hop constants — `MESH_HOPS_LEGACY`

The `*_BASE` family is multiplied by a runtime `scaleFactor` (derived from `numRegions` vs a ~10K-region
reference) to hold physical width ~constant across Detail. Config comments confirm intent
(e.g. rift: "each constant times scaleFactor gives a hop count at the 10K-region reference; physically,
BASE × ~200 km"). **These represent physical DISTANCE_KM but are stored as reference hop counts.**
Migration (Phase 3): express each as `*_KM` and convert via `kmToApproxHops(km, meshMetrics)`.

Distance/zone widths: `INTERIOR_BAND_BASE(16)`, `TECTONIC_REACH_BASE(20)`, `COASTAL_PLAIN_WIDTH_BASE(18)`,
`COAST_BFS_WIDTH_BASE(8)`, `PLATEAU_START_BASE(3)`.
Mountain/ridge: `RIDGE_SIGMA_BASE(5)`, `RIDGE_PEAK_SHIFT_BASE(2)`, `RIDGE_EXTENT_BASE(10)`.
Rift: `RIFT_HALF_WIDTH_BASE(3.2)`, `RIFT_FLOOR_MULT(0.35)`, `RIFT_SHOULDER_INNER_MULT(0.5)`,
`RIFT_SHOULDER_OUTER_MULT(2.75)`.
Back-arc/foreland: `BACK_ARC_START_BASE(2)`, `BACK_ARC_PEAK_BASE(3)`, `BACK_ARC_END_BASE(5)`.
Margins: `SHELF_NARROW_BASE(4)`, `SHELF_WIDE_BASE(12)`, `SLOPE_WIDTH_BASE(7)`.
Mid-ocean: `RIDGE_HALF_WIDTH_BASE(4)`, `FRACTURE_HALF_WIDTH_BASE(3)`.
Coast/island/arc: `COAST_ROUGHEN_BASE(8)`, `ISLAND_DIST_BASE(4)`, `ARC_DIST_BASE(7)`,
`ARC_PEAK_DIST_BASE(2)`, `ARC_SIGMA_BASE_VAL(2)`.
Plate smoothing passes: `PLATE_SMOOTH_BASE(3)`, `PLATE_SMOOTH_LOW_T(2)`, `STRESS_DIR_SMOOTH_PASSES(2)`.

**UNCERTAIN / TODO(experiment):** the exact `scaleFactor` definition and its reference region count
(stated as ~10K) must be read from `elevation.js`/`generate.js` and confirmed empirically before the
km↔hops mapping is trusted. Do not assume `BASE × 200 km` is exact — verify against measured feature
widths at 200k/500k/1M (Phase 3 validation).

## 5. Normalized-elevation constants — `NORMALIZED_ELEVATION_LEGACY`

All height contributions/thresholds in `terrain-config.js` are internal normalized elevation, **not**
linear km (design §2.5 warns equal normalized increments ≠ equal km at plains vs peaks). Representative:
`RIFT_AXIS_DEPTH(-0.12)`, `RIFT_FLOOR_DEPTH(-0.08)`, `RIFT_SHOULDER_UPLIFT(0.50)`, `ABYSS_BASE(-0.35)`,
`SHELF_DEPTH_START(-0.08)`, `SLOPE_DEPTH_RANGE(0.19)`, `TRENCH_BASE_DEPTH(0.20)`, `PLATE_BASE_HEIGHT_MEAN(-0.15)`,
`INTERIOR_BASE_SHIELD(0.14)`, `INTERIOR_TECTONIC(0.16)`, `MAX_OCEAN_ARC_ELEV(0.60)` (comment "6 km"),
`FILL_LEVEL(0.005)`, the `HYPS_*` hypsometry breakpoints, and every `*_AMP`/`*_DEPTH`/`*_BOOST`/`*_UPLIFT`.

Migration (Phase 2): keep these normalized internally; introduce reversible
`elevNormToHeightKm` / `heightKmToElevNorm` with profile-defined endpoints, and do physical processes
(erosion, slope) in km. `MAX_OCEAN_ARC_ELEV` comment "6 km" is a **direct normalized↔km anchor** worth
using to calibrate the curve.

## 6. Slope-sensitive sites

| Site | Current | Tag | Migration |
|---|---|---|---|
| `HYDRAULIC_SLOPE_SENSITIVITY` (=50) | slope from normalized elev / ? | UNCERTAIN | Phase 6 — confirm rise/run units |
| `THERMAL_TRANSFER_FRAC` (=0.5) + thermal threshold | normalized talus | SLOPE_RATIO (legacy) | Phase 5 — replace with `talusAngleDeg` |
| deposition slope (`terrain-post.js`) | normalized | SLOPE_RATIO | Phase 6 — physical slope in km |

**UNCERTAIN / TODO(experiment):** thermal talus threshold value and the hydraulic slope units live in
`terrain-post.js` (not config) — must be read there (Phase 5/6) and classified against actual rise/run.

## 7. Rate / iteration constants — `RATE_PER_ITERATION`

`GLACIAL_CARVE_RATE(0.025)`, `GLACIAL_DEPOSIT_AMOUNT(0.007)`, `GLACIAL_FJORD_CARVE(0.020)`,
`HYDRAULIC_DEPOSIT_FRAC(0.5)`, `THERMAL_TRANSFER_FRAC(0.5)`, `STRESS_PASSES_PER_SPREAD(3)`,
`FLOOD_CARVE_RADIUS_FRAC(0.3)`. Iteration counts scaled by cell count are the resolution-dependence risk
(risks §"Resolution dependence"). `FLOOD_CARVE_RADIUS_FRAC` is path-length-derived → Phase 7 replaces with
`canyonCarveRadiusKm`.

## 8. Collision / stress math — mostly `DIMENSIONLESS` (keep)

`COLLISION_THRESHOLD`, `SUBDUCT_*`, `STRESS_DIR_*`, `STRESS_DECAY_*`, `PLATE_BLEND_T`, `SUPER_W`, `SMALL_W`,
`PLATE_*` physics, `MANTLE_*`, plate-rate constants: relative-motion / normalized thresholds. Design §5.2
says keep dimensionless unless a value represents travel distance. `COLLISION_DT_REF_REGIONS(10000)` is the
resolution reference — relevant to the `scaleFactor` question in §4.

## 9. Remaining `terrain-config.js` constants

The large majority (all `*_FREQ`, `*_AMP` noise, `*_MULT`, `*_FRAC`, `*_WEIGHT`, dome/LIP/hotspot shaping,
hypsometry powers) are `DIMENSIONLESS` shaping constants. Frequencies are unit-sphere frequencies
(design §6 "do not convert pure frequencies mechanically; replace with wavelength controls where possible").

## 10. Files touching scale (from grep sweep)

22 `js/` files reference `avgEdge`/`hops`/`numRegions`/km. Terrain-relevant: `elevation.js`,
`terrain-post.js`, `terrain-metrics.js`, `generate.js`, `plates.js`, `super-plates.js`, `coarse-plates.js`,
`plate-physics.js`, `sphere-mesh.js`, `planet-worker.js`, `ocean-land.js`. Climate (deferred): `wind.js`,
`temperature.js`, `precipitation.js`, `heuristic-precip.js`, `ocean.js`, `climate-*.js`, `koppen.js`.

## 11. Baseline artifacts — status & plan

**Blocker:** the headless harness (`tuning/render-harness.mjs`) uses **Puppeteer**, which is not installed
(no `node_modules`, no `package.json`), and the environment runs **Node v12.16.3**. Generation also isn't
pure-Node (needs the Web Worker + WebGL), so baselines must go through a browser.

**Plan (before any Phase 1 algorithm change):** capture deterministic baselines via a served instance +
browser automation, reading the existing `window.__terrainMetrics` scorecard and exporting heightmaps, for
fixed seeds `[42, 100, 200, 400]` at Detail ≈ Low/Med (and one High) — matching `render-harness.mjs` seeds.
Store under `tuning/baselines/earth/` as `seed-<n>_detail-<d>_metrics.json` + heightmap PNG. These are the
Earth-profile reference for the Phase 11 regression and the "legacy parity" gate.

## 12. Uncertain constants requiring experiment (do not guess)

1. `scaleFactor` exact formula + reference region count (§4) — read `elevation.js`/`generate.js`, verify empirically.
2. Thermal talus threshold + hydraulic slope units (§6) — read `terrain-post.js`.
3. `PHASOR_WARP_AMPLITUDE` true km at Earth radius vs the "~38 km" comment (§3/§7).
4. km↔hops conversion accuracy vs measured feature widths (§4) — Phase 3 validation.
5. Normalized-elevation → km curve endpoints; calibrate against `MAX_OCEAN_ARC_ELEV` "6 km" anchor (§5).

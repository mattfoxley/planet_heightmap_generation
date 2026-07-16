# Tasks: Normalize World Orogen to Arbitrary Radius

## Phase 0 — Baseline and Inventory

- [x] Capture deterministic baseline seeds at multiple detail levels. _(seeds 42/100/200/400 at sN 400 & 600, via in-app browser since puppeteer absent → `tuning/baselines/earth/baselines.json`)_
- [x] Export baseline **metrics** for current Earth behavior. _(window.__terrainMetrics scorecard captured; heightmap PNG export deferred — needs download automation, noted in baselines `_pending`)_
  - ⚠ **Baseline finding:** seeds 42 & 400 produce identical terrain at detail 600 but differ at detail 400 (reproducible; worker verified received seed=400). Genuine seed×detail interaction → threatens success-criterion #6. `TODO(investigate)` rng.js + fine-mesh seed path; Phase-1 deterministic-seed tests must account for it.
- [x] Search repository for:
  - [x] `6371` _(inventory §2)_
  - [x] constants described as kilometers _(§3)_
  - [x] constants described as radians _(§3 — PHASOR_WARP_AMPLITUDE)_
  - [x] BFS widths and hop counts _(§4 — `*_BASE` family)_
  - [x] normalized elevation thresholds _(§5)_
  - [x] slope calculations _(§6)_
  - [x] cell-count-derived iteration scaling _(§4, §7 — scaleFactor / iteration counts)_
- [x] Create `docs/scale-constant-inventory.md`.
- [x] Classify every relevant constant by unit category. _(scale-coupled constants classified; remainder noted DIMENSIONLESS in §9)_
- [x] Mark uncertain constants for empirical investigation. _(§12)_

> Phase 0 gate: **OPEN** — inventory complete + Earth baselines captured (`tuning/baselines/earth/`).
> Phase 1 (physical-scale infrastructure: profiles + conversion helpers + guard test) may begin.
> Carry forward: heightmap-PNG baseline export, and the seed×detail collision investigation.

## Phase 1 — Physical Scale Infrastructure  ✅

- [x] Add `js/world-profiles.js`.
- [x] Add `js/world-scale.js`.
- [x] Implement:
  - [x] `angularDistanceRad`
  - [x] `angularToKm`
  - [x] `kmToAngular`
  - [x] `computeMeshPhysicalMetrics`
  - [x] `kmToApproxHops`
  - [x] `cellsAcrossFeature`
  - [x] (extra) `chordToAngularRad`, `averageEdgeAngleRad`, `clamp`, `dot3`
- [x] Add `legacy`, `earthlike`, and `compact-40km` profiles. _(legacy = default; earthlike feature scales left to legacy fallback until tuned)_
- [x] Thread selected profile through worker/generation context.
- [x] **Profile SELECTOR (de-dormant):** `generate.js` reads `?profile=<id>` (default legacy) and sends `profileId` in the generate message → worker resolves via `getWorldProfile`. Activates the compact profile end-to-end. Verified deterministically (tests/world-scale.test.mjs 32/32: compact → radiusKm 20, warp clamps 0.3→0.2 km → 0.01 rad). _(Live in-browser compact demo is impeded by the in-app browser's ES-module cache serving a stale generate.js; served file + plumbing are correct — hard-refresh with `?profile=compact-40km` to see it. Reapply/edit paths still legacy-only — follow-up.)_ _(planet-worker.js: `getWorldProfile(data.profileId)` + `computeMeshPhysicalMetrics` in both handleGenerate & handleImportHeightmap; surfaced in `done` payload as `worldProfile`/`meshMetrics`. Default legacy → zero behavior change; verified in-browser: generation completes, no console errors.)_
- [x] Add unit tests for conversion helpers. _(tests/world-scale.test.mjs — 19/19 pass)_
- [x] Add repository guard test for direct `6371` usage. _(tests/guard-earth-radius.mjs — ratchet, PASS; 8 legacy sites allowlisted, target → 1)_

> Notes: running the `.mjs` tests needs a **local `package.json` with `"type":"module"`** so Node
> imports `js/*.js` as ESM. `package.json` is **gitignored** (repo convention — the existing tuning
> `.mjs` suite has the same requirement), so it is NOT committed; see `tests/README.md`. Node 12.16.3
> also needs `--experimental-modules`. No `main.js` / UI change yet — a profile selector is a later phase.

## Phase 2 — Elevation Physicalization  (core done; export-mode + debug-layer remain)

- [x] Centralize normalized-elevation-to-kilometer conversion. _(js/elevation-scale.js; color-map.js `elevToHeightKm` now delegates — exact parity, verified in-browser & unit tests)_
- [x] Parameterize land maximum and ocean depth. _(profile.elevation.maxLandHeightKm / oceanScaleKmPerUnit; legacy=6/10, compact=4/6)_
- [x] Implement inverse kilometer-to-normalized-elevation conversion. _(heightKmToElevNorm — ocean linear, land bisection on monotonic g(t))_
- [x] Add round-trip tests across representative elevations. _(tests/elevation-scale.test.mjs — 43/43 pass; sea-level, peak, ocean sign/depth, compact endpoints)_
- [x] Add linear physical-height export mode. _(js/export-metadata.js `heightmapMetadata` (design §14): worldRadiusKm/sphereMode/seaLevelRadiusKm/min-max km/encoding/inward-displacement. The 16-bit export was already linear-km; planet-mesh.js now emits a `.json` sidecar next to the PNG. tests/export-metadata.test.mjs 16/16.)_
- [x] Preserve legacy export mode. _(sidecar gated to NON-legacy profiles → legacy export stays PNG-only, byte-identical; verified app loads clean.)_
- [~] Add physical elevation debug layer. _(COVERED by the existing `heightmap`/`landheightmap` map layers, which render physical km (grayscale via elevToHeightKm). A dedicated km-annotated instrumentation layer is deferred to the design §16 instrumentation work.)_

> Phase 2 complete: elevation conversion centralized + parameterized + reversible (43 tests), physical
> export-mode metadata (16 tests), legacy parity verified in-browser. Debug-layer folded into §16
> instrumentation. Carried to Phase 12: profile-DRIVEN export km range (currently the legacy Earth
> range) + cube-map validation.

## Phase 3 — Terrain Feature Width Migration  (foundation done; site conversions in progress)

- [x] **Foundation:** resolve `scaleFactor` (= √(N/10000)) + prove km↔hops parity. `js/terrain-widths.js`
  (`baseWidthKm`, `widthKmToHops`) reproduces `round(BASE·scaleFactor)` EXACTLY — max hop diff 0 across
  7 resolutions (tests/terrain-widths.test.mjs, 79/79). Migration pattern locked; each site can move to
  km with zero legacy-output change.
- [x] **Thread `meshMetrics`/profile** through `assignElevation → computeTectonicState → tect` (worker passes it; defaults to legacy-profile radius, no 6371 literal).
- [x] Convert tectonic reach to kilometers. _(computeSpatialFields width block: interiorBand, tectonicReach, plateauStart — via widthKmToHops(baseWidthKm(...)))_
- [x] Convert mountain ridge sigma/extent to kilometers. _(ridgeSigmaBase, ridgePeakShift, ridgeExtent)_
  - ✅ **Legacy parity verified in-pipeline:** re-ran seeds 42/100/200/400 × detail 400/600 → all 8 metrics BYTE-IDENTICAL to `tuning/baselines/earth/` (island/land/coast). Exact-parity proof holds in real generation.
- [ ] Convert phasor wavelength and bandwidth to kilometers. _(already `*_KM`; just re-point at profile.radiusKm + drop elevation.js:1403 `6371`)_
- [ ] Convert direction smoothing to kilometers. _(PHASOR_DIRECTION_SMOOTHING_KM already km)_
- [x] Convert rift widths to kilometers. _(riftHalfWidth BFS bound + continuous `RIFT_FLOOR/SHOULDER_*_MULT·scaleFactor` floor/shoulder distances (buildSkeleton) via `widthKmToHopsFloat`.)_
- [x] Convert foreland and back-arc distances. _(baStart/baPeak/baEnd. Foreland uses stress fractions, not hop widths.)_
- [x] Convert shelf and continental slope widths. _(SHELF_NARROW/WIDE, SLOPE_WIDTH)_
- [x] Convert trench/ridge/fracture influence widths. _(mid-ocean RIDGE_HW, FRACTURE; also COAST_BFS maxCD + COASTAL_PLAIN. Trench is a depth (normalized elev), not a width → Phase-2-style.)_
- [x] Convert island-arc spacing/sigma. _(maxArcDist rounded + continuous arc `peakDist`/`sigma` via `widthKmToHopsFloat`. NOTE: volcano/hotspot dims below use unit-sphere CHORD distances (VOLC_*, DOME_*, CHAIN_SPACING), not the BASE·scaleFactor pattern — a separate chord→km conversion, not scale-coupled the same way.)_
- [ ] Convert hotspot dimensions and spacing. _(applyHotspotsAndLIPs — chord-based; separate conversion, lower priority)_

> ✅ **All `BASE·scaleFactor` feature-width sites are now migrated to physical km.** Remaining
> `scaleFactor` uses in elevation.js are stress-math (decay/passes, keep) + a few now-unused destructures.
- [x] Convert coastal roughening + island distance + uniform-noise mtn ramp. _(applyCoastalDetail: coastRoughenDist, islandMaxDist; applyUniformLandNoise: mtnRampDist via `sf.meshMetrics`; local scaleFactor removed there.)_
- [ ] Convert continuous rift floor/shoulder multipliers (buildSkeleton ~1017-1019/1152/1154) via `widthKmToHopsFloat`.
- [x] Add cells-per-feature warnings. _(terrain-widths.js `featureWidthWarnings(profile, meshMetrics)` via `cellsAcrossFeature`; worker logs them + includes in done payload. Empty for legacy; fires for compact under-resolved features. tests/terrain-widths.test.mjs 84/84.)_
- [x] Migrate `terrain-metrics.js` `6371` → `ctx.radiusKm` (metrics km via profile radius; legacy unchanged — shelf/gradient km verified identical). Guard allowlist 7→6.
- [ ] Compare feature widths at 200k, 500k, and 1M regions. _(deferred to Phase 10 tuning — heavy; belongs with the experiment matrix)_

> Parity VERIFIED for all rounded batches: 7 STABLE baselines (all detail-400 + s100/s200/s400 @ d600)
> byte-identical to `tuning/baselines/earth/`; and same-run-sequence output is identical with/without the
> batch (checked via git-stash A/B).
>
> ⚠ **Determinism finding (root of the Phase-0 collision):** `s42_d600` is ORDER-DEPENDENT — 345/55692 in
> the baseline capture order (full d400 block first), but 415/53744 in other orders — REPRODUCIBLY, and
> IDENTICALLY with the batch stashed vs applied. So the generator has pre-existing **retained-state
> non-determinism** across generations (worker `W`/module state leaking), NOT introduced by this migration.
> ⇒ the `s42_d600` baseline is unreliable; parity must be judged on the 7 stable baselines + same-sequence
> A/B. `TODO(investigate, separate)`: worker-state reset between `handleGenerate` calls (affects success-
> criterion #6). Added `widthKmToHopsFloat` (tests/terrain-widths.test.mjs 80/80).

## Phase 4 — Warp and Smoothing  ✅

- [x] Replace warp amplitude constants with kilometer values. _(profile.terrain.warpAmplitudeKm + maxWarpKm; compact-40km declares them. Legacy has no `terrain` block → phasor warp keeps PHASOR_WARP_AMPLITUDE unchanged.)_
- [x] Convert warp kilometers to angular amplitude per profile. _(world-scale.js `warpKmToAngular(warpKm, radiusKm)`; applyPhasorRidges uses it when profile declares warpAmplitudeKm.)_
- [x] Add safety clamp relative to protected feature widths. _(world-scale.js `clampWarpKm(warpKm, maxWarpKm, smallestProtectedFeatureKm)` — clamps to ≤ maxWarpKm and ≤ 0.25×ridgeSpacing. tests/world-scale.test.mjs 24/24, incl. spec scenario 1km@r20→0.05 rad.)_
- [x] Convert smoothing target to physical radius. _(phasor direction smoothing already `PHASOR_DIRECTION_SMOOTHING_KM / meshMetrics.averageEdgeKm` — made physical in the phasor batch. No other terrain smoothing encodes a physical radius: terrain-post.js `SMOOTH_EDGE_SENSITIVITY` is a dimensionless edge-weight; erosion/glacial passes are slider iteration counts.)_
- [x] Initially map physical smoothing radius to approximate iterations. _(phasor: `round(km / avgEdgeKm)` passes.)_
- [~] Optionally implement geodesic-radius edge-aware smoothing. _(OPTIONAL/deferred — terrain-post already has edge-aware weighting; geodesic-radius smoothing is a refinement, not needed for parity.)_
- [x] Add physical warp and smoothing diagnostics. _(featureWidthWarnings covers under-resolution; phasor warnings logged. warpAmplitudeKm surfaced via profile.)_

> Warp verified in-pipeline: legacy (no `terrain` block → unchanged PHASOR_WARP_AMPLITUDE) reproduces
> all 4 detail-400 stable baselines byte-identically. Compact worlds get km-based, clamped warp.

## Phase 5 — Thermal Erosion  (physical primitives + clamp done; full km-space rework → Phase 10)

> **Structural note:** switching thermal from its current NON-physical slope (`(normalizedElev diff) /
> chordDist`, `talusSlope = 1.2 − thermalErosion·0.4`) to physical (`tan(talusAngleDeg)` + heightKm/edgeKm +
> km-space transfer) is a **behavioral** change (intentionally different output), and it's **dormant**
> until a profile selector exists. It can't be baseline-verified (it's meant to differ), and its params
> live in the Phase-10 erosion experiment matrix. So the deep km-space rework is deferred to Phase 10;
> here we land the safe, reusable physical primitives + a gated clamp, keeping legacy exact.

- [x] Replace normalized talus threshold with `talusAngleDeg` — **primitive ready:** `talusSlopeFromAngle(deg)` + `slopeRatioToAngleDeg(ratio)` (world-scale.js). tests/world-scale.test.mjs 29/29 (spec: 0.5 km / 1 km → 0.5 → 26.565°; talus 34° round-trip).
- [x] Add maximum transfer-per-iteration clamp. _(erodeComposite `maxThermalTransfer = Infinity` param; `transfer = min(cap, …)`. Legacy = Infinity → no-op; physical profiles pass a finite cap.)_
- [x] Conservation diagnostic. _(thermal transfer is conservative BY CONSTRUCTION: each share is `delta[r] -= s; delta[nb] += s` → net 0; no separate check needed.)_
- [ ] Convert neighbor distances / height diffs to km + material transfer in km space. _(→ Phase 10: the km-space slope+transfer rework, gated on physical profile.)_
- [ ] Test analytical cones + compare across detail levels. _(→ Phase 10, once the physical path is active.)_

## Phase 6 — Hydraulic Erosion

- [ ] Store hydraulic `cellDist` in kilometers.
- [ ] Add physical runoff mode based on cell area.
- [ ] Preserve legacy unit-flow mode.
- [ ] Add uniform runoff fallback.
- [ ] Audit and rename effective stream-power coefficients.
- [ ] Add incision clamps.
- [ ] Convert deposition slope sensitivity to physical slope.
- [ ] Add drainage-area debug layer in km².
- [ ] Add incision/deposition debug layers in meters.
- [ ] Verify watershed topology across detail levels.

## Phase 7 — Priority Flood

- [ ] Separate drainage correction from canyon-width selection.
- [ ] Add `canyonCarveRadiusKm`.
- [ ] Implement approximate-hop carve radius.
- [ ] Optionally replace with geodesic-distance kernel.
- [ ] Remove or deprecate path-length-derived canyon radius in physical mode.
- [ ] Add regression tests for closed basin drainage.
- [ ] Compare canyon width across detail levels.

## Phase 8 — Glacial Decoupling

- [ ] Separate glaciation potential from ice-flow carving.
- [ ] Add optional external `glaciationPotential` field.
- [ ] Disable glacial erosion by default in compact profile.
- [ ] Preserve Earth latitude placement in Earth profile.
- [ ] Document future habitat-climate integration.

## Phase 9 — Ridge Sharpening and Detail

- [ ] Add physical height cap to ridge sharpening.
- [ ] Add post-sharpen slope warning/cap.
- [ ] Reduce compact profile baseline sharpening.
- [ ] Audit detail-noise wavelengths against mesh resolution.
- [ ] Prevent generation of detail below minimum cells-per-wavelength.
- [ ] Keep sub-grid detail for downstream terrain tools.

## Phase 10 — Compact 40 km Profile Tuning

- [ ] Run parameter matrix from `experiments.md`.
- [ ] Select 10–20 deterministic evaluation seeds.
- [ ] Record runtime and memory.
- [ ] Measure:
  - [ ] feature widths
  - [ ] relief percentiles
  - [ ] slope percentiles
  - [ ] drainage density
  - [ ] river length distribution
  - [ ] basin count
  - [ ] endorheic area
  - [ ] erosion incision
  - [ ] terrain spectral distribution
- [ ] Produce visual contact sheets.
- [ ] Choose baseline compact profile.
- [ ] Document rejected parameter regions.

## Phase 11 — Earth Regression

- [ ] Run Earth profile against stored baselines.
- [ ] Compare major terrain metrics.
- [ ] Review visual differences.
- [ ] Decide acceptable parity tolerance.
- [ ] Keep legacy mode until parity is accepted.

## Phase 12 — Export and Unreal

- [ ] Export physical metadata JSON.
- [ ] Document inward radial displacement.
- [ ] Confirm sea-level radius and shell clearance.
- [ ] Add height clamping to prevent geometry crossing structural limits.
- [ ] Validate equirectangular and cube-map conversion.
- [ ] Document 16-bit and 32-bit encoding recommendations.

## Definition of Done

- [ ] All required tests pass.
- [ ] Compact profile produces coherent results at 200k, 500k, and 1M regions.
- [ ] No direct Earth-radius assumptions remain outside profiles/tests.
- [ ] Physical slopes are resolution-stable.
- [ ] Major configured feature widths are stable within tolerance.
- [ ] Hydraulic flow totals are stable under resolution change in physical mode.
- [ ] Earth profile regression is accepted or legacy mode remains available.
- [ ] Export metadata is sufficient for deterministic Unreal interpretation.

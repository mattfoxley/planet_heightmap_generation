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
- [x] **Profile SELECTOR (de-dormant):** `generate.js` reads `?profile=<id>` (default legacy) and sends `profileId` in the generate message → worker resolves via `getWorldProfile`. Activates the compact profile end-to-end. Verified deterministically (tests/world-scale.test.mjs 32/32: compact → radiusKm 20, warp clamps 0.3→0.2 km → 0.01 rad).
- [x] **Compact feature-km wiring (Phase-10 viability slice):** `featureHops(profileKm, legacyBase, meshMetrics, floor)` in terrain-widths.js reads the profile's declared physical km when present, else the legacy `BASE` (legacy byte-identical, tests 123/0, max hop diff 0). Wired 5 macro width sites in elevation.js: `tectonicReach`→`mountainInfluenceKm` (9), `ridgeExtent`→`ridgeEnvelopeKm` (2.5), `coastPlainWidth`→`coastalPlainWidthKm` (1.5), shelf→`shelfWidthKm` (0.8), slope→`continentalSlopeWidthKm` (0.8). Interdependent rift-internal geometry left on legacy → full Phase 10.
  - ✅ **LIVE VERIFIED** (threaded http server; single-threaded `python -m http.server` deadlocks the module worker). Controlled A/B, seed 42 @ detail 400: sent-message confirms `profileId:"compact-40km"`; compact vs Earth baseline — `shelf_width_active_km` **1 vs 455** (radius 20 flows to metrics), `island_count` **56 vs 74** (feature-km changes terrain), land 8055 vs 8128. Compact planet renders cleanly (screenshot). Experiment is viable.
  - Remaining for full Phase 10: rift-internal geometry, interiorBand/plateauStart/ridge-sigma/back-arc/arc/island widths, basinScale, foothillReach; reapply/edit worker paths (still legacy-only). _(planet-worker.js: `getWorldProfile(data.profileId)` + `computeMeshPhysicalMetrics` in both handleGenerate & handleImportHeightmap; surfaced in `done` payload as `worldProfile`/`meshMetrics`. Default legacy → zero behavior change; verified in-browser: generation completes, no console errors.)_
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
- [x] Convert phasor wavelength and bandwidth to kilometers. _(elevation.js:1397-1398 `PHASOR_WAVELENGTH_KM / meshMetrics.radiusKm`, `PHASOR_BANDWIDTH_KM / meshMetrics.radiusKm`; zero `6371` left in elevation.js — guard no longer allowlists it.)_
- [x] Convert direction smoothing to kilometers. _(elevation.js:1415 `PHASOR_DIRECTION_SMOOTHING_KM / avgEdgeKm`.)_
- [x] Convert rift widths to kilometers. _(riftHalfWidth BFS bound + continuous `RIFT_FLOOR/SHOULDER_*_MULT·scaleFactor` floor/shoulder distances (buildSkeleton) via `widthKmToHopsFloat`.)_
- [x] Convert foreland and back-arc distances. _(baStart/baPeak/baEnd. Foreland uses stress fractions, not hop widths.)_
- [x] Convert shelf and continental slope widths. _(SHELF_NARROW/WIDE, SLOPE_WIDTH)_
- [x] Convert trench/ridge/fracture influence widths. _(mid-ocean RIDGE_HW, FRACTURE; also COAST_BFS maxCD + COASTAL_PLAIN. Trench is a depth (normalized elev), not a width → Phase-2-style.)_
- [x] Convert island-arc spacing/sigma. _(maxArcDist rounded + continuous arc `peakDist`/`sigma` via `widthKmToHopsFloat`. NOTE: volcano/hotspot dims below use unit-sphere CHORD distances (VOLC_*, DOME_*, CHAIN_SPACING), not the BASE·scaleFactor pattern — a separate chord→km conversion, not scale-coupled the same way.)_
- [ ] Convert hotspot dimensions and spacing. _(applyHotspotsAndLIPs — chord-based; separate conversion, lower priority)_

> ✅ **All `BASE·scaleFactor` feature-width sites are now migrated to physical km.** Remaining
> `scaleFactor` uses in elevation.js are stress-math (decay/passes, keep) + a few now-unused destructures.
- [x] Convert coastal roughening + island distance + uniform-noise mtn ramp. _(applyCoastalDetail: coastRoughenDist, islandMaxDist; applyUniformLandNoise: mtnRampDist via `sf.meshMetrics`; local scaleFactor removed there.)_
- [x] Convert continuous rift floor/shoulder multipliers (buildSkeleton 1017-1019/1152/1154) via `widthKmToHopsFloat`. _(all use `widthKmToHopsFloat(baseWidthKm(RIFT_*_MULT, radiusKm), meshMetrics)`; verified.)_
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

## Phase 6 — Hydraulic Erosion  (physical primitives + plumbing + gated clamp done; behavioral rework → Phase 10)

> **Structural note (same pattern as Phase 5):** switching hydraulic flow from legacy unit-flow
> (`flow=1`) to physical (`cellAreaKm2·runoff`) is a **behavioral** change that also requires recalibrating
> the effective `K`, and it can't be baseline-verified (it's meant to differ). So the deep physical-runoff
> rework + K recalibration + watershed verification live in the Phase-10 experiment matrix. Here we land the
> safe, reusable **physical primitives** (`js/erosion-scale.js`, unit-tested), thread `profile`/`meshMetrics`
> into the erosion path, add a **gated incision clamp** (default no-op), and declare the compact erosion
> fields — keeping legacy **byte-identical**.

- [x] Store hydraulic `cellDist` in kilometers — **primitive ready:** `erosion-scale.js chordDistToKm(chord, radiusKm)` (neighborDist is unit-sphere chord → angular → km). tests/erosion-scale.test.mjs.
- [~] Add physical runoff mode based on cell area — **primitive ready:** `physicalFlowInit(cellAreaKm2, runoff)` (design §8.3). Application (replacing `flow=1`) + K recalibration → Phase 10.
- [x] Preserve legacy unit-flow mode. _(default path unchanged — `flow[r]=1`; physical mode is opt-in and dormant. Legacy s42_d400 verified byte-identical in-browser: 74/8128/455/coast 19.2889.)_
- [x] Add uniform runoff fallback. _(`resolveUniformRunoff(profile)` → compact `erosion.uniformRunoff=0.35`; legacy/earthlike → null → keeps unit flow. design §8.3.)_
- [ ] Audit and rename effective stream-power coefficients. _(→ Phase 10, with the physical-flow K recalibration; `K` stays a calibrated effective coefficient per design §8.4.)_
- [x] Add incision clamps — **primitive + gated hook:** `clampIncisionKm(deltaKm, maxIncisionKm, localReliefKm, maxReliefFrac)`; `erodeComposite` gained `maxIncisionNorm=Infinity` (mirrors thermal `maxThermalTransfer`), wired into the hydraulic solve. Default Infinity → legacy no-op. Compact declares `maxIncisionKmPerIteration=0.05`, `maxReliefFractionPerIteration=0.35` (activated in Phase 10 when physical erosion mode enables).
- [~] Convert deposition slope sensitivity to physical slope — **primitive ready:** `physicalSlopeKm(hKmA, hKmB, distKm)` (design §8.5). Application in the deposition step → Phase 10 (needs km-height + km-dist in the hot loop).
- [ ] Add drainage-area debug layer in km². _(→ Phase 10 / §16 instrumentation.)_
- [ ] Add incision/deposition debug layers in meters. _(→ Phase 10 / §16 instrumentation.)_
- [ ] Verify watershed topology across detail levels. _(→ Phase 10, once physical mode is active.)_

> Phase 6 foundation complete: `erosion-scale.js` (5 primitives, tests/erosion-scale.test.mjs 19/19),
> `profile`/`meshMetrics` threaded through `runPostProcessing`→`erodeComposite` (+ retained on `W` for
> reapply/edit), gated incision clamp (dormant), compact erosion fields declared. Legacy byte-identical
> (verified in-browser). Behavioral rework deferred to Phase 10 per the design.

## Phase 7 — Priority Flood  (canyon-width decoupling done; geodesic kernel + full-pipeline regression → Phase 10)

- [x] Separate drainage correction from canyon-width selection. _(priorityFloodCarve: the carve **radius** (canyon width) is now an explicit parameter, no longer read from the drainage **path length**. Pit-fill/drainage logic unchanged.)_
- [x] Add `canyonCarveRadiusKm`. _(compact profile already declares `erosion.canyonCarveRadiusKm = 0.20`.)_
- [x] Implement approximate-hop carve radius. _(design §8.6 transitional: `kmToApproxHops(canyonCarveRadiusKm, meshMetrics)` → threaded runPostProcessing→erodeComposite→priorityFloodCarve as `carveRadiusHops`. Selection primitive `canyonCarveRadiusHops()` in erosion-scale.js.)_
- [ ] Optionally replace with geodesic-distance kernel. _(OPTIONAL refinement — deferred; the path-index kernel is the design's accepted transitional impl.)_
- [x] Remove or deprecate path-length-derived canyon radius in physical mode. _(when `carveRadiusHops` is supplied it fully overrides the path-length fraction; legacy keeps path-length as the documented fallback.)_
- [~] Add regression tests for closed basin drainage. _(primitive-level regression added: tests/erosion-scale.test.mjs `canyonCarveRadiusHops` (legacy-identity across path lengths + physical override). Full closed-basin pipeline regression needs the worker → Phase 10 / §16.)_
- [ ] Compare canyon width across detail levels. _(→ Phase 10 experiment matrix.)_

> Phase 7 core complete: canyon width decoupled from drainage-path length; physical carve radius wired
> (dormant until Phase 10 enables physical erosion — legacy AND current compact byte-identical, verified
> in-browser legacy s42_d400 = 74/8128/455/19.2889). erosion-scale.js tests 29/29.

## Phase 8 — Glacial Decoupling  ✅

- [x] Separate glaciation potential from ice-flow carving. _(erodeComposite: glacier PLACEMENT (`glacIdx`) is now sourced independently — external field OR the legacy latitude model — while the ice-flow accumulation/carving/moraine/fjord logic below is unchanged.)_
- [x] Add optional external `glaciationPotential` field. _(erodeComposite gains `glaciationPotential = null`; when non-null it drives placement directly. No source wired yet (awaits habitat-climate) → passes null → legacy latitude model.)_
- [x] Disable glacial erosion by default in compact profile. _(compact declares `glacial: { enabled: false }`; runPostProcessing computes `effGlacial = glacialAllowed ? glacialErosion : 0` → gIters 0 → glacial step skipped. Earth latitude placement is invalid on an interior sphere.)_
- [x] Preserve Earth latitude placement in Earth profile. _(legacy/earthlike declare no `glacial` block → enabled + `glaciationPotential=null` → the original latitude+elevation `glacIdx` runs. Verified in-browser: legacy s42_d400 = 74/8128/455/coast 19.2889 byte-identical — glacial runs at strength 0.5 in that baseline.)_
- [x] Document future habitat-climate integration. _(design §10 already lists sources; code comments in erodeComposite + world-profiles.js compact `glacial` block point to the `glaciationPotential` hook.)_

> Phase 8 complete: placement/carving decoupled, external-potential hook added (dormant), compact glacial
> disabled, Earth latitude preserved (byte-identical). No new primitive (refactor + profile flag).

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

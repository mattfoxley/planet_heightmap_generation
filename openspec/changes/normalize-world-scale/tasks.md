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
- [x] Thread selected profile through worker/generation context. _(planet-worker.js: `getWorldProfile(data.profileId)` + `computeMeshPhysicalMetrics` in both handleGenerate & handleImportHeightmap; surfaced in `done` payload as `worldProfile`/`meshMetrics`. Default legacy → zero behavior change; verified in-browser: generation completes, no console errors.)_
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
- [ ] Add linear physical-height export mode. _(planet-mesh.js — next)_
- [ ] Preserve legacy export mode. _(legacy export currently unchanged; formalize alongside the new mode)_
- [ ] Add physical elevation debug layer. _(worker debugLayers + UI — next)_

> Core conversion (centralize + parameterize + inverse + tests) complete & legacy-parity verified.
> Remaining: linear-physical-km export mode + metadata JSON (design §14) and the physical-elevation
> debug layer — both additive, touch the export path / UI.

## Phase 3 — Terrain Feature Width Migration

- [ ] Convert tectonic reach to kilometers.
- [ ] Convert mountain ridge sigma/extent to kilometers.
- [ ] Convert phasor wavelength and bandwidth to kilometers.
- [ ] Convert direction smoothing to kilometers.
- [ ] Convert rift widths to kilometers.
- [ ] Convert foreland and back-arc distances.
- [ ] Convert shelf and continental slope widths.
- [ ] Convert trench/ridge/fracture influence widths.
- [ ] Convert island-arc and volcano spacing/sigma.
- [ ] Convert hotspot dimensions and spacing.
- [ ] Add cells-per-feature warnings.
- [ ] Compare feature widths at 200k, 500k, and 1M regions.

## Phase 4 — Warp and Smoothing

- [ ] Replace warp amplitude constants with kilometer values.
- [ ] Convert warp kilometers to angular amplitude per profile.
- [ ] Add safety clamp relative to protected feature widths.
- [ ] Convert smoothing target to physical radius.
- [ ] Initially map physical smoothing radius to approximate iterations.
- [ ] Optionally implement geodesic-radius edge-aware smoothing.
- [ ] Add physical warp and smoothing diagnostics.

## Phase 5 — Thermal Erosion

- [ ] Convert neighbor distances to kilometers.
- [ ] Convert local height differences to kilometers.
- [ ] Replace normalized talus threshold with `talusAngleDeg`.
- [ ] Perform material transfer in kilometer space.
- [ ] Add maximum transfer-per-iteration clamp.
- [ ] Add conservation diagnostic for transferred material.
- [ ] Test analytical cones/slopes below and above talus threshold.
- [ ] Compare results across detail levels.

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

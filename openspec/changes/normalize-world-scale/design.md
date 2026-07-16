# Design: Radius-Normalized Physical Terrain Generation

## 1. Design Principles

### 1.1 Preserve topology, replace hidden scale

Keep the following systems topological or dimensionless where possible:

- unit-sphere positions
- adjacency
- plate ownership
- plate boundary classification
- drainage graph ordering
- connected-component analysis
- stress direction
- masks and normalized weights

Convert only where physical interpretation is required:

- distance
- width
- area
- height
- slope
- erosion rate
- sediment volume proxy
- smoothing radius

### 1.2 Radius does not define geology by itself

World radius determines total available surface geometry. It must not automatically define every feature size.

A world profile should explicitly define its geological vocabulary:

- number of large tectonic domains
- number of minor plates
- expected mountain-belt scale
- ridge scale
- basin scale
- rift scale
- typical and exceptional relief
- erosion maturity

### 1.3 Maintain scale hierarchy

Every profile must maintain separation between:

1. planetary/domain scale
2. regional tectonic scale
3. landscape scale
4. local valley/ridge scale
5. unresolved downstream detail

For the 20 km-radius profile, initial target hierarchy:

| Level | Target scale |
|---|---:|
| World circumference | 125.66 km |
| Major tectonic domain | 20–60 km |
| Mountain influence zone | 6–14 km |
| Main mountain belt | 4–10 km |
| Internal ridge spacing | 0.5–1.5 km |
| Major valley width | 0.2–1.0 km |
| Global-generator fine detail | 0.08–0.30 km |
| Downstream local detail | below 0.08–0.15 km |

## 2. Coordinate and Unit Model

### 2.1 Canonical geometry

Continue storing mesh positions as normalized Cartesian vectors:

```js
r_xyz = [x, y, z]; // unit length
```

### 2.2 Angular distance

Use robust angular distance for physical calculations:

```js
export function angularDistanceRad(a, b) {
  const dot = clamp(dot3(a, b), -1, 1);
  return Math.acos(dot);
}
```

For neighboring points, chord-to-angle conversion may be used:

```js
angle = 2 * Math.asin(clamp(chordLength * 0.5, 0, 1));
```

### 2.3 Horizontal physical distance

```js
distanceKm = angleRad * world.radiusKm;
```

Never multiply by `6371` directly outside the Earth profile.

### 2.4 Cell area

First-order equal-area approximation:

```js
cellAreaKm2 = 4 * Math.PI * radiusKm ** 2 / numRegions;
```

Optional later refinement may use Voronoi spherical cell areas.

### 2.5 Elevation

Introduce explicit conversion helpers:

```js
elevNormToHeightKm(elevNorm, elevationProfile)
heightKmToElevNorm(heightKm, elevationProfile)
```

Do not assume normalized land elevation is linear. Preserve the existing shaping curve initially, but parameterize its endpoints.

Recommended first implementation:

```js
if (elevNorm <= 0) {
  return -maxOceanDepthKm * clamp(-elevNorm / oceanNormDepth, 0, 1);
}

const t = clamp(elevNorm / landNormPeak, 0, 1);
return maxLandHeightKm * landHypsometricCurve(t);
```

The inverse must be numerically stable and tested.

### 2.6 Scalar height semantics for an interior sphere

Internally:

- higher scalar elevation always means uphill
- drainage always moves toward lower scalar elevation
- positive elevation remains land above sea level
- negative elevation remains ocean depth

At rendering/export:

```js
radialDistanceFromCenter =
  seaLevelRadiusKm - heightKm;
```

This inversion belongs outside erosion and hydrology.

## 3. Configuration Architecture

Create:

```text
js/world-scale.js
js/world-profiles.js
```

Suggested shape:

```js
export const DEFAULT_WORLD_PROFILE = {
  id: "earthlike",
  radiusKm: 6371,
  elevation: { ... },
  tectonics: { ... },
  terrain: { ... },
  erosion: { ... },
  climate: { ... },
  validation: { ... }
};
```

Compact profile:

```js
export const COMPACT_40KM_PROFILE = {
  id: "compact-40km",
  radiusKm: 20,
  diameterKm: 40,

  elevation: {
    maxOceanDepthKm: 2.0,
    typicalLandKm: 0.25,
    typicalMountainKm: 1.5,
    exceptionalPeakKm: 4.0,
    hardPeakClampKm: 4.25
  },

  tectonics: {
    plateCountRange: [8, 18],
    initialPlateCount: 12,
    superPlateCountRange: [3, 6],
    initialSuperPlateCount: 4,
    stressReachKm: 8.0,
    mountainBeltHalfWidthKm: 4.0,
    mountainInfluenceKm: 9.0,
    riftFloorHalfWidthKm: 0.75,
    riftShoulderInnerKm: 1.5,
    riftShoulderOuterKm: 3.5
  },

  terrain: {
    ridgeSpacingKm: 0.8,
    ridgeEnvelopeKm: 2.5,
    ridgeDirectionSmoothingKm: 4.0,
    foothillReachKm: 3.5,
    coastalPlainWidthKm: 1.5,
    shelfWidthKm: 0.8,
    continentalSlopeWidthKm: 0.8,
    basinScaleKm: 8.0,
    detailMinWavelengthKm: 0.12
  },

  erosion: {
    talusAngleDeg: 34,
    smoothingRadiusKm: 0.15,
    canyonCarveRadiusKm: 0.20,
    hydraulicLengthScaleKm: 1.0,
    minimumRiverWidthKm: 0.10
  }
};
```

All initial values are experimental defaults, not claims of physical correctness.

## 4. Parameter Classification

Every constant in `terrain-config.js`, `climate-config.js`, and erosion code should be annotated as one of:

- `DIMENSIONLESS`
- `ANGLE_RAD`
- `DISTANCE_KM`
- `HEIGHT_KM`
- `SLOPE_RATIO`
- `AREA_KM2`
- `RATE_PER_ITERATION`
- `MESH_HOPS_LEGACY`
- `NORMALIZED_ELEVATION_LEGACY`

Create a migration table before changing behavior.

## 5. Tectonic Generation

### 5.1 Plate placement

Plate assignment on a unit sphere remains radius-independent.

Do not automatically derive plate count from radius. Use profile values.

Initial compact-world experiments:

| Parameter | Low | Baseline | High |
|---|---:|---:|---:|
| Plates | 8 | 12 | 18 |
| Super plates | 3 | 4 | 6 |
| Continents | 2 | 3 | 4 |
| Land coverage | 0.30 | 0.40 | 0.50 |

### 5.2 Collision classification

Boundary type classification can remain dimensionless if based on relative motion and normalized thresholds.

Audit:

- collision time step
- velocity magnitude
- stress decay
- stress propagation radius
- reference-region scaling

Do not convert dimensionless collision math to kilometers unless the value is intended to represent travel distance.

### 5.3 Stress propagation

Replace hop-based reach with:

```js
reachHops = kmToHops(profile.tectonics.stressReachKm, meshMetrics);
```

Because BFS hops only approximate distance, prefer a weighted Dijkstra distance field using edge kilometers for final implementation.

Recommended transition:

1. Phase 1: km-to-average-hop conversion
2. Phase 2: weighted edge-distance propagation

### 5.4 Mountain belts

Separate at least four concepts:

- tectonic influence reach
- broad uplift envelope
- internal ridge spacing
- summit/detail amplitude

Suggested compact-world contribution budget:

| Component | Typical contribution |
|---|---:|
| Broad uplift | 60–80% |
| Internal ridges | 10–25% |
| Exceptional summit variation | 5–15% |
| Fine noise | 2–10% |

Do not enforce these as fixed sums; expose them as diagnostics.

## 6. Terrain Feature Distances

Convert the following classes to physical kilometers:

- tectonic reach
- ridge sigma/extent
- phasor wavelength
- phasor bandwidth
- phasor direction smoothing
- rift floor width
- rift shoulder widths
- foreland basin reach
- back-arc distances
- shelf width
- continental slope width
- mid-ocean ridge width
- fracture-zone width
- trench influence width
- coastal roughening reach
- island-arc distance
- volcanic sigma and spacing
- hotspot chain spacing
- hotspot dome width
- smoothing radius
- warp amplitude
- detail-noise wavelength

Do not convert pure frequencies mechanically. Replace frequency controls with wavelength controls where possible:

```js
frequencyOnUnitSphere = radiusKm / wavelengthKm;
```

The exact mapping depends on the noise implementation and must be empirically verified.

## 7. Domain Warping

Current warp amplitude is expressed in unit-sphere/radian-like coordinates.

Replace with:

```js
warpAngularAmplitude = warpAmplitudeKm / radiusKm;
```

Keep noise frequency separate from amplitude.

Risk:

- a physically constant warp amplitude becomes a larger angular displacement on a compact sphere
- large angular warp can cross tectonic regions or fold terrain unnaturally

Add a safety clamp:

```js
warpAmplitudeKm <= min(
  profile.terrain.maxWarpKm,
  0.25 * smallestProtectedFeatureWidthKm
)
```

## 8. Hydraulic Erosion

### 8.1 Drainage topology

Keep steepest-descent and priority-flood logic.

Use scalar height in kilometers for comparisons where practical.

### 8.2 Edge length

`cellDist` must be in kilometers.

### 8.3 Flow initialization

Current unit flow per cell is resolution-dependent.

Phase 1 compatibility mode:

```js
flow[r] = 1;
```

Phase 2 physical mode:

```js
flow[r] = cellAreaKm2 * runoff[r];
```

Where:

```js
runoff[r] = precipitationRate[r] * runoffCoefficient[r];
```

For terrain-only generation without climate:

```js
runoff[r] = profile.erosion.uniformRunoff;
```

### 8.4 Stream-power erosion

Current conceptual form:

```js
factor = K * flow ** m * dt / downstreamDistanceKm;
```

Because units are not physically closed, treat `K` as a calibrated effective coefficient.

Add diagnostics:

- maximum erosion per iteration in meters
- p50/p95 erosion per iteration
- total removed volume proxy
- max channel incision
- percentage of land modified

Clamp catastrophic updates:

```js
maxIncisionKmPerIteration
maxFractionOfLocalReliefPerIteration
```

### 8.5 Deposition

Use physical slope:

```js
receiverSlope =
  abs(heightKmReceiver - heightKmNext) / distanceKm;
```

Audit whether deposition should scale with area or cell volume proxy.

### 8.6 Priority-flood canyon carving

Replace path-length-based carve radius with physical distance.

Preferred:

- trace spill path
- identify spill point
- carve cells within a geodesic radius in kilometers
- distribute carving using a normalized kernel

Temporary approximation:

```js
radiusHops = kmToHops(canyonCarveRadiusKm, meshMetrics);
```

Do not derive canyon width from full drainage path length.

## 9. Thermal Erosion

Use physical slope:

```js
slopeRatio =
  (heightKmCurrent - heightKmNeighbor) / edgeDistanceKm;
```

Configure talus by angle:

```js
talusSlope = Math.tan(degToRad(talusAngleDeg));
```

Initial experiments:

| Material style | Angle |
|---|---:|
| loose sediment | 28–32° |
| mixed soil/rock | 32–36° |
| resistant rocky terrain | 36–42° |

Baseline: 34°.

Material transfer should occur in height kilometers and be converted back only at pass boundaries or after the complete erosion operation.

## 10. Glacial Erosion

Separate:

1. glacier placement
2. ice drainage
3. carving/deposition

Ice drainage and carving may remain useful.

Earth latitude-driven glacier placement is invalid or optional for the interior sphere.

Introduce:

```js
glaciationPotential[r]
```

Possible sources:

- imported temperature field
- altitude
- custom habitat climate
- restoration-state mask
- author-provided mask

Until custom climate exists, compact profile should default glacial erosion to disabled.

## 11. Smoothing and Ridge Sharpening

### 11.1 Smoothing

Iteration count is not a physical radius.

Preferred implementation:

- compute smoothing neighborhood by geodesic distance
- apply edge-aware weighting within `smoothingRadiusKm`

Transitional implementation:

```js
iterations = kmToHops(smoothingRadiusKm, meshMetrics);
```

### 11.2 Ridge sharpening

Keep sharpening dimensionless but add physical caps:

- maximum added height in meters
- maximum local slope after sharpening
- maximum multiplier relative to pre-sharpened relief

Compact profile baseline should use much less sharpening than the current Earth-art default.

Initial range:

```text
strength: 0.05–0.25
baseline: 0.12
```

## 12. Resolution Independence

Create mesh metrics once:

```js
{
  numRegions,
  radiusKm,
  averageEdgeAngleRad,
  averageEdgeKm,
  approximateCellAreaKm2,
  cellsPerKm,
  kmPerCell
}
```

Feature validation:

```js
cellsAcrossFeature = featureWidthKm / averageEdgeKm;
```

Recommended warnings:

| Feature type | Minimum cells across |
|---|---:|
| major mountain influence | 40 |
| mountain belt | 20 |
| internal ridge spacing | 6 |
| major river valley | 3 |
| smoothing radius | 2 |
| noise wavelength | 3 |

Warn rather than silently generate incoherent detail.

## 13. Climate Boundary

Climate normalization is a separate change.

For this conversion:

- retain climate only in Earth profile
- allow compact profile to disable climate
- do not claim Earth latitude bands are physically meaningful inside the sphere
- provide extension points for custom temperature, precipitation, and runoff fields

Future compact climate inputs:

```js
temperatureField
precipitationField
runoffField
glaciationPotential
```

## 14. Export and Unreal Integration

Export metadata alongside heightmaps:

```json
{
  "worldRadiusKm": 20,
  "sphereMode": "interior",
  "seaLevelRadiusKm": 18.5,
  "minHeightKm": -1.5,
  "maxHeightKm": 4.0,
  "heightEncoding": "linear-physical-km",
  "projection": "equirectangular"
}
```

Prefer linear physical-height encoding for interchange, even if internal generation uses shaped normalized elevation.

For inward terrain:

```text
mesh radius = sea-level radius - physical height
```

Ocean depth increases radial distance toward the structural shell.

## 15. Backward Compatibility

Provide two modes:

- `legacy`: existing constants and behavior
- `physical`: radius-normalized profile behavior

Do not remove legacy mode until Earth-profile parity is accepted.

Add deterministic seed tests in both modes.

## 16. Instrumentation

Add debug views or exported layers for:

- physical elevation in km
- edge distance in km
- local slope in degrees
- drainage area in km²
- hydraulic incision in meters
- thermal transfer in meters
- feature-width diagnostics
- cells-per-feature warnings
- tectonic contribution components
- broad uplift versus ridge/detail contribution

## 17. Recommended Implementation Sequence

1. inventory constants and assumptions
2. add world profiles and conversion utilities
3. add mesh physical metrics
4. remove direct Earth-radius conversions
5. convert terrain feature widths
6. convert warp amplitude
7. convert elevation helpers
8. convert thermal erosion
9. convert hydraulic edge distances
10. normalize flow by area
11. convert priority-flood carve width
12. convert smoothing radius
13. add validation metrics
14. add compact-world profile
15. tune parameter matrix
16. evaluate Earth-profile regression
17. document Unreal export semantics

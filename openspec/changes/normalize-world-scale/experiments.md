# Experiment Matrix: Compact 40 km World

## Purpose

Find a parameter region that produces coherent global terrain on a sphere with:

- radius: 20 km
- circumference: approximately 125.66 km
- surface area: approximately 5,026.55 km²

The experiments should identify stable relationships, not merely one attractive seed.

## Fixed Evaluation Resolutions

| Label | Regions | Approx. cell spacing |
|---|---:|---:|
| Low | 200,000 | ~159 m |
| Medium | 500,000 | ~100 m |
| High | 1,000,000 | ~71 m |

Spacing is a characteristic approximation, not exact Voronoi edge length.

## A. Plate Structure

| Parameter | Values |
|---|---|
| plate count | 8, 12, 18 |
| super plate count | 3, 4, 6 |
| continent count | 2, 3, 4 |
| land coverage | 0.30, 0.40, 0.50 |
| plate blend | 0.4, 0.6, 0.8 |

Questions:

- Do plate boundaries create a few legible regional systems?
- Are mountain belts long enough to read as systems rather than isolated blobs?
- Does a high plate count collapse regional scale separation?
- Are continents large enough to support river networks?

## B. Mountain Geometry

| Parameter | Low | Baseline | High |
|---|---:|---:|---:|
| mountain influence reach | 6 km | 9 km | 14 km |
| belt half-width | 2.5 km | 4 km | 6 km |
| ridge spacing | 0.5 km | 0.8 km | 1.3 km |
| ridge envelope | 1.5 km | 2.5 km | 4 km |
| direction smoothing | 2 km | 4 km | 7 km |
| typical mountain target | 1.0 km | 1.5 km | 2.2 km |
| exceptional peak cap | 3.0 km | 4.0 km | 4.5 km |

Questions:

- Does broad uplift dominate local peak noise?
- Are internal ridges distinguishable from the whole belt?
- Are slopes physically credible?
- Do 3–4 km peaks emerge only as exceptional combinations?
- Does the terrain preserve lowlands and traversable passes?

## C. Rifts and Basins

| Parameter | Low | Baseline | High |
|---|---:|---:|---:|
| rift floor half-width | 0.4 km | 0.75 km | 1.2 km |
| inner shoulder reach | 1 km | 1.5 km | 2.5 km |
| outer shoulder reach | 2 km | 3.5 km | 6 km |
| rift depth | 0.3 km | 0.7 km | 1.2 km |
| basin scale | 5 km | 8 km | 14 km |
| basin depth | 0.3 km | 0.7 km | 1.5 km |

Questions:

- Does the rift read as a regional structure?
- Are shoulders distinct from the valley floor?
- Are basins large enough to organize drainage?
- Does priority flood cut implausibly large outlets?

## D. Hydraulic Erosion

| Parameter | Values |
|---|---|
| runoff mode | unit-cell, uniform-area, custom field |
| stream-power flow exponent | 0.35, 0.5, 0.7 |
| effective erosion coefficient | 0.25x, 0.5x, 1x migrated baseline |
| iteration count | 1x, 2x, 4x |
| max incision/iteration | 2 m, 5 m, 10 m |
| deposition fraction | 0.05, 0.15, 0.30 |
| canyon carve radius | 0.1 km, 0.2 km, 0.4 km |

Questions:

- Do drainage networks remain similar across resolution?
- Does increased iteration count improve hierarchy without over-incision?
- Are trunk valleys appropriately stronger than tributaries?
- Does deposition form lowland fans/plains instead of dams?
- Does the total runoff remain stable with region count?

## E. Thermal Erosion

| Parameter | Values |
|---|---|
| talus angle | 30°, 34°, 38°, 42° |
| transfer strength | 0.1, 0.25, 0.5 |
| iterations | 5, 15, 40 |
| max transfer/iteration | 1 m, 3 m, 8 m |

Questions:

- Are isolated spikes removed?
- Are rocky ridges preserved?
- Does material conservation remain acceptable?
- Do results converge rather than oscillate?

## F. Smoothing, Warp, and Sharpening

| Parameter | Values |
|---|---|
| smoothing radius | 0.05, 0.15, 0.30 km |
| warp amplitude | 0.1, 0.3, 0.6 km |
| warp wavelength | 1, 3, 8 km |
| sharpening strength | 0.05, 0.12, 0.25 |
| sharpening max added height | 20, 50, 100 m |

Questions:

- Does warp improve organic shape without disconnecting tectonic logic?
- Does smoothing remove algorithmic banding without flattening watersheds?
- Does sharpening recreate pointy peaks?
- Are these effects stable across detail levels?

## Evaluation Metrics

### Geometry

- p05, p50, p95, p99 elevation in km
- maximum elevation
- ocean-depth percentiles
- p50, p90, p95, p99 slope angle
- fraction of land above 30°, 40°, and 50°
- connected lowland area
- pass/saddle distribution

### Tectonic coherence

- mean and variance of mountain-belt width
- ridge orientation agreement with tectonic stress
- fraction of major relief near convergent boundaries
- rift alignment with divergent boundaries
- trench alignment with subduction boundaries

### Hydrology

- watershed count
- drainage-area distribution
- longest river path
- river branching ratio proxy
- endorheic land fraction before and after priority flood
- incision depth distribution
- deposition distribution
- outlet canyon width

### Scale hierarchy

Use spectral or multiscale roughness metrics to verify energy exists at distinct bands:

- 10–30 km
- 3–10 km
- 0.5–3 km
- 0.1–0.5 km

Reject profiles where most energy collapses into one band.

## Acceptance Targets for Initial Compact Profile

These are initial tuning targets, not immutable requirements.

- typical mountain elevation: 0.8–1.8 km
- p99 land elevation: 2–3.5 km
- rare maximum: 3–4.25 km
- p95 land slope: below approximately 35°
- land above 45°: rare and localized
- major mountain-belt width: 4–10 km
- internal ridge spacing: 0.5–1.5 km
- major drainage path: several kilometers to several tens of kilometers
- priority-flood correction: modifies a minority of land cells
- erosion does not reduce all highlands to similar rounded forms
- results remain recognizable across resolution changes

## Experimental Discipline

For every parameter set:

1. run the same deterministic seed set
2. run at least low and medium resolution
3. retain all metrics and profile JSON
4. generate physical-elevation, slope, tectonic, and drainage views
5. avoid selecting solely from the most attractive seed
6. record failures and unstable combinations
7. change one parameter family at a time before factorial refinement

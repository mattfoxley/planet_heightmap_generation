# Change Proposal: Normalize World Orogen to Arbitrary Physical World Radius

## Change ID

`normalize-world-scale`

## Status

Proposed

## Summary

Refactor World Orogen so terrain generation, tectonic shaping, post-processing, erosion, drainage, and export can operate coherently at an arbitrary physical sphere radius.

The initial target is an interior spherical game world with:

- sphere diameter: 40 km
- sphere radius: 20 km
- terrain generated on the inner surface
- desired terrain style: geologically plausible rather than a linearly miniaturized Earth
- typical major relief: approximately 1–2 km
- exceptional peaks: potentially 3–4 km
- final global terrain used as a geological foundation rather than final centimeter-scale game terrain

The change must preserve the existing unit-sphere mesh and topological algorithms while replacing hidden Earth-radius assumptions, mesh-hop assumptions, and incompatible normalized-elevation calculations with explicit physical units.

## Motivation

World Orogen currently combines several scale systems:

1. unit-sphere coordinates
2. angular distances
3. graph/BFS hop counts
4. normalized elevation
5. hard-coded Earth-radius conversions
6. constants calibrated visually for an Earth-sized planet
7. detail-dependent iteration counts

This coupling works for the original target because all assumptions were tuned together. It becomes unreliable when the generated terrain is interpreted on a 20 km-radius sphere.

The goal is not to shrink every Earth feature by `20 / 6371`. That would compress mountain belts, rivers, rifts, and climate structures into tiny, noisy features.

The goal is to make physical scale explicit so a world profile can independently define:

- world radius
- characteristic tectonic domain size
- mountain-belt width
- ridge spacing
- rift width
- basin size
- vertical relief
- erosion length scales
- physical slope thresholds
- drainage contribution per unit area

## Desired Outcome

After this change, the generator should support a physical world profile such as:

```js
{
  radiusKm: 20,
  elevation: {
    oceanFloorKm: -2.0,
    typicalLandKm: 0.25,
    typicalMountainKm: 1.5,
    exceptionalPeakKm: 4.0
  },
  tectonics: {
    plateCount: 12,
    superPlateCount: 4,
    stressReachKm: 8.0,
    mountainBeltHalfWidthKm: 4.0,
    riftFloorHalfWidthKm: 0.75,
    riftShoulderReachKm: 3.0
  },
  terrain: {
    ridgeSpacingKm: 0.8,
    ridgeEnvelopeKm: 2.5,
    coastalPlainWidthKm: 1.5,
    majorBasinScaleKm: 8.0
  },
  erosion: {
    talusAngleDeg: 34,
    canyonCarveRadiusKm: 0.2,
    smoothingRadiusKm: 0.15
  }
}
```

The same algorithms should continue to work at Earth radius when the Earth profile is selected.

## Non-Goals

This change does not attempt to:

- produce a physically rigorous geodynamic simulation
- simulate actual plate motion over geological time
- guarantee that Earth-calibrated climate remains valid on an interior sphere
- generate final local terrain detail for traversal, roads, cliffs, or settlements
- automatically derive every terrain parameter from radius alone
- preserve exact pixel-identical output after internal unit conversion
- model artificial gravity, core lighting, or habitat engineering in the first implementation phase

## User Value

The result will allow World Orogen to act as the global geological foundation for a compact game world while retaining:

- coherent plate-driven mountain placement
- convergent, divergent, and transform boundary relationships
- broad tectonic uplift
- rifts and basins
- plausible watersheds
- hydraulic valley carving
- thermal slope relaxation
- sediment deposition
- resolution-independent physical controls

## Success Criteria

The change is successful when:

1. no production terrain algorithm directly assumes a radius of 6371 km
2. all horizontal physical distances are derived from angular distance and a world radius
3. all slope-sensitive algorithms compare compatible physical units
4. major feature widths remain stable in kilometers as mesh detail changes
5. drainage topology remains coherent at radius 20 km
6. equivalent seeds produce recognizable large-scale structure across supported detail levels
7. the Earth profile remains visually close to current behavior
8. the compact-world profile produces nested terrain scales rather than uniformly compressed noise
9. automated metrics detect features that fall below minimum cells-per-feature limits
10. experimental values can be changed through a profile/configuration layer without editing algorithm internals

## Primary Risks

- converting horizontal scale without converting elevation scale
- treating normalized elevation as linear height
- scaling every parameter by radius
- retaining too many plates for a compact surface
- feature widths becoming smaller than mesh resolution
- hydraulic flow changing with region count because flow is counted per cell
- thermal erosion using a dimensionless threshold against nonphysical slopes
- priority-flood carve radius changing with path length or mesh detail
- ridge sharpening recreating spikes after erosion
- climate and glacial placement retaining Earth-specific latitude assumptions
- export scale and runtime radial displacement being confused
- inward-facing terrain reversing world-space normals without reversing scalar elevation semantics

## Assumptions

- terrain algorithms operate on scalar height where larger values mean higher terrain
- inward radial displacement is handled at export/import or rendering time
- hydrology uses scalar terrain height and does not need to know that geometry faces inward
- the unit-sphere mesh remains the canonical topological representation
- global terrain resolution will usually be between 200,000 and 1,000,000 regions
- local game terrain detail will be added in a downstream pipeline
- compact-world terrain may be intentionally exaggerated but should preserve coherent landform hierarchy

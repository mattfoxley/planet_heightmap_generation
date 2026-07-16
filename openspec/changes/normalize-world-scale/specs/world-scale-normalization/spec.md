# Specification: World-Scale Normalization

## ADDED Requirements

### Requirement: Configurable Physical Radius

The generator SHALL accept a positive physical sphere radius in kilometers.

#### Scenario: Compact sphere

- GIVEN a world profile with `radiusKm = 20`
- WHEN mesh physical metrics are initialized
- THEN all edge distances SHALL be reported using a 20 km radius
- AND no terrain subsystem SHALL substitute Earth radius

#### Scenario: Earth profile

- GIVEN a world profile with `radiusKm = 6371`
- WHEN the physical pipeline runs
- THEN kilometer distances SHALL approximate current Earth-scale behavior

---

### Requirement: Unit-Sphere Topology Preservation

The generator SHALL continue to use normalized sphere coordinates for topology and adjacency.

#### Scenario: Radius change

- GIVEN identical seed, mesh region count, and plate settings
- WHEN only physical radius changes
- THEN unit-sphere point positions and adjacency SHALL remain unchanged
- AND only physical interpretations and scale-dependent terrain behavior MAY change

---

### Requirement: Explicit Horizontal Distance Conversion

Every algorithm requiring physical horizontal distance SHALL convert angular distance using the configured radius.

#### Scenario: Neighbor distance

- GIVEN two neighboring unit-sphere positions
- WHEN their physical edge length is requested
- THEN the result SHALL equal angular separation multiplied by world radius within numeric tolerance

#### Scenario: Earth constant audit

- WHEN the repository is scanned
- THEN direct terrain-algorithm uses of literal `6371` SHALL be absent
- EXCEPT in an Earth profile definition or test fixture

---

### Requirement: Explicit Physical Elevation Conversion

The generator SHALL provide reversible conversion between internal normalized elevation and physical kilometers.

#### Scenario: Sea level

- GIVEN normalized elevation zero
- THEN physical elevation SHALL be zero kilometers

#### Scenario: Positive peak

- GIVEN profile maximum land elevation
- WHEN converted to normalized elevation and back
- THEN round-trip error SHALL be below the configured tolerance

#### Scenario: Ocean depth

- GIVEN a negative physical elevation inside the configured ocean range
- WHEN converted to normalized elevation and back
- THEN sign and depth SHALL be preserved

---

### Requirement: Physical Slope

Slope-sensitive systems SHALL calculate rise and run in compatible physical units.

#### Scenario: Thermal slope

- GIVEN two cells with a 0.5 km height difference and 1 km horizontal separation
- THEN the computed slope ratio SHALL be approximately 0.5
- AND the slope angle SHALL be approximately 26.565 degrees

#### Scenario: Resolution change

- GIVEN the same analytical terrain sampled at two supported mesh resolutions
- WHEN physical slope is computed
- THEN median slope statistics SHALL remain within the configured tolerance

---

### Requirement: Physical Feature Widths

Feature width settings SHALL be expressible in kilometers.

#### Scenario: Mountain belt width

- GIVEN a mountain belt width of 8 km
- WHEN generated at 200k and 800k regions
- THEN measured physical width SHALL remain within acceptance tolerance
- EVEN THOUGH the number of cells across the feature changes

#### Scenario: Unsupported resolution

- GIVEN a ridge wavelength resolving to fewer than the minimum cells
- WHEN generation begins
- THEN the generator SHALL emit a validation warning
- AND SHALL identify the affected parameter

---

### Requirement: Radius-Independent Drainage Topology

Drainage SHALL remain based on scalar elevation and mesh topology.

#### Scenario: Interior sphere

- GIVEN an interior-sphere export mode
- WHEN hydraulic erosion runs
- THEN drainage SHALL move from higher scalar elevation to lower scalar elevation
- AND SHALL NOT reverse because radial displacement points inward

---

### Requirement: Physical Hydraulic Distance

Hydraulic erosion SHALL use downstream distance in physical kilometers.

#### Scenario: Stream-power factor

- GIVEN identical flow and vertical relief
- WHEN horizontal downstream distance doubles
- THEN the distance-dependent erosion factor SHALL respond consistently with the implemented stream-power equation

---

### Requirement: Resolution-Aware Runoff

The physical hydraulic mode SHALL support flow initialization by cell area.

#### Scenario: Uniform runoff

- GIVEN two meshes covering the same sphere with different region counts
- AND uniform runoff per square kilometer
- WHEN total source runoff is summed
- THEN totals SHALL be approximately equal

#### Scenario: Compatibility mode

- GIVEN legacy flow mode
- THEN unit flow per land cell MAY remain available for regression testing

---

### Requirement: Physical Thermal Threshold

Thermal erosion SHALL accept talus angle in degrees or an equivalent physical slope ratio.

#### Scenario: Below talus

- GIVEN local slope below the configured talus angle
- THEN no thermal material transfer SHALL occur

#### Scenario: Above talus

- GIVEN local slope above the configured talus angle
- THEN transfer SHALL reduce the excess slope without inverting the local height ordering in one iteration

---

### Requirement: Physical Priority-Flood Carve Width

Priority-flood canyon carving SHALL support a physical carve radius independent of drainage path length and mesh detail.

#### Scenario: Spill-point canyon

- GIVEN the same basin represented at two mesh resolutions
- WHEN the outlet is carved
- THEN canyon influence width in kilometers SHALL remain within tolerance

---

### Requirement: Physical Warp Amplitude

Terrain domain warp amplitude SHALL be configurable in kilometers.

#### Scenario: Radius conversion

- GIVEN a 1 km warp amplitude
- WHEN radius is 20 km
- THEN the angular displacement SHALL be 0.05 radians before safety clamping

---

### Requirement: World Profiles

The generator SHALL support named world profiles.

#### Scenario: Compact profile

- GIVEN the `compact-40km` profile
- THEN radius SHALL be 20 km
- AND compact-world experimental parameter defaults SHALL load

#### Scenario: Legacy profile

- GIVEN the legacy profile
- THEN existing behavior SHALL remain selectable during migration

---

### Requirement: Climate Separation

Compact-world terrain generation SHALL not require Earth-style climate simulation.

#### Scenario: Climate disabled

- GIVEN a compact-world profile with climate disabled
- WHEN terrain generation and erosion run
- THEN generation SHALL complete without latitude-driven wind, precipitation, or glaciation

#### Scenario: External runoff

- GIVEN an externally supplied runoff field
- WHEN hydraulic erosion runs
- THEN the runoff field SHALL influence flow accumulation

---

### Requirement: Interior-Sphere Export Metadata

Exports SHALL document how physical height maps to radial position.

#### Scenario: Metadata export

- GIVEN interior-sphere mode
- WHEN a heightmap is exported
- THEN metadata SHALL include radius, sea-level radius, min/max physical height, encoding, and inward displacement semantics

---

### Requirement: Diagnostics

The physical pipeline SHALL expose diagnostics sufficient to tune coherence.

#### Scenario: Terrain validation report

- WHEN generation completes
- THEN the report SHALL include:
  - average edge kilometers
  - approximate cell area
  - elevation percentiles in kilometers
  - slope percentiles in degrees
  - cells across configured features
  - drainage-area statistics
  - erosion incision statistics
  - active validation warnings

---

## MODIFIED Requirements

### Requirement: Terrain Detail

Terrain detail SHALL represent sampling resolution, not world feature size.

#### Scenario: Detail slider

- WHEN detail changes
- THEN configured physical feature widths SHALL remain stable
- AND only sampling fidelity and runtime SHOULD change materially

---

### Requirement: Ridge Sharpening

Ridge sharpening SHALL be constrained by physical height and slope caps in physical mode.

#### Scenario: Compact-world sharpening

- GIVEN a compact profile
- WHEN sharpening runs
- THEN it SHALL NOT create a local height increase above the configured meter cap
- AND SHALL NOT create slopes above the configured post-sharpen threshold without warning

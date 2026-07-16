# Risks, Assumptions, and Guardrails

## Critical Risks

### Mixed units

Failure mode:

- normalized elevation divided by kilometer edge length
- angular distance compared with kilometer thresholds
- kilometer noise amplitudes passed into unit-sphere coordinates

Guardrail:

- include unit suffixes in variable names
- add unit-category comments
- centralize conversions
- prohibit ambiguous names such as `width`, `dist`, or `height` in new physical code

### Blind radius scaling

Failure mode:

- every Earth feature is multiplied by `20 / 6371`
- terrain becomes ultra-dense and noisy
- major landforms span too few cells

Guardrail:

- radius and geological profile remain separate
- no universal `planetScaleFactor` is used for all feature classes

### Elevation nonlinearity

Failure mode:

- equal normalized erosion increments remove wildly different physical heights at plains and peaks

Guardrail:

- calculate physical processes in kilometers
- add round-trip conversion tests
- measure erosion in meters

### Resolution dependence

Failure mode:

- river strength increases with cell count
- canyon width changes with path cell count
- smoothing changes because iterations are treated as distance

Guardrail:

- normalize source runoff by cell area
- express widths in kilometers
- validate cells across each feature

### Overpowered compact-world erosion

Failure mode:

- 1 km terrain features are erased by coefficients tuned for continental distances
- outlet canyons cut across entire ranges

Guardrail:

- maximum incision/transfer clamps
- meter-scale diagnostics
- gradual tuning from low strength
- compare against no-erosion baseline

### Ridge sharpening regressions

Failure mode:

- post-erosion sharpening recreates spikes and excessive local slopes

Guardrail:

- compact profile uses low sharpening
- cap by added meters and post-process slope

### Interior geometry confusion

Failure mode:

- hydrology is inverted because higher terrain is geometrically closer to the center
- normals and displacement semantics leak into scalar terrain algorithms

Guardrail:

- scalar elevation remains conventional
- inward radial conversion occurs only at export/render boundary

## Major Assumptions

- Orogen is a plausibility generator, not a geophysical time simulation.
- Plate topology can be reused at compact scale.
- Fewer large geological systems are appropriate for a compact world.
- Exceptional 3–4 km peaks are intentional artistic exaggerations.
- The sphere has enough structural thickness to contain ocean depth and mountain displacement.
- Artificial habitat climate will eventually replace Earth climate assumptions.
- Global erosion is intended to establish regional drainage, not final microtopography.

## Unknowns Requiring Experiments

- best number of plates for visual and gameplay coherence
- stable mountain influence width relative to a 125.66 km circumference
- whether weighted geodesic fields are necessary or approximate hops are sufficient
- stream-power coefficient after switching flow to km² runoff
- appropriate ocean depth relative to structural shell
- how much broad uplift is needed before erosion creates convincing mountain systems
- whether existing phasor ridge noise maps cleanly from wavelength in kilometers
- whether 500k regions provide enough source fidelity for export
- acceptable Earth-profile regression tolerance
- how terrain should respond to artificial climate/restoration systems

## Stop Conditions

Pause implementation and reconsider design if:

- large-scale topology changes unpredictably with detail level
- physical slope statistics vary strongly with mesh resolution
- major features cannot maintain width within approximately 15–20%
- hydraulic results cannot be stabilized under area-normalized runoff
- inverse elevation conversion introduces visible banding or instability
- compact parameters require pervasive one-off exceptions in algorithm code
- Earth compatibility requires duplicating most of the pipeline

## Recommended Guardrail Tests

- no direct `6371` outside profiles/tests
- no new ambiguous distance variables without unit suffix
- no configured feature below minimum cells warning threshold
- no NaN or infinity after elevation conversion or erosion
- no one-iteration height change above configured safety cap
- no land-to-ocean sign crossing unless explicitly allowed
- total thermal transfer approximately conserved
- total uniform runoff approximately invariant with detail
- deterministic seed reproducibility

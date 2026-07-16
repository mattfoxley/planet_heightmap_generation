// export-metadata.js — heightmap sidecar metadata (design §14) for deterministic Unreal import.
// Phase 2 "linear physical-height export mode". Pure/testable (no browser deps).
//
// The 16-bit heightmap export is already LINEAR in physical km; this describes it so a consumer can
// map value → km without guessing. The km RANGE below MUST match the encoder in planet-mesh.js
// (heightmapColor / landHeightmapColor):
//   heightmap:     heightKm = value/65535 * 11 - 5     (range [-5, 6])   -5 km ocean … 6 km peak
//   landheightmap: heightKm = value/65535 * 6          (range [ 0, 6])   ocean = 0
// (This is the legacy Earth-calibrated range; it becomes profile-driven in the Phase 12 export work.)

import { getWorldProfile } from './world-profiles.js';

export function heightmapMetadata(type, profile) {
  const p = profile || getWorldProfile('legacy');   // default radius from the profile, never a literal
  const isLand = type === 'landheightmap';
  const minHeightKm = isLand ? 0 : -5;
  const maxHeightKm = 6;
  const radiusKm = p.radiusKm;
  const interior = p.id === 'compact-40km';
  const span = maxHeightKm - minHeightKm;
  return {
    generator: 'World Orogen',
    worldProfile: p.id,
    worldRadiusKm: radiusKm,
    sphereMode: interior ? 'interior' : 'exterior',
    seaLevelRadiusKm: radiusKm,          // elevation 0 sits at the nominal radius (adjust at import)
    projection: 'equirectangular',
    bitDepth: 16,
    heightEncoding: 'linear-physical-km',
    minHeightKm,
    maxHeightKm,
    valueToHeightKm: `heightKm = value / 65535 * ${span} + (${minHeightKm})`,
    // Interior sphere: terrain displaces INWARD (design §2.6 / §14).
    inwardDisplacement: 'meshRadiusKm = seaLevelRadiusKm - heightKm',
    note: 'km range matches the current Earth-calibrated encoder; rescale vertically at import '
        + '(sea level → your water radius, choose relief amplitude) when targeting a compact world.',
  };
}

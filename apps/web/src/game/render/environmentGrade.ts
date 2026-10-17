/**
 * Single source of truth for the scene's value hierarchy, tuned for long sessions. Brightened after
 * playtest feedback ("too dark, characters lose detail"): the environment sits in a lighter, low-noise mid-range so actors, labels and effects
 * (the gameplay-relevant layer) are always the brightest, most saturated things on screen.
 */
export const environmentGrade = {
  lights: {
    /** Sky/ground ambient. Lower keeps floors from washing out. */
    hemisphere: 1.75,
    /** Key light; also casts the shadows that ground actors. */
    sun: 3.1,
    fill: 1.2,
    /** Back rim that outlines silhouettes against the floor. */
    rim: 1.45,
    /** Torch point lights: base intensity and flicker amplitude. */
    torch: 15,
    torchFlicker: 1.6,
  },
  surfaces: {
    /** Flagstone/brick albedo: base value + height contribution (0..1). */
    albedoBase: .42,
    albedoRange: .38,
    albedoSpeck: .04,
    /** Per-tile brightness jitter [min, min + range]. Small range = calmer floor. */
    tileJitterMin: .8,
    tileJitterRange: .08,
    wallBase: 0x6f6c60,
    wallUpper: 0x847b72,
    wallJitterMin: .74,
    wallJitterRange: .25,
    pillarDark: 0x7d776f,
    pillarLight: 0x8d8477,
  },
  post: {
    /** Bloom only on true light sources (torches, VFX); no screen-wide haze. */
    bloomStrength: .32,
    bloomRadius: .25,
    bloomThreshold: .92,
    saturation: 1.2,
    vignette: .18,
    /** Depth-edge ink line strength; crisp silhouettes separate actors from the floor. */
    outline: .85,
    /** Self-illumination of eyes/runes. Too high reads as a glow halo over faces. */
    emissionGain: 1.3,
  },
  actors: {
    /** Ground-contact blob shadow opacity: anchors characters so they don't float on the floor. */
    contactShadow: .55,
  },
  fogDensity: .011,
  decor: {
    runeOpacity: .26,
    runePulse: .1,
  },
} as const

/** Target relative luminance for each depth's floor tint and fog, so contrast holds as depths change. */
const BIOME_STONE_LUMINANCE = .4
const BIOME_FOG_LUMINANCE = .13

function luminance(hex: number) {
  const r = (hex >> 16 & 255) / 255, g = (hex >> 8 & 255) / 255, b = (hex & 255) / 255
  return .2126 * r + .7152 * g + .0722 * b
}

function scaleToLuminance(hex: number, target: number) {
  const factor = target / Math.max(.01, luminance(hex))
  const channel = (shift: number) => Math.min(255, Math.round((hex >> shift & 255) * factor))
  return channel(16) << 16 | channel(8) << 8 | channel(0)
}

/** Keeps a depth's hue but normalises its brightness to the shared value hierarchy. */
export function gradeBiome<T extends { stone: number; fog: number }>(biome: T): T {
  return { ...biome, stone: scaleToLuminance(biome.stone, BIOME_STONE_LUMINANCE), fog: scaleToLuminance(biome.fog, BIOME_FOG_LUMINANCE) }
}

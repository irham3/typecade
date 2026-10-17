/**
 * Single source of truth for the scene's value hierarchy, tuned for long sessions:
 * the environment sits in a darker, low-noise mid-range so actors, labels and effects
 * (the gameplay-relevant layer) are always the brightest, most saturated things on screen.
 */
export const environmentGrade = {
  lights: {
    /** Sky/ground ambient. Lower keeps floors from washing out. */
    hemisphere: 1.1,
    /** Key light; also casts the shadows that ground actors. */
    sun: 2.5,
    fill: .85,
    /** Back rim that outlines silhouettes against the floor. */
    rim: 1.45,
    /** Torch point lights: base intensity and flicker amplitude. */
    torch: 13,
    torchFlicker: 1.6,
  },
  surfaces: {
    /** Flagstone/brick albedo: base value + height contribution (0..1). */
    albedoBase: .42,
    albedoRange: .38,
    albedoSpeck: .04,
    /** Per-tile brightness jitter [min, min + range]. Small range = calmer floor. */
    tileJitterMin: .82,
    tileJitterRange: .08,
    wallBase: 0x6f6c60,
    wallUpper: 0x847b72,
    wallJitterMin: .75,
    wallJitterRange: .25,
    pillarDark: 0x7d776f,
    pillarLight: 0x8d8477,
  },
  post: {
    bloomStrength: .6,
    bloomRadius: .45,
    bloomThreshold: .82,
    saturation: 1.12,
    vignette: .34,
  },
  fogDensity: .02,
  decor: {
    runeOpacity: .26,
    runePulse: .1,
  },
} as const

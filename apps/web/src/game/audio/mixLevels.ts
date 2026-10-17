/**
 * Gain staging for the synthesized mix. Recipes author relative levels (0..~0.5); these
 * constants lift them to a healthy loudness, and the two-stage dynamics chain at the end
 * keeps stacked explosions and hordes from clipping.
 */
export const mixLevels = {
  /** Default master slider position for new players and for the v2 mix migration. */
  defaultVolume: .7,
  /** Master slider → master gain. */
  masterGain: 1,
  /** Bus gains at slider = 1. */
  effectsBus: 1,
  musicBus: 1,
  ambienceBus: .35,
  /** Applied to every one-shot effect voice (combat, enemies, UI). */
  effectsRecipeGain: 2.6,
  /** Glue compressor: evens out the mix. */
  glue: { threshold: -18, knee: 8, ratio: 4, attack: .004, release: .2 },
  /** Brick-wall-ish limiter: final safety against clipping. */
  limiter: { threshold: -2, knee: 0, ratio: 20, attack: .001, release: .08 },
  /** Stone-hall reverb sends and wet return. */
  hallSend: { music: .45, effects: .14, return: .8 },
  /** Simultaneous instrument notes allowed on the music bus (pads ring over bar lines). */
  musicVoices: 40,
  /** Music duck depth under major hits (0..1 of normal). */
  duckTo: .45,
} as const

/** Settings written before this version used the old quiet mix and are lifted to the new default once. */
export const MIX_VERSION = 2

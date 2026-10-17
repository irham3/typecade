import { arrivalVoices, deathVoices } from "./enemyVoices"
import type { VoiceShape } from "../DungeonAudio"

/** Minimal synth surface a recipe may use; implemented by `DungeonAudio`. */
export interface SfxVoice {
  /** One enveloped voice: start frequency, seconds, peak level, waveform, end frequency, delay seconds. */
  tone(frequency: number, duration: number, level: number, type: OscillatorType | "noise", end?: number, delay?: number): void
  /** One continuous voice gliding from → to, with optional soft attack and vibrato. */
  sweep(from: number, to: number, duration: number, level: number, type: OscillatorType, shape?: VoiceShape): void
  /** Arpeggiated sine notes (MIDI numbers) spaced by `spacing` seconds. */
  chime(notes: number[], level: number, spacing: number): void
}

type Recipe = (voice: SfxVoice) => void

/**
 * Sound design for new weapons, moves and foes. Each recipe layers a transient
 * (noise click), a body (pitched sweep) and optionally a tail (chime) so hits read as impacts.
 */
/** Scales every voice a recipe emits; death cries are the main kill feedback, so they sit above arrival calls. */
const DEATH_CRY_GAIN = 1.9
function louder(recipe: Recipe, gain: number): Recipe {
  return voice => recipe({
    tone: (f, d, l, type, end, delay) => voice.tone(f, d, l * gain, type, end, delay),
    sweep: (from, to, d, l, type, shape) => voice.sweep(from, to, d, l * gain, type, shape),
    chime: (notes, l, spacing) => voice.chime(notes, l * gain, spacing),
  })
}

const voiceRecipes = Object.fromEntries([
  ...Object.entries(arrivalVoices).map(([kind, recipe]) => [`enemy-${kind}`, recipe]),
  ...Object.entries(deathVoices).map(([kind, recipe]) => [`death-${kind}`, louder(recipe, DEATH_CRY_GAIN)]),
]) as Record<string, Recipe>

export const sfxRecipes: Record<string, Recipe> = {
  ...voiceRecipes,
  // Hero moves
  thrust: v => { v.tone(3200, .09, .16, "noise"); v.tone(620, .12, .14, "triangle", 1400) },
  uppercut: v => { v.tone(1800, .16, .2, "noise"); v.tone(240, .2, .18, "triangle", 720) },
  twin: v => { v.tone(2400, .1, .18, "noise"); v.tone(2000, .1, .16, "noise", 2000, .09); v.tone(900, .08, .08, "square", 1600, .05) },
  leap: v => { v.tone(180, .3, .22, "triangle", 520); v.tone(95, .35, .4, "sine", 32, .26); v.tone(600, .3, .3, "noise", 600, .26) },
  whirl: v => { v.tone(500, .5, .28, "noise", 500); v.tone(220, .5, .16, "sawtooth", 660); v.chime([79, 83, 86], .07, .06) },
  finisher: v => {
    v.tone(70, .9, .5, "sine", 28)
    v.tone(900, .7, .42, "noise")
    v.tone(146, .8, .2, "sawtooth", 73, .05)
    v.chime([62, 69, 74, 78, 81, 86], .16, .05)
  },
  // Automatic weapons
  orbit: v => { v.tone(1700, .05, .05, "triangle", 2600) },
  nova: v => { v.tone(1200, .5, .2, "noise"); v.tone(330, .55, .16, "sine", 990); v.chime([74, 78, 81, 86], .12, .04) },
  meteor: v => { v.tone(2600, .28, .1, "sine", 300); v.tone(80, .55, .45, "sine", 26, .28); v.tone(380, .6, .38, "noise", 380, .28) },
  frost: v => { v.chime([88, 93, 96, 100], .12, .035); v.tone(5200, .35, .1, "noise") },
  spore: v => { v.tone(420, .35, .16, "noise", 420); v.tone(260, .3, .08, "sine", 160) },
  // Kill confirm: punchy thwack + rising sparkle; plays on top of each foe's own death cry.
  kill: v => { v.tone(2400, .03, .05, "noise"); v.tone(1600, .05, .04, "sine", 2200, .01) },
  "kill-elite": v => { v.tone(120, .3, .3, "sine", 40); v.tone(1500, .25, .2, "noise"); v.chime([74, 81, 86, 93, 98], .12, .05) },
  // Explosion: sub thump, sharp crack, low rumble tail and falling debris.
  explosion: v => {
    v.tone(95, .55, .5, "sine", 28)
    v.tone(3800, .09, .32, "noise")
    v.tone(420, .9, .34, "noise", 420, .03)
    for (let i = 0; i < 5; i++) v.tone(1400 + i * 300, .04, .06, "noise", 1400, .25 + i * .07)
  },
  // Lightning: dry crack, electric buzz, then a rolling thunder tail.
  zap: v => { v.tone(6000, .05, .26, "noise"); v.tone(1400, .16, .12, "sawtooth", 180); v.tone(900, .12, .08, "square", 2400, .03) },
  storm: v => {
    v.tone(7000, .06, .3, "noise")
    v.tone(1800, .22, .14, "sawtooth", 120, .02)
    v.tone(160, 1.1, .3, "noise", 160, .08)
    v.tone(70, .9, .26, "sine", 32, .1)
    v.tone(6500, .05, .2, "noise", 6500, .3)
  },
  firebolt: v => { v.tone(800, .25, .1, "noise", 800); v.tone(300, .2, .09, "sawtooth", 600) },
  sentry: v => { v.tone(1800, .08, .12, "square", 600); v.tone(5000, .04, .1, "noise") },
  // Director cues
  surge: v => {
    v.sweep(98, 110, 1.1, .16, "triangle", { attack: .12, vibratoRate: 5, vibratoDepth: .012 })
    v.sweep(147, 165, 1.1, .1, "triangle", { attack: .14, vibratoRate: 5.5, vibratoDepth: .012, delay: .03 })
    v.tone(70, .45, .32, "sine", 40, .02)
    v.tone(70, .45, .28, "sine", 40, .5)
  },
  breather: v => v.chime([74, 78, 81, 86], .08, .1),
}

export function hasSfxRecipe(kind: string) { return Object.hasOwn(sfxRecipes, kind) }

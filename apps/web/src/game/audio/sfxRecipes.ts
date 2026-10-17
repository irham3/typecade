/** Minimal synth surface a recipe may use; implemented by `DungeonAudio`. */
export interface SfxVoice {
  /** One enveloped voice: start frequency, seconds, peak level, waveform, end frequency, delay seconds. */
  tone(frequency: number, duration: number, level: number, type: OscillatorType | "noise", end?: number, delay?: number): void
  /** Arpeggiated sine notes (MIDI numbers) spaced by `spacing` seconds. */
  chime(notes: number[], level: number, spacing: number): void
}

type Recipe = (voice: SfxVoice) => void

/**
 * Sound design for new weapons, moves and foes. Each recipe layers a transient
 * (noise click), a body (pitched sweep) and optionally a tail (chime) so hits read as impacts.
 */
export const sfxRecipes: Record<string, Recipe> = {
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
  // New foes: arrival cues
  "enemy-gargoyle": v => { v.tone(140, .4, .1, "sawtooth", 90); v.tone(2400, .1, .04, "noise", 2400, .2) },
  "enemy-mimic": v => { v.tone(380, .06, .1, "square", 220); v.tone(380, .06, .1, "square", 220, .1) },
  "enemy-sporeling": v => { v.tone(520, .12, .06, "sine", 780) },
  "enemy-ghoul": v => { v.tone(200, .5, .08, "sawtooth", 120); v.tone(3100, .12, .03, "noise") },
  "enemy-deathknight": v => { v.tone(62, .7, .16, "sawtooth", 46); v.chime([50, 53, 57], .05, .12) },
  // New foes: deaths
  "death-gargoyle": v => { v.tone(1100, .3, .16, "noise"); v.tone(120, .35, .18, "triangle", 40) },
  "death-mimic": v => { v.tone(420, .1, .14, "noise"); v.chime([74, 81, 86], .14, .05) },
  "death-sporeling": v => { v.tone(300, .3, .14, "noise", 300) },
  "death-ghoul": v => { v.tone(300, .25, .12, "sawtooth", 70) },
  "death-deathknight": v => { v.tone(55, .8, .26, "sawtooth", 30); v.tone(900, .6, .22, "noise") },
}

export function hasSfxRecipe(kind: string) { return Object.hasOwn(sfxRecipes, kind) }

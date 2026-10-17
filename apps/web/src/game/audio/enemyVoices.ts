import type { EnemyKind } from "@typecade/contracts"
import type { SfxVoice } from "./sfxRecipes"

type Recipe = (voice: SfxVoice) => void

/**
 * Groans, wails and howls as one continuous voice: a pitch glide with LFO vibrato and a soft
 * attack. (Chaining short notes caused audible clicks when a whole pack called at once.)
 * `wobble` is vibrato depth as a fraction of pitch; `pulse` is vibrato speed in Hz.
 */
function glide(v: SfxVoice, from: number, to: number, seconds: number, level: number, type: OscillatorType, wobble: number, pulse: number) {
  v.sweep(from, to, seconds, level, type, { attack: Math.min(.08, seconds / 5), vibratoRate: pulse, vibratoDepth: wobble })
}

/** Rapid dry clicks: bones, legs, claws. */
function clatter(v: SfxVoice, count: number, frequency: number, spacing: number, level: number) {
  for (let i = 0; i < count; i++) v.tone(frequency * (1 + (i % 3) * .12), .035, level * (1 - i / (count * 1.6)), "noise", frequency, i * spacing * (1 + (i % 2) * .3))
}

/** Arrival calls, one per kind, so you can hear what just entered the fight. */
export const arrivalVoices: Partial<Record<EnemyKind, Recipe>> = {
  skeleton: v => { clatter(v, 6, 2400, .045, .09); v.tone(900, .08, .04, "square", 600, .1) },
  archer: v => { clatter(v, 3, 2200, .05, .07); v.tone(180, .25, .09, "triangle", 420, .12) },
  ghoul: v => glide(v, 140, 95, .9, .1, "sawtooth", .06, 8),
  goblin: v => { v.tone(700, .07, .06, "square", 1100); v.tone(800, .07, .06, "square", 1300, .1); v.tone(650, .1, .06, "square", 1500, .2) },
  rat: v => { v.tone(3200, .05, .05, "sine", 4200); v.tone(3600, .05, .04, "sine", 4600, .08); v.tone(3000, .06, .04, "sine", 4000, .17) },
  spider: v => clatter(v, 10, 4200, .028, .06),
  bat: v => { v.tone(5200, .09, .05, "sine", 3800); v.tone(5600, .08, .04, "sine", 4200, .12); v.tone(1800, .2, .04, "noise", 1800) },
  slime: v => { v.tone(180, .22, .1, "sine", 420); v.tone(260, .14, .06, "sine", 120, .18) },
  sporeling: v => { v.tone(620, .1, .06, "sine", 900); v.tone(520, .12, .05, "sine", 760, .12) },
  wolf: v => glide(v, 420, 760, .9, .07, "sine", .015, 7),
  guard: v => { v.tone(110, .3, .13, "sawtooth", 80); v.tone(900, .1, .06, "square", 500, .22) },
  imp: v => { for (let i = 0; i < 4; i++) v.tone(1300 + i * 120, .06, .05, "square", 1700 + i * 120, i * .07) },
  mage: v => { v.tone(330, .6, .05, "sine", 440); v.chime([81, 85, 88], .04, .08) },
  shaman: v => { v.tone(120, .1, .12, "sine", 70); v.tone(120, .1, .12, "sine", 70, .2); v.tone(160, .1, .1, "sine", 90, .4) },
  necromancer: v => { glide(v, 220, 150, .9, .05, "sawtooth", .03, 6); v.chime([50, 53, 57], .04, .15) },
  wraith: v => glide(v, 520, 300, 1.1, .06, "sine", .08, 9),
  bomber: v => { v.tone(6000, .6, .05, "noise"); v.tone(2400, .05, .05, "square", 2400, .3) },
  minotaur: v => { glide(v, 120, 70, .8, .16, "sawtooth", .05, 6); v.tone(200, .4, .1, "noise", 200) },
  boss: v => { glide(v, 90, 50, 1.4, .2, "sawtooth", .05, 8); v.tone(140, 1.2, .14, "noise", 140) },
  golem: v => { v.tone(55, .7, .16, "sawtooth", 40); clatter(v, 5, 700, .09, .08) },
  troll: v => glide(v, 150, 90, .8, .14, "sawtooth", .07, 7),
  serpent: v => v.tone(5200, .55, .06, "noise", 5200),
  beetle: v => clatter(v, 7, 1500, .04, .08),
  assassin: v => { v.tone(4200, .12, .05, "noise", 4200); v.tone(3000, .1, .04, "noise", 3000, .1) },
  wisp: v => v.chime([88, 92, 95, 100], .05, .05),
  gargoyle: v => { v.tone(90, .5, .12, "sawtooth", 60); clatter(v, 4, 900, .1, .07) },
  mimic: v => { v.tone(400, .05, .12, "square", 200); v.tone(380, .05, .12, "square", 190, .12); v.tone(360, .06, .12, "square", 180, .24) },
  deathknight: v => { v.tone(62, .9, .16, "sawtooth", 46); v.chime([50, 53, 56], .06, .14); v.tone(2600, .3, .04, "noise", 2600, .3) },
}

/** Final cry per kind; the generic kill confirm plays on top. */
export const deathVoices: Partial<Record<EnemyKind, Recipe>> = {
  skeleton: v => { clatter(v, 8, 1800, .03, .12); v.tone(160, .12, .1, "triangle", 70) },
  archer: v => clatter(v, 7, 1700, .035, .11),
  ghoul: v => glide(v, 180, 70, .5, .12, "sawtooth", .08, 5),
  goblin: v => { v.tone(900, .18, .1, "square", 260) },
  rat: v => v.tone(3400, .12, .07, "sine", 1800),
  spider: v => { clatter(v, 5, 3000, .03, .09); v.tone(700, .15, .07, "sine", 200) },
  bat: v => v.tone(4200, .2, .07, "sine", 1200),
  slime: v => { v.tone(300, .25, .12, "sine", 80); v.tone(900, .2, .08, "noise", 600) },
  sporeling: v => { v.tone(420, .4, .14, "noise", 420); v.tone(500, .3, .06, "sine", 180) },
  wolf: v => glide(v, 600, 260, .4, .09, "sine", .03, 4),
  guard: v => { v.tone(1200, .2, .12, "noise"); v.tone(100, .3, .14, "sawtooth", 50) },
  imp: v => v.tone(1600, .25, .09, "square", 300),
  mage: v => { v.tone(700, .4, .1, "sine", 120); v.chime([88, 84, 81], .05, .06) },
  shaman: v => v.tone(260, .35, .1, "triangle", 90),
  necromancer: v => { glide(v, 300, 90, .7, .08, "sawtooth", .04, 6) },
  wraith: v => glide(v, 700, 160, .7, .09, "sine", .1, 7),
  minotaur: v => { glide(v, 140, 50, .9, .18, "sawtooth", .04, 6) },
  golem: v => { v.tone(60, .7, .2, "sine", 30); clatter(v, 8, 600, .06, .12) },
  troll: v => glide(v, 160, 60, .8, .16, "sawtooth", .05, 6),
  serpent: v => v.tone(4800, .35, .08, "noise", 4800),
  beetle: v => { v.tone(1300, .15, .12, "noise"); v.tone(220, .15, .1, "square", 90) },
  assassin: v => v.tone(500, .3, .1, "sawtooth", 120),
  wisp: v => v.chime([96, 91, 88, 84], .07, .05),
  gargoyle: v => { v.tone(1000, .4, .16, "noise"); clatter(v, 6, 500, .06, .12) },
  mimic: v => { v.tone(420, .1, .14, "noise"); v.chime([74, 81, 86, 93], .12, .05) },
  deathknight: v => { v.tone(55, .9, .24, "sawtooth", 30); v.tone(900, .7, .2, "noise"); v.chime([62, 57, 50], .06, .12) },
}

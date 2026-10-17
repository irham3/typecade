import type { LeadInstrument, PadInstrument } from "./instruments"

/** Who plays: melody lead, sustained pad, optional plucked arpeggio, drum style and crypt bells. */
export interface Ensemble { lead: LeadInstrument; pad: PadInstrument; arpeggio: "lute" | "harp" | null; drums: "war" | "frame" | "forge" | "drive" | "none"; bells: boolean }

/**
 * Original synthesized themes. Each is 8 bars of 16 steps: a root (MIDI) per bar for the
 * bass and pads, and 8 eighth-note melody slots per bar (0 = rest).
 */
export interface MusicTrack {
  name: string
  tempo: number
  roots: readonly number[]
  melody: readonly (readonly number[])[]
  /** Bars (0-7) that use a major third in the pad chord; the rest are minor. */
  majorBars: readonly number[]
  ensemble: Ensemble
}

/** Shifts a whole theme by `semitones` (roots and melody), keeping its shape. */
const transpose = (track: MusicTrack, semitones: number): Pick<MusicTrack, "roots" | "melody"> => ({
  roots: track.roots.map(root => root + semitones),
  melody: track.melody.map(bar => bar.map(note => note && note + semitones)),
})

/*
 * Upbeat themes (player feedback: the old minor-key score felt gloomy and hard to remember).
 * Every depth uses the same singable recipe: a major key, the I–V–vi–IV progression, and a
 * two-bar hook stated, answered, repeated, then a rising cadence back to the top.
 */
const torchlight: MusicTrack = {
  name: "Torchlight Run", tempo: 140, ensemble: { lead: "flute", pad: "strings", arpeggio: "lute", drums: "drive", bells: false }, majorBars: [0, 1, 3, 4, 5, 6, 7],
  roots: [36, 43, 45, 41, 36, 43, 41, 43],
  melody: [[72, 76, 79, 76, 84, 0, 79, 0], [79, 0, 74, 79, 83, 0, 79, 0], [81, 0, 76, 81, 84, 83, 81, 0], [77, 81, 84, 0, 81, 0, 77, 0], [72, 76, 79, 76, 84, 0, 79, 0], [79, 0, 74, 79, 83, 0, 79, 0], [81, 84, 86, 0, 84, 81, 77, 0], [79, 0, 83, 0, 86, 0, 0, 0]],
}

const coinChase: MusicTrack = {
  name: "Coin Chase", tempo: 146, ensemble: { lead: "lute", pad: "strings", arpeggio: "harp", drums: "drive", bells: true }, majorBars: [0, 1, 3, 4, 5, 6, 7],
  roots: [43, 38, 40, 36, 43, 38, 36, 38],
  melody: [[79, 0, 83, 86, 0, 83, 79, 0], [81, 0, 78, 81, 86, 0, 81, 0], [83, 0, 79, 83, 88, 86, 83, 0], [84, 83, 81, 79, 76, 0, 79, 0], [79, 0, 83, 86, 0, 83, 79, 0], [81, 83, 86, 0, 81, 0, 78, 0], [76, 79, 84, 0, 83, 81, 79, 0], [78, 0, 81, 0, 86, 0, 0, 0]],
}

const forgeStomp: MusicTrack = {
  name: "Forge Stomp", tempo: 136, ensemble: { lead: "horn", pad: "organ", arpeggio: "lute", drums: "forge", bells: false }, majorBars: [0, 1, 3, 4, 5, 6, 7],
  roots: [38, 33, 35, 43, 38, 33, 43, 33],
  melody: [[74, 78, 81, 78, 86, 0, 81, 0], [76, 0, 81, 85, 88, 0, 85, 0], [83, 0, 78, 83, 86, 85, 83, 0], [79, 83, 86, 0, 83, 0, 79, 0], [74, 78, 81, 78, 86, 0, 81, 0], [76, 0, 81, 85, 88, 0, 85, 0], [83, 86, 88, 0, 86, 83, 79, 0], [81, 0, 85, 0, 88, 0, 0, 0]],
}

const keep: MusicTrack = { ...torchlight }
const crypt: MusicTrack = { ...coinChase, name: "Lantern Crypt", tempo: 138, ensemble: { lead: "bell", pad: "choir", arpeggio: "harp", drums: "drive", bells: true }, ...transpose(coinChase, -2) }
const foundry: MusicTrack = { ...forgeStomp }
const frost: MusicTrack = { ...torchlight, name: "Snowfield Sprint", tempo: 144, ensemble: { lead: "harp", pad: "choir", arpeggio: "harp", drums: "frame", bells: true }, ...transpose(torchlight, 4) }
const verdant: MusicTrack = { ...coinChase, name: "Verdant Dash", tempo: 142, ensemble: { lead: "flute", pad: "strings", arpeggio: "lute", drums: "drive", bells: false }, ...transpose(coinChase, -7) }

/** The boss duel stays tense (minor) but drives hard. */
const boss: MusicTrack = {
  name: "Obsidian Duel", tempo: 150, ensemble: { lead: "horn", pad: "choir", arpeggio: "lute", drums: "war", bells: true }, majorBars: [3, 7],
  roots: [36, 36, 39, 41, 36, 36, 44, 43],
  melody: [[72, 0, 72, 75, 0, 74, 72, 0], [79, 0, 77, 75, 74, 0, 72, 0], [75, 0, 79, 0, 82, 80, 79, 0], [77, 0, 80, 0, 79, 77, 75, 74], [72, 75, 79, 0, 84, 0, 82, 80], [79, 0, 77, 0, 75, 74, 72, 0], [80, 0, 79, 77, 75, 0, 80, 0], [79, 0, 0, 83, 0, 0, 79, 0]],
}

/** The title plays the main hook brightly, at a relaxed but bouncy pace. */
const title: MusicTrack = { ...torchlight, name: "The Ruined Keep", tempo: 118, ensemble: { lead: "harp", pad: "strings", arpeggio: "lute", drums: "none", bells: true } }

/** One theme per depth, cycling with the depth palette. */
export const depthTracks: readonly MusicTrack[] = [keep, crypt, foundry, frost, verdant]
export const titleTrack = title
export const bossTrack = boss

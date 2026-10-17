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
  lead: OscillatorType
}

const keep: MusicTrack = {
  name: "Siege of the Keep", tempo: 112, lead: "triangle", majorBars: [2, 3, 6, 7],
  roots: [38, 34, 41, 36, 43, 34, 33, 33],
  melody: [[74, 0, 77, 81, 79, 77, 76, 0], [74, 77, 81, 0, 82, 81, 77, 0], [72, 0, 77, 79, 81, 79, 77, 0], [76, 79, 84, 0, 82, 79, 76, 0], [79, 0, 82, 86, 84, 82, 81, 0], [77, 81, 82, 0, 81, 77, 74, 0], [76, 0, 73, 76, 81, 79, 76, 73], [74, 0, 0, 77, 76, 73, 69, 0]],
}

const crypt: MusicTrack = {
  name: "Hollow Crypt", tempo: 98, lead: "sine", majorBars: [],
  roots: [40, 41, 40, 38, 40, 41, 43, 40],
  melody: [[76, 0, 77, 0, 76, 74, 72, 0], [77, 0, 76, 77, 79, 0, 77, 0], [76, 0, 0, 72, 71, 0, 72, 74], [74, 0, 72, 0, 71, 69, 0, 0], [79, 0, 77, 76, 77, 0, 76, 0], [77, 0, 79, 81, 79, 77, 76, 0], [79, 81, 83, 0, 81, 79, 77, 76], [76, 0, 0, 0, 77, 0, 76, 0]],
}

const foundry: MusicTrack = {
  name: "Ember Foundry", tempo: 126, lead: "square", majorBars: [3, 7],
  roots: [33, 33, 41, 43, 33, 33, 40, 40],
  melody: [[69, 72, 76, 0, 74, 72, 74, 76], [77, 0, 76, 74, 72, 0, 71, 72], [77, 76, 77, 79, 81, 0, 79, 77], [79, 0, 83, 0, 81, 79, 77, 0], [81, 0, 79, 81, 84, 0, 83, 81], [79, 77, 76, 0, 74, 76, 77, 0], [76, 0, 79, 76, 83, 0, 81, 79], [80, 0, 81, 0, 0, 0, 76, 0]],
}

const frost: MusicTrack = {
  name: "Frostbound Watch", tempo: 106, lead: "sine", majorBars: [1, 5],
  roots: [42, 38, 45, 40, 42, 38, 37, 37],
  melody: [[78, 0, 81, 85, 0, 83, 81, 0], [81, 0, 78, 0, 76, 78, 81, 0], [85, 0, 83, 81, 83, 0, 85, 88], [83, 0, 0, 81, 79, 0, 76, 0], [78, 81, 85, 0, 88, 0, 85, 83], [81, 0, 83, 85, 86, 0, 85, 0], [80, 0, 81, 83, 85, 0, 80, 0], [78, 0, 0, 0, 77, 0, 78, 0]],
}

const verdant: MusicTrack = {
  name: "Verdant Sanctuary", tempo: 116, lead: "triangle", majorBars: [0, 2, 4, 5, 6],
  roots: [43, 41, 36, 43, 40, 41, 43, 38],
  melody: [[79, 0, 83, 86, 0, 84, 83, 0], [81, 0, 84, 0, 81, 79, 77, 0], [76, 79, 84, 0, 83, 81, 79, 0], [79, 0, 83, 0, 86, 0, 83, 79], [76, 0, 79, 83, 81, 0, 79, 0], [77, 81, 84, 0, 86, 84, 81, 0], [83, 0, 86, 88, 86, 0, 83, 0], [81, 0, 79, 0, 78, 0, 79, 0]],
}

const boss: MusicTrack = {
  name: "Obsidian Duel", tempo: 136, lead: "sawtooth", majorBars: [7],
  roots: [36, 36, 39, 41, 36, 36, 44, 43],
  melody: [[72, 0, 72, 75, 0, 74, 72, 0], [79, 0, 77, 75, 74, 0, 72, 0], [75, 0, 79, 0, 82, 80, 79, 0], [77, 0, 80, 0, 79, 77, 75, 74], [72, 75, 79, 0, 84, 0, 82, 80], [79, 0, 77, 0, 75, 74, 72, 0], [80, 0, 79, 77, 75, 0, 80, 0], [79, 0, 0, 83, 0, 0, 79, 0]],
}

const title: MusicTrack = { ...keep, name: "The Ruined Keep", tempo: 84, lead: "sine" }

/** One theme per depth, cycling with the depth palette. */
export const depthTracks: readonly MusicTrack[] = [keep, crypt, foundry, frost, verdant]
export const titleTrack = title
export const bossTrack = boss

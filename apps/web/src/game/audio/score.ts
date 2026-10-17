import type { Orchestra } from "./instruments"
import type { MusicTrack } from "./musicTracks"

/** What the music should express right now. */
export interface ScoreMood {
  /** 0..1 combat intensity, smoothed by the audio engine. */
  energy: number
  /** Out of combat (title, draft, dojo): softer, sparser arrangement. */
  calm: boolean
  /** Title screen plays the melody an octave lower. */
  title: boolean
  /** Upgrade draft: keep the bed, drop the melody. */
  hushed: boolean
  boss: boolean
}

/** Mix levels per part, before the music bus. Tuned against the limiter meter. */
const level = {
  pad: .05, padCalm: .035, bass: .16, bell: .07,
  lead: { lute: .2, harp: .22, horn: .11, flute: .16, bell: .12, organ: .08 },
  arpeggio: .07, drum: { war: .55, tom: .35, frame: .22, anvil: .16, shaker: .07 },
} as const

/** Drum hits per 16-step bar for each style, from sparse (low energy) to dense. */
const drumPatterns = {
  war: { low: [0, 8], mid: [0, 6, 8, 14], high: [0, 3, 6, 8, 11, 14] },
  frame: { low: [0], mid: [0, 6, 8, 11], high: [0, 3, 6, 8, 10, 11, 14] },
  forge: { low: [0, 8], mid: [0, 8], high: [0, 6, 8, 14] },
} as const

/**
 * Schedules one 16th-note step of the current theme: pad chord and bowed bass at the bar
 * line, melody on 8ths, a plucked arpeggio on off-beats, and drums that thicken with energy.
 */
export function playScoreStep(orchestra: Orchestra, track: MusicTrack, step: number, at: number, stepSeconds: number, mood: ScoreMood) {
  const index = step % 16, bar = Math.floor(step / 16) % 8, root = track.roots[bar]!
  const third = track.majorBars.includes(bar) ? 4 : 3
  const chord = [root + 24, root + 24 + third, root + 31]
  const barSeconds = stepSeconds * 16
  const { ensemble } = track

  if (index === 0) {
    const padLevel = mood.calm ? level.padCalm : level.pad
    if (ensemble.pad === "choir") orchestra.choir(chord, at, barSeconds * .98, padLevel)
    else if (ensemble.pad === "organ") orchestra.organ(chord, at, barSeconds * .98, padLevel * 1.4)
    else for (const midi of chord) orchestra.strings(midi, at, barSeconds * .98, padLevel * .8)
    orchestra.strings(root + 12, at, barSeconds * .95, level.bass * (mood.calm ? .7 : 1), -.2)
    if (ensemble.bells && bar % 2 === 0) orchestra.bell(root + 48, at, level.bell, .3)
  }

  if (index % 2 === 0 && !mood.hushed) {
    const note = track.melody[bar]![index / 2]!
    if (note) playLead(orchestra, track, note - (mood.title ? 12 : 0), at, stepSeconds * 2, index % 4 ? .22 : -.22)
  }

  if (ensemble.arpeggio && index % 2 === 1 && (mood.calm || mood.energy > .25)) {
    const tones = [root + 36, root + 36 + third, root + 43, root + 48]
    orchestra.pluck(tones[Math.floor(index / 2) % 4]!, at, stepSeconds * 3, level.arpeggio * (mood.calm ? .8 : .6 + mood.energy * .6), .35, ensemble.arpeggio === "harp" ? 1.4 : .9)
  }

  if (!mood.calm && ensemble.drums !== "none") playDrums(orchestra, ensemble.drums, index, bar, at, mood)
}

function playLead(orchestra: Orchestra, track: MusicTrack, midi: number, at: number, length: number, pan: number) {
  const { lead } = track.ensemble
  switch (lead) {
    case "lute": orchestra.pluck(midi, at, length * 2.2, level.lead.lute, pan, .9); break
    case "harp": orchestra.pluck(midi, at, length * 3, level.lead.harp, pan, 1.5); break
    case "horn": orchestra.horn(midi - 12, at, length * 1.6, level.lead.horn, pan); break
    case "flute": orchestra.flute(midi, at, length * 1.5, level.lead.flute, pan); break
    case "bell": orchestra.bell(midi, at, level.lead.bell, pan); break
    case "organ": orchestra.organ([midi], at, length * 1.5, level.lead.organ); break
  }
}

function playDrums(orchestra: Orchestra, style: "war" | "frame" | "forge", index: number, bar: number, at: number, mood: ScoreMood) {
  const tier = mood.boss || mood.energy > .7 ? "high" : mood.energy > .35 ? "mid" : "low"
  const hits: readonly number[] = drumPatterns[style][tier]
  if (hits.includes(index)) {
    if (style === "frame") orchestra.drum("frame", at, level.drum.frame, index % 8 ? .3 : -.1)
    else orchestra.drum("war", at, level.drum.war * (index === 0 ? 1 : .75), 0)
  }
  // Forge: anvil strikes on the backbeat, like smiths keeping time.
  if (style === "forge" && (index === 4 || index === 12)) orchestra.drum("anvil", at, level.drum.anvil, index === 4 ? -.4 : .4)
  // Tom fill closing every fourth bar once the fight is on.
  if (tier !== "low" && bar % 4 === 3 && index >= 12) orchestra.drum("tom", at, level.drum.tom, (index - 13.5) * .3)
  if (tier === "high" && index % 2 === 1) orchestra.drum("shaker", at, level.drum.shaker, index % 4 === 1 ? -.4 : .4)
}

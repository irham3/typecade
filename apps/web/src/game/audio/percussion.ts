/** Schedules one percussion voice on the music bus at an absolute audio time. */
export type DrumHit = (frequency: number, duration: number, level: number, type: OscillatorType | "noise", end: number, at: number, pan: number) => void

/** 16-step patterns per intensity tier; 1 = hit. */
const kick = [
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
] as const
const snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] as const

/**
 * Driving combat percussion that thickens with pressure: kick density rises with
 * energy, offbeat hats appear mid-fight, and a tom fill closes every fourth bar in boss fights.
 */
export function schedulePercussion(hit: DrumHit, step: number, at: number, energy: number, boss: boolean) {
  const index = step % 16, bar = Math.floor(step / 16)
  const tier = energy > .7 || boss ? 2 : energy > .35 ? 1 : 0
  if (kick[tier]![index]) hit(150, .18, .3, "sine", 45, at, 0)
  if (snare[index] && energy > .2) { hit(1900, .14, .12 + energy * .06, "noise", 1900, at, 0); hit(210, .09, .08, "triangle", 120, at, 0) }
  if (energy > .35 && index % 2 === 1) hit(8200, .03, .03 + energy * .02, "noise", 8200, at, index % 4 === 1 ? -.35 : .35)
  if (boss && bar % 4 === 3 && index >= 12) hit(240 - (index - 12) * 30, .2, .16, "sine", 90 - (index - 12) * 8, at, (index - 13.5) * .3)
}

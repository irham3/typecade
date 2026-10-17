import type { EnemyKind } from "../../contracts/src/survival"

/**
 * Wave director. Pacing is a pure function of run time, so it is deterministic, needs no
 * save state, and the HUD can read the same phase the simulation uses.
 *
 * After a gentle opening, every 60s cycle runs: build (pressure ramps) → surge (themed
 * pack, faster spawns, hasted foes) → breather (short calm to loot and recover).
 */
export const waveTuning = {
  openingEnd: 45,
  cycle: 60,
  surgeStart: 40,
  surgeLength: 13,
  /** Every Nth surge brings an elite once one is unlocked. */
  eliteEvery: 3,
} as const

export type WavePhase = "opening" | "build" | "surge" | "breather"

export interface WaveState {
  phase: WavePhase
  /** Index of the current 60s cycle (0 = first after the opening); -1 during the opening. */
  cycle: number
  /** 0..1 progress through the current phase. */
  progress: number
}

export interface PaceModifiers {
  /** Multiplies spawn frequency (higher = more frequent). */
  spawnRate: number
  /** Added to the simultaneous threat cap. */
  threatBonus: number
  /** Multiplies enemy movement speed. */
  haste: number
}

export function waveAt(time: number): WaveState {
  const { openingEnd, cycle, surgeStart, surgeLength } = waveTuning
  if (time < openingEnd) return { phase: "opening", cycle: -1, progress: time / openingEnd }
  const index = Math.floor((time - openingEnd) / cycle), t = (time - openingEnd) % cycle
  if (t < surgeStart) return { phase: "build", cycle: index, progress: t / surgeStart }
  if (t < surgeStart + surgeLength) return { phase: "surge", cycle: index, progress: (t - surgeStart) / surgeLength }
  return { phase: "breather", cycle: index, progress: (t - surgeStart - surgeLength) / (cycle - surgeStart - surgeLength) }
}

export function paceFor(wave: WaveState): PaceModifiers {
  switch (wave.phase) {
    case "build": return { spawnRate: .9 + wave.progress * .4, threatBonus: Math.floor(wave.progress * 3), haste: 1 }
    case "surge": return { spawnRate: 2.1, threatBonus: 6, haste: 1.15 }
    case "breather": return { spawnRate: .35, threatBonus: -2, haste: .92 }
    default: return { spawnRate: 1, threatBonus: 0, haste: 1 }
  }
}

/** Themed group that arrives together from one direction. */
export interface Pack { name: string; kind: EnemyKind; count: number; unlock: number }

export const packs: readonly Pack[] = [
  { name: "Skeleton phalanx", kind: "skeleton", count: 5, unlock: 0 },
  { name: "Rat swarm", kind: "rat", count: 6, unlock: 15 },
  { name: "Bat flock", kind: "bat", count: 5, unlock: 25 },
  { name: "Spider brood", kind: "spider", count: 4, unlock: 45 },
  { name: "Sporeling patch", kind: "sporeling", count: 4, unlock: 50 },
  { name: "Wolf pack", kind: "wolf", count: 3, unlock: 60 },
  { name: "Ghoul horde", kind: "ghoul", count: 4, unlock: 75 },
  { name: "Imp coven", kind: "imp", count: 3, unlock: 90 },
  { name: "Gargoyle flight", kind: "gargoyle", count: 2, unlock: 135 },
]

export const elites: readonly { kind: EnemyKind; unlock: number }[] = [
  { kind: "minotaur", unlock: 150 },
  { kind: "deathknight", unlock: 240 },
  { kind: "golem", unlock: 300 },
  { kind: "troll", unlock: 300 },
]

/** Pack (and optional elite) for the surge of a given cycle. Depth adds members. */
export function surgeLineup(time: number, cycle: number, depth: number, random: () => number) {
  const open = packs.filter(pack => pack.unlock <= time)
  const pack = open[Math.floor(random() * open.length)]!
  const unlockedElites = elites.filter(elite => elite.unlock <= time)
  const eliteDue = cycle % waveTuning.eliteEvery === waveTuning.eliteEvery - 1 && unlockedElites.length > 0
  return {
    pack: { ...pack, count: pack.count + Math.min(3, depth) },
    elite: eliteDue ? unlockedElites[Math.floor(random() * unlockedElites.length)]!.kind : null,
  }
}

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

/** Snapshot of how strong the hero's build is; each point is roughly one meaningful upgrade. */
export interface BuildPower { level: number; weaponRanks: number; relicRanks: number; skillRanks: number }

export interface PressureModifiers extends PaceModifiers {
  /** Chance (0..1) a newly spawned regular foe gets one extra armor word. */
  extraArmorChance: number
}

/** Tuning for build-scaled pressure; caps keep late runs hard but fair. */
export const pressureTuning = {
  /** Upgrades (beyond the starting kit) needed before pressure starts to climb. */
  grace: 2,
  threatPerPower: .9,
  maxThreatBonus: 14,
  spawnRatePerPower: .06,
  maxSpawnRate: 2,
  hastePerPower: .014,
  maxHaste: 1.22,
  armorPerPower: .04,
  maxArmorChance: .45,
} as const

/** Starting kit: level 1 (worth half a point) and three rank-1 skills. */
const BASELINE_POWER = .5 + 3
/** Levels arrive quickly and mostly feed drafts, which are already counted; weight them lightly. */
const LEVEL_WEIGHT = .5

export function buildPowerScore({ level, weaponRanks, relicRanks, skillRanks }: BuildPower) {
  return Math.max(0, level * LEVEL_WEIGHT + weaponRanks * 1.5 + relicRanks + skillRanks - BASELINE_POWER - pressureTuning.grace)
}

/**
 * Raises the wave director's baseline to match the hero's build, so collecting weapons
 * and relics keeps the fight tense instead of trivial. Multiplies onto `paceFor`.
 */
export function pressureFor(pace: PaceModifiers, power: number): PressureModifiers {
  const t = pressureTuning
  return {
    spawnRate: pace.spawnRate * Math.min(t.maxSpawnRate, 1 + power * t.spawnRatePerPower),
    threatBonus: pace.threatBonus + Math.min(t.maxThreatBonus, Math.floor(power * t.threatPerPower)),
    haste: pace.haste * Math.min(t.maxHaste, 1 + power * t.hastePerPower),
    extraArmorChance: Math.min(t.maxArmorChance, power * t.armorPerPower),
  }
}

/**
 * Reading of the player's typing speed, used so the horde fits the person at the keyboard:
 * slow typists get fewer, slower foes; fast typists get more from the start. The estimate
 * blends the run's correct keystrokes with a reference prior, so the first seconds do not
 * swing it, and it depends only on simulation inputs (deterministic in replays).
 */
export const adaptiveTuning = {
  referenceWpm: 50,
  /** Minutes of reference-speed typing assumed before any keys are pressed. */
  priorMinutes: .75,
  minFactor: .4,
  maxFactor: 2,
} as const

export function typingFactor(correctKeys: number, seconds: number) {
  const t = adaptiveTuning
  const wpm = (correctKeys / 5 + t.referenceWpm * t.priorMinutes) / (seconds / 60 + t.priorMinutes)
  return Math.min(t.maxFactor, Math.max(t.minFactor, wpm / t.referenceWpm))
}

/**
 * Endless escalation. Past the warm-up stretch the keep keeps getting worse at a slow, steady
 * rate with no ceiling on the clock, so every run eventually ends however good the build is.
 */
export const endlessTuning = {
  /** Seconds before escalation starts (after the second boss). */
  start: 600,
  spawnRatePerMinute: .05,
  threatPerMinute: 1,
  hastePerMinute: .016,
  maxHaste: 1.6,
  armorPerMinute: .03,
  maxArmorChance: .75,
} as const

export interface AdaptiveModifiers extends PressureModifiers {
  /** Multiplies the phase's base threat cap before bonuses. */
  threatScale: number
}

/** Fits build pressure to the typist, then layers on the endless escalation. */
export function adaptPressure(pressure: PressureModifiers, factor: number, time: number): AdaptiveModifiers {
  const e = endlessTuning, heat = Math.max(0, (time - e.start) / 60)
  return {
    spawnRate: pressure.spawnRate * (.55 + .45 * factor) * (1 + heat * e.spawnRatePerMinute),
    threatBonus: Math.round(pressure.threatBonus * factor) + Math.floor(heat * e.threatPerMinute),
    threatScale: Math.min(1.5, .45 + .55 * factor),
    haste: pressure.haste * (.8 + .2 * Math.min(1.4, factor)) * Math.min(e.maxHaste, 1 + heat * e.hastePerMinute),
    extraArmorChance: Math.min(e.maxArmorChance, pressure.extraArmorChance * Math.min(1.5, factor) + heat * e.armorPerMinute),
  }
}

/**
 * Shortest gap between any two enemy shots (seconds). Ranged foes share it, so a room full of
 * archers fires a readable rhythm instead of a wall of arrows; faster typists and later minutes
 * shorten it.
 */
export function rangedGap(factor: number, time: number) {
  const heat = Math.max(0, (time - endlessTuning.start) / 60)
  return Math.max(.45, 2.6 / factor * Math.pow(.97, heat))
}

/** Extra foes per spawn wave once the endless escalation is running. */
export function endlessBatch(time: number) {
  return Math.floor(Math.max(0, (time - endlessTuning.start) / 60) / 4)
}

/** Seconds without taking damage before one heart returns. Rewards clean play without making it free. */
export const SECOND_WIND_SECONDS = 20

const endlessHeat = (time: number) => Math.max(0, (time - endlessTuning.start) / 60)

/** Veteran foes: one more word layer every seven minutes of escalation (up to three). */
export function endlessLayers(time: number) {
  return Math.min(3, Math.floor(endlessHeat(time) / 7))
}

/** Melee hits cost two hearts once the escalation has run for eighteen minutes (minute 28). */
export function endlessHitDamage(time: number) {
  return endlessHeat(time) >= 18 ? 2 : 1
}

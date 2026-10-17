import type { DungeonState, RunTalents, TalentId } from "../../contracts/src/survival"
import { talentById, talentTree } from "../../content/src/talents"

export const TALENT_PROFILE_VERSION = 1

/** Permanent progression between runs: an Ember purse and the ranks bought on the skill tree. */
export interface TalentProfile {
  version: typeof TALENT_PROFILE_VERSION
  embers: number
  /** Embers ever earned; shown as lifetime progress, never spent. */
  lifetime: number
  ranks: Readonly<Partial<Record<TalentId, number>>>
  /** Seeds of runs already paid out, so a reload never pays twice. Most recent last. */
  paidRuns: readonly string[]
}

/**
 * Ember rewards. A first 2–3 minute death pays ~15–25 (enough for the root and one more node);
 * a run through the first boss pays ~100. Bosses weigh most, so pushing deeper is what pays.
 */
export const emberTuning = { perSeconds: 15, perKills: 10, perWords: 20, perBoss: 25, minSeconds: 30, paidRunMemory: 30, maxPerRun: 2000 } as const

export function createTalentProfile(): TalentProfile {
  return { version: TALENT_PROFILE_VERSION, embers: 0, lifetime: 0, ranks: {}, paidRuns: [] }
}

export const rankOf = (ranks: Readonly<Partial<Record<TalentId, number>>>, id: TalentId) => ranks[id] ?? 0

export type EmberSource = "time" | "kills" | "words" | "bosses" | "bounty"
export interface EmberBreakdown { lines: readonly { source: EmberSource; amount: number }[]; total: number }

/** Where a run's Embers come from. Bosses beaten equal depths cleared (biome index). */
export function emberBreakdown(run: Pick<DungeonState, "time" | "kills" | "words" | "biome">, bounty = 0): EmberBreakdown {
  if (run.time < emberTuning.minSeconds) return { lines: [], total: 0 }
  const base = ([
    ["time", run.time / emberTuning.perSeconds], ["kills", run.kills / emberTuning.perKills],
    ["words", run.words / emberTuning.perWords], ["bosses", run.biome * emberTuning.perBoss],
  ] as const).map(([source, raw]) => ({ source, amount: Math.floor(raw) }))
  const sum = base.reduce((total, line) => total + line.amount, 0)
  const bonus = Math.floor(sum * bounty * .15)
  const lines = bonus ? [...base, { source: "bounty" as const, amount: bonus }] : base
  return { lines, total: Math.min(emberTuning.maxPerRun, sum + bonus) }
}

export interface EmberPayout { profile: TalentProfile; earned: number }

/** Pays a finished run once; Bounty is read from the ranks the run itself started with. */
export function payOutEmbers(profile: TalentProfile, seed: string, run: Pick<DungeonState, "time" | "kills" | "words" | "biome" | "talents">): EmberPayout {
  if (profile.paidRuns.includes(seed)) return { profile, earned: 0 }
  const earned = emberBreakdown(run, rankOf(run.talents.ranks, "bounty")).total
  return {
    earned,
    profile: { ...profile, embers: profile.embers + earned, lifetime: profile.lifetime + earned, paidRuns: [...profile.paidRuns, seed].slice(-emberTuning.paidRunMemory) },
  }
}

export type TalentStatus = "owned" | "maxed" | "available" | "locked" | "poor"

/** Whether the next rank of a node can be bought right now. */
export function talentStatus(profile: TalentProfile, id: TalentId): TalentStatus {
  const node = talentById(id)!, rank = rankOf(profile.ranks, id)
  if (rank >= node.costs.length) return "maxed"
  if (node.requires && rankOf(profile.ranks, node.requires) < 1) return "locked"
  return profile.embers < node.costs[rank]! ? "poor" : "available"
}

export function nextTalentCost(profile: TalentProfile, id: TalentId): number | null {
  return talentById(id)?.costs[rankOf(profile.ranks, id)] ?? null
}

export type TalentPurchase = { ok: true; profile: TalentProfile } | { ok: false; reason: "unknown" | "maxed" | "locked" | "embers" }

export function buyTalent(profile: TalentProfile, id: string): TalentPurchase {
  const node = talentById(id)
  if (!node) return { ok: false, reason: "unknown" }
  const status = talentStatus(profile, node.id)
  if (status === "maxed") return { ok: false, reason: "maxed" }
  if (status === "locked") return { ok: false, reason: "locked" }
  if (status === "poor") return { ok: false, reason: "embers" }
  const cost = node.costs[rankOf(profile.ranks, node.id)]!
  return { ok: true, profile: { ...profile, embers: profile.embers - cost, ranks: { ...profile.ranks, [node.id]: rankOf(profile.ranks, node.id) + 1 } } }
}

/** Embers spent so far across the tree. */
export function spentEmbers(profile: TalentProfile) {
  return talentTree.reduce((total, node) => total + node.costs.slice(0, rankOf(profile.ranks, node.id)).reduce((sum, cost) => sum + cost, 0), 0)
}

/** Refunds every rank. Lets players re-plan the tree without losing what they earned. */
export function resetTalents(profile: TalentProfile): TalentProfile {
  return { ...profile, embers: profile.embers + spentEmbers(profile), ranks: {} }
}

/** The bonuses a new run starts with. Only valid, in-range ranks pass. */
export function runTalentsFor(ranks: Readonly<Partial<Record<TalentId, number>>>): RunTalents {
  const clean: Partial<Record<TalentId, number>> = {}
  for (const node of talentTree) { const rank = ranks[node.id]; if (Number.isInteger(rank) && rank! > 0) clean[node.id] = Math.min(rank!, node.costs.length) }
  return { ranks: clean, lastStand: rankOf(clean, "laststand") }
}

export const noTalents = (): RunTalents => ({ ranks: {}, lastStand: 0 })

/** Validates talents carried in a saved run. */
export function areRunTalentsValid(talents: unknown): talents is RunTalents {
  if (typeof talents !== "object" || talents === null) return false
  const t = talents as RunTalents
  if (typeof t.ranks !== "object" || t.ranks === null || !Number.isInteger(t.lastStand) || t.lastStand < 0 || t.lastStand > rankOf(t.ranks, "laststand")) return false
  return Object.entries(t.ranks).every(([id, rank]) => { const node = talentById(id); return !!node && Number.isInteger(rank) && rank! >= 1 && rank! <= node.costs.length })
}

/** Validates untrusted saved data; anything malformed falls back to a fresh profile (never throws). */
export function restoreTalentProfile(raw: string | null): TalentProfile {
  if (!raw || raw.length > 20_000) return createTalentProfile()
  try {
    const data = JSON.parse(raw) as Partial<TalentProfile>
    if (data?.version !== TALENT_PROFILE_VERSION) return createTalentProfile()
    const count = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 100_000_000 ? value as number : 0
    const ranks = runTalentsFor(typeof data.ranks === "object" && data.ranks !== null ? data.ranks : {}).ranks
    // A rank whose prerequisite is missing is dropped (and stays dropped: nothing refunds a forged save).
    for (const node of talentTree) if (node.requires && !rankOf(ranks, node.requires)) delete ranks[node.id]
    const paidRuns = Array.isArray(data.paidRuns) ? data.paidRuns.filter(seed => typeof seed === "string" && seed.length <= 200).slice(-emberTuning.paidRunMemory) : []
    return { version: TALENT_PROFILE_VERSION, embers: count(data.embers), lifetime: count(data.lifetime), ranks, paidRuns }
  } catch {
    return createTalentProfile()
  }
}

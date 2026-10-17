import type { DungeonState } from "../../contracts/src/survival"
import { cosmeticById, cosmetics, defaultLoadout, heroSlots, type HeroSlot } from "../../content/src/cosmetics"

export const PROFILE_VERSION = 1

/** Persistent meta-progression: coin wallet, owned cosmetics and the equipped look. */
export interface HeroProfile {
  version: typeof PROFILE_VERSION
  coins: number
  owned: readonly string[]
  loadout: Readonly<Record<HeroSlot, string>>
  /** Seeds of runs already paid out, so a reload never pays twice. Most recent last. */
  paidRuns: readonly string[]
  /** UTC day (YYYY-MM-DD) of the last first-run-of-the-day bonus. */
  bonusDay: string
}

/** Coin rewards. A 4-minute run earns ~300, a long 10-minute run hits the 900 cap; legendaries take 50+ long runs. */
export const coinTuning = { perSecond: .6, perKill: .5, perLevel: 6, perGold: .05, firstRunOfDay: 150, maxPerRun: 900, minSeconds: 30, paidRunMemory: 30 } as const

const starterIds = cosmetics.filter(entry => entry.price === 0).map(entry => entry.id)

export function createHeroProfile(): HeroProfile {
  return { version: PROFILE_VERSION, coins: 0, owned: starterIds, loadout: { ...defaultLoadout }, paidRuns: [], bonusDay: "" }
}

export type CoinSource = "time" | "kills" | "level" | "gold"
export interface CoinBreakdown { lines: readonly { source: CoinSource; amount: number }[]; total: number; capped: boolean }

/** Where a run's coins come from, line by line, so the result screen can show the sum. */
export function coinBreakdown(run: Pick<DungeonState, "time" | "kills" | "level" | "gold">): CoinBreakdown {
  if (run.time < coinTuning.minSeconds) return { lines: [], total: 0, capped: false }
  const lines = ([
    ["time", run.time * coinTuning.perSecond], ["kills", run.kills * coinTuning.perKill],
    ["level", run.level * coinTuning.perLevel], ["gold", run.gold * coinTuning.perGold],
  ] as const).map(([source, raw]) => ({ source, amount: Math.round(raw) }))
  const sum = lines.reduce((total, line) => total + line.amount, 0)
  return { lines, total: Math.min(coinTuning.maxPerRun, sum), capped: sum > coinTuning.maxPerRun }
}

/** Coins earned by a finished run. Very short runs (quits) earn nothing. */
export function coinsForRun(run: Pick<DungeonState, "time" | "kills" | "level" | "gold">): number {
  return coinBreakdown(run).total
}

export interface RunPayout { profile: HeroProfile; earned: number; bonus: number }

/** Pays a finished run once. Returns the same profile and zero when that run was already paid. */
export function payOutRun(profile: HeroProfile, seed: string, run: Pick<DungeonState, "time" | "kills" | "level" | "gold">, today: string): RunPayout {
  if (profile.paidRuns.includes(seed)) return { profile, earned: 0, bonus: 0 }
  const earned = coinsForRun(run)
  const bonus = earned > 0 && profile.bonusDay !== today ? coinTuning.firstRunOfDay : 0
  return {
    earned, bonus,
    profile: {
      ...profile,
      coins: profile.coins + earned + bonus,
      paidRuns: [...profile.paidRuns, seed].slice(-coinTuning.paidRunMemory),
      bonusDay: bonus ? today : profile.bonusDay,
    },
  }
}

export type PurchaseResult = { ok: true; profile: HeroProfile } | { ok: false; reason: "unknown" | "owned" | "coins" }

export function purchase(profile: HeroProfile, itemId: string): PurchaseResult {
  const entry = cosmeticById(itemId)
  if (!entry) return { ok: false, reason: "unknown" }
  if (profile.owned.includes(itemId)) return { ok: false, reason: "owned" }
  if (profile.coins < entry.price) return { ok: false, reason: "coins" }
  return { ok: true, profile: { ...profile, coins: profile.coins - entry.price, owned: [...profile.owned, itemId] } }
}

/** Equips an owned item into its slot; unknown or unowned items leave the profile unchanged. */
export function equip(profile: HeroProfile, itemId: string): HeroProfile {
  const entry = cosmeticById(itemId)
  if (!entry || !profile.owned.includes(itemId)) return profile
  return { ...profile, loadout: { ...profile.loadout, [entry.slot]: itemId } }
}

/** Validates untrusted saved data; anything malformed falls back to a fresh profile (never throws). */
export function restoreHeroProfile(raw: string | null): HeroProfile {
  if (!raw || raw.length > 20_000) return createHeroProfile()
  try {
    const data = JSON.parse(raw) as Partial<HeroProfile>
    if (data?.version !== PROFILE_VERSION) return createHeroProfile()
    const coins = Number.isSafeInteger(data.coins) && data.coins! >= 0 && data.coins! <= 100_000_000 ? data.coins! : 0
    const owned = [...new Set([...starterIds, ...(Array.isArray(data.owned) ? data.owned.filter(id => typeof id === "string" && cosmeticById(id)) : [])])]
    const loadout = Object.fromEntries(heroSlots.map(({ id: slot }) => {
      const chosen = data.loadout?.[slot]
      const valid = typeof chosen === "string" && owned.includes(chosen) && cosmeticById(chosen)?.slot === slot
      return [slot, valid ? chosen : defaultLoadout[slot]]
    })) as Record<HeroSlot, string>
    const paidRuns = Array.isArray(data.paidRuns) ? data.paidRuns.filter(seed => typeof seed === "string" && seed.length <= 200).slice(-coinTuning.paidRunMemory) : []
    const bonusDay = typeof data.bonusDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.bonusDay) ? data.bonusDay : ""
    return { version: PROFILE_VERSION, coins, owned, loadout, paidRuns, bonusDay }
  } catch {
    return createHeroProfile()
  }
}

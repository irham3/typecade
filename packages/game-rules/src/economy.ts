import type { DungeonState } from "../../contracts/src/survival"
import { cosmeticById, cosmetics, defaultLoadout, heroKits, heroSlots, kitLoadout, type HeroSlot } from "../../content/src/cosmetics"

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
  /** Each hero's own saved look, so switching heroes never loses an outfit. Missing heroes wear their kit. */
  looks: Readonly<Record<string, Readonly<Record<HeroSlot, string>>>>
}

/** Coin rewards. A 4-minute run earns ~300, a long 10-minute run hits the 900 cap; legendaries take 50+ long runs. */
export const coinTuning = { perSecond: .6, perKill: .5, perLevel: 6, perGold: .05, firstRunOfDay: 150, maxPerRun: 900, minSeconds: 30, paidRunMemory: 30 } as const

const starterIds = cosmetics.filter(entry => entry.price === 0).map(entry => entry.id)

export function createHeroProfile(): HeroProfile {
  return { version: PROFILE_VERSION, coins: 0, owned: starterIds, loadout: { ...defaultLoadout }, paidRuns: [], bonusDay: "", looks: {} }
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
  // A hero comes with its whole signature outfit.
  const unlocked = entry.slot === "hero" ? [itemId, ...Object.values(heroKits[itemId] ?? {})] : [itemId]
  return { ok: true, profile: { ...profile, coins: profile.coins - entry.price, owned: [...new Set([...profile.owned, ...unlocked])] } }
}

/** The look a hero wears when chosen: its saved outfit, else its signature kit. */
export function lookFor(profile: HeroProfile, heroId: string): Readonly<Record<HeroSlot, string>> {
  return profile.looks[heroId] ?? kitLoadout(heroId)
}

/** Equips an owned item into its slot; unknown or unowned items leave the profile unchanged. */
export function equip(profile: HeroProfile, itemId: string): HeroProfile {
  const entry = cosmeticById(itemId)
  if (!entry || !profile.owned.includes(itemId)) return profile
  if (entry.slot === "hero") {
    if (profile.loadout.hero === itemId) return profile
    // Store the current hero's outfit, then put on the chosen hero's own look.
    const looks = { ...profile.looks, [profile.loadout.hero]: profile.loadout }
    const next = lookFor(profile, itemId)
    const loadout = Object.fromEntries(heroSlots.map(({ id }) => [id, id === "hero" ? itemId : profile.owned.includes(next[id]) ? next[id] : defaultLoadout[id]])) as Record<HeroSlot, string>
    return { ...profile, loadout, looks }
  }
  const loadout = { ...profile.loadout, [entry.slot]: itemId }
  return { ...profile, loadout, looks: { ...profile.looks, [loadout.hero]: loadout } }
}

/** Validates untrusted saved data; anything malformed falls back to a fresh profile (never throws). */
export function restoreHeroProfile(raw: string | null): HeroProfile {
  if (!raw || raw.length > 20_000) return createHeroProfile()
  try {
    const data = JSON.parse(raw) as Partial<HeroProfile>
    if (data?.version !== PROFILE_VERSION) return createHeroProfile()
    const coins = Number.isSafeInteger(data.coins) && data.coins! >= 0 && data.coins! <= 100_000_000 ? data.coins! : 0
    const saved = Array.isArray(data.owned) ? data.owned.filter((id): id is string => typeof id === "string" && !!cosmeticById(id)) : []
    // Owning a hero always includes its signature outfit (older saves bought heroes before kits existed).
    const owned = [...new Set([...starterIds, ...saved, ...saved.flatMap(id => cosmeticById(id)?.slot === "hero" ? Object.values(heroKits[id] ?? {}) : [])])]
    const clean = (raw: unknown, fallback: Readonly<Record<HeroSlot, string>>) => Object.fromEntries(heroSlots.map(({ id: slot }) => {
      const chosen = (raw as Partial<Record<HeroSlot, unknown>> | undefined)?.[slot]
      const valid = typeof chosen === "string" && owned.includes(chosen) && cosmeticById(chosen)?.slot === slot
      return [slot, valid ? chosen : fallback[slot]]
    })) as Record<HeroSlot, string>
    const loadout = clean(data.loadout, defaultLoadout)
    const looks: Record<string, Record<HeroSlot, string>> = {}
    if (typeof data.looks === "object" && data.looks !== null) for (const [hero, look] of Object.entries(data.looks)) {
      if (cosmeticById(hero)?.slot === "hero" && owned.includes(hero)) looks[hero] = { ...clean(look, kitLoadout(hero)), hero }
    }
    const paidRuns = Array.isArray(data.paidRuns) ? data.paidRuns.filter(seed => typeof seed === "string" && seed.length <= 200).slice(-coinTuning.paidRunMemory) : []
    const bonusDay = typeof data.bonusDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.bonusDay) ? data.bonusDay : ""
    return { version: PROFILE_VERSION, coins, owned, loadout, paidRuns, bonusDay, looks }
  } catch {
    return createHeroProfile()
  }
}

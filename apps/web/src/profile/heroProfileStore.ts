import { useSyncExternalStore } from "react"
import type { DungeonState } from "@typecade/contracts"
import { equip, payOutRun, purchase, restoreHeroProfile, type HeroProfile, type PurchaseResult } from "@typecade/game-rules"
import { readStorage, writeStorage } from "../storage"

const STORAGE_KEY = "typecade:hero-profile:v1"

const todayUtc = () => new Date().toISOString().slice(0, 10)

/**
 * Local persistence adapter for the hero profile (wallet, owned cosmetics, loadout).
 * Rules live in game-rules/economy; this module only loads, saves and notifies.
 */
class HeroProfileStore {
  private profile: HeroProfile = restoreHeroProfile(readStorage("localStorage", STORAGE_KEY))
  private readonly listeners = new Set<() => void>()

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  readonly getSnapshot = () => this.profile

  buy(itemId: string): PurchaseResult {
    const result = purchase(this.profile, itemId)
    if (result.ok) this.commit(result.profile)
    return result
  }

  equip(itemId: string) { this.commit(equip(this.profile, itemId)) }

  /** Pays a finished run once (keyed by its seed). Returns coins earned and the daily bonus. */
  payOut(seed: string, run: Pick<DungeonState, "time" | "kills" | "level" | "gold">) {
    const payout = payOutRun(this.profile, seed, run, todayUtc())
    if (payout.profile !== this.profile) this.commit(payout.profile)
    return payout
  }

  private commit(next: HeroProfile) {
    if (next === this.profile) return
    this.profile = next
    writeStorage("localStorage", STORAGE_KEY, JSON.stringify(next))
    for (const listener of this.listeners) listener()
  }
}

export const heroProfileStore = new HeroProfileStore()

export function useHeroProfile(): HeroProfile {
  return useSyncExternalStore(heroProfileStore.subscribe, heroProfileStore.getSnapshot)
}

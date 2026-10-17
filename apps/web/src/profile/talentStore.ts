import { useSyncExternalStore } from "react"
import type { DungeonState } from "@typecade/contracts"
import { buyTalent, payOutEmbers, resetTalents, restoreTalentProfile, type TalentProfile, type TalentPurchase } from "@typecade/game-rules"
import { readStorage, writeStorage } from "../storage"

const STORAGE_KEY = "typecade:talents:v1"

/**
 * Local persistence adapter for the skill tree (Ember purse and bought ranks), kept apart from
 * cosmetics and runs. Rules live in game-rules/talents; this module only loads, saves and notifies.
 */
class TalentStore {
  private profile: TalentProfile = restoreTalentProfile(readStorage("localStorage", STORAGE_KEY))
  private readonly listeners = new Set<() => void>()

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  readonly getSnapshot = () => this.profile

  buy(id: string): TalentPurchase {
    const result = buyTalent(this.profile, id)
    if (result.ok) this.commit(result.profile)
    return result
  }

  reset() { this.commit(resetTalents(this.profile)) }

  /** Pays a finished run once (keyed by its seed). Returns the Embers earned. */
  payOut(seed: string, run: Pick<DungeonState, "time" | "kills" | "words" | "biome" | "talents">) {
    const payout = payOutEmbers(this.profile, seed, run)
    if (payout.profile !== this.profile) this.commit(payout.profile)
    return payout.earned
  }

  private commit(next: TalentProfile) {
    if (next === this.profile) return
    this.profile = next
    writeStorage("localStorage", STORAGE_KEY, JSON.stringify(next))
    for (const listener of this.listeners) listener()
  }
}

export const talentStore = new TalentStore()

export function useTalents(): TalentProfile {
  return useSyncExternalStore(talentStore.subscribe, talentStore.getSnapshot)
}

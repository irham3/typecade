import type { OverdrivePresentationEvent } from "./events"
import type { CombatAction } from "@/lib/engine/overdrive"

export type PresentationEventEnvelope<T extends OverdrivePresentationEvent> = {
  sequence: number
  runId: string
  targetOrdinal: number
  emittedAtMs: number
  event: T
}

export type PresentationPriority = "critical" | "tactical" | "decorative"

export type AnimationClipName = 
  | "idle" 
  | "ready" 
  | "chain-1" 
  | "chain-2" 
  | "chain-3" 
  | "dash" 
  | "execute" 
  | "block" 
  | "hurt" 
  | "recover" 
  | "overdrive"
  | "locomotion"
  | "anticipation"
  | "attack"
  | "hit"
  | "defeat"
  | "special"

export type PresentationBeat = {
  beatId: string
  sourceSequence: number
  targetOrdinal: number
  kind:
    | "contact-cue"
    | "rig-clip"
    | "target-hit"
    | "score-equation"
    | "item-proc"
    | "camera-response"
    | "audio-cue"
    | "ambient-effect"
  priority: PresentationPriority
  dueAtMs: number
  expiresAtMs: number | null
	payload: Readonly<Record<string, string | number | boolean>>
	actions?: readonly CombatAction[]
}

export type PresentationHealthSnapshot = Readonly<{
  decorativeDrops: number
  lateCriticalBeats: number
  contactLatencyMs: readonly number[]
  rigLatencyMs: readonly number[]
}>

export interface PresentationScheduler {
  enqueue(envelope: PresentationEventEnvelope<OverdrivePresentationEvent>): void
  drain(nowMs: number): readonly PresentationBeat[]
  reset(runId: string): void
  snapshotHealth(): PresentationHealthSnapshot
}

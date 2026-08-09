import type {
  ItemContribution,
  StageType,
} from "@/lib/engine/overdrive"
import type { PresentationEventEnvelope } from "./scheduler-types"

export type PresentationAdapterContext = {
  runId: string
  targetOrdinal: number
  now: () => number
}

export type OverdrivePresentationEvent =
  | {
      id: number
      type: "accepted-character"
      character: string
      index: number
      word: string
      targetOrdinal: number
      combo: number
      charge: number
    }
  | { id: number; type: "rejected-character"; character: string }
  | {
      id: number;
      type: "word-completed";
      word: string;
      characterBase: number;
      itemBaseBonus: number;
      effectiveBase: number;
      effectiveMult: number;
      finalMultiplier: number;
      scoreGain: number;
      overdriveReleased: boolean;
      aegisRecovery: boolean;
      autoExecuted: boolean;
      appliedItemIds: string[];
      targetOrdinal: number;
      combo: number
    }
  | { id: number; type: "mult-increased"; mult: number }
  | { id: number; type: "stage-entered"; stage: StageType }
  | { id: number; type: "stage-cleared" }
  | { id: number; type: "overdrive-ready" }
  | { id: number; type: "overdrive-intent" }
  | { id: number; type: "aegis-rescue"; rescueNumber: number; timeAddedMs: number }
  | { id: number; type: "run-over" }
  | {
      id: number
      type: "item-triggered"
      itemId: string
      label: string
      contribution: ItemContribution
    }
  | { id: number; type: "macro-used"; itemId: string; result: string }

type PresentationEventInput<T> = T extends { id: number } ? Omit<T, "id"> : never
export type OverdrivePresentationEventInput = PresentationEventInput<OverdrivePresentationEvent>

const MAX_EVENTS = 96
let nextId = 1
let events: OverdrivePresentationEvent[] = []
let envelopes: PresentationEventEnvelope<OverdrivePresentationEvent>[] = []
const listeners = new Set<() => void>()

export function emitPresentationEvent(
  ctx: PresentationAdapterContext,
  event: OverdrivePresentationEventInput,
): PresentationEventEnvelope<OverdrivePresentationEvent> {
  const complete = { ...event, id: nextId++ } as OverdrivePresentationEvent
  const envelope: PresentationEventEnvelope<OverdrivePresentationEvent> = {
    sequence: complete.id,
    runId: ctx.runId,
    targetOrdinal: ctx.targetOrdinal,
    emittedAtMs: ctx.now(),
    event: complete,
  }
  
  events = [...events, complete].slice(-MAX_EVENTS)
  envelopes = [...envelopes, envelope].slice(-MAX_EVENTS)
  
  for (const listener of listeners) listener()
  return envelope
}

export function emitLegacyPresentationEvent(
  event: OverdrivePresentationEventInput,
): OverdrivePresentationEvent {
  const complete = { ...event, id: nextId++ } as OverdrivePresentationEvent
  events = [...events, complete].slice(-MAX_EVENTS)
  for (const listener of listeners) listener()
  return complete
}

export function getPresentationEvents(): readonly OverdrivePresentationEvent[] {
  return events
}

export function getPresentationEnvelopes(): readonly PresentationEventEnvelope<OverdrivePresentationEvent>[] {
  return envelopes
}

export function getLatestPresentationEventId(): number {
  return events.at(-1)?.id ?? 0
}

export function subscribePresentationEvents(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetPresentationEventsForTests(): void {
  nextId = 1
  events = []
  envelopes = []
  for (const listener of listeners) listener()
}

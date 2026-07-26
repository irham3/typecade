import type {
  ItemContribution,
  StageType,
} from "@/lib/engine/overdrive"

export type OverdrivePresentationEvent =
  | {
      id: number
      type: "accepted-character"
      character: string
      index: number
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
const listeners = new Set<() => void>()

export function emitPresentationEvent(
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
  for (const listener of listeners) listener()
}

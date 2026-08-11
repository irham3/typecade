import type { OverdrivePresentationEvent } from "./events"
import { compareBeats } from "./scheduler-policy"
import type {
  PresentationBeat,
  PresentationEventEnvelope,
  PresentationHealthSnapshot,
  PresentationScheduler,
} from "./scheduler-types"
import { presentationHealth } from "./telemetry"
import { characterContactSequence } from "../canvas/choreography/sequences/character-contact"

export type SchedulerOptions = {
  runId: string
  now: () => number
}

export function createPresentationScheduler(opts: SchedulerOptions): PresentationScheduler {
  let currentRunId = opts.runId
  let pendingBeats: PresentationBeat[] = []
  
  let decorativeDrops = 0
  let lateCriticalBeats = 0
  let contactLatencyMs: number[] = []
  let rigLatencyMs: number[] = []

  function enqueue(envelope: PresentationEventEnvelope<OverdrivePresentationEvent>) {
    if (envelope.runId !== currentRunId) return

    const { event, emittedAtMs, sequence, targetOrdinal } = envelope
    
    switch (event.type) {
      case "accepted-character":
			const output = characterContactSequence({
				sequenceId: `accepted-character-${sequence}`,
				targetOrdinal,
				stage: event.stage ?? "warmup",
				zone: 0,
				combo: event.combo,
				character: event.character,
				characterIndex: event.characterIndex ?? event.index,
				word: event.word,
				combatVerb: event.combatVerb ?? "signal-lock",
			})
			for (const beat of output.beats) {
				const kind =
					beat.payload.kind === "contact-cue" || beat.payload.kind === "rig-clip" || beat.payload.kind === "target-hit"
						? beat.payload.kind
						: "target-hit"
				pendingBeats.push({
					beatId: beat.id,
					sourceSequence: sequence,
					targetOrdinal,
					kind,
					priority: beat.priority === "critical" ? "critical" : "tactical",
					dueAtMs: emittedAtMs + beat.dueMs,
					expiresAtMs: null,
					payload: beat.payload,
					actions: event.actions ?? [],
				})
			}
        break
      case "overdrive-ready":
        pendingBeats.push({
          beatId: `fx-${sequence}`,
          sourceSequence: sequence,
          targetOrdinal,
          kind: "ambient-effect",
          priority: "decorative",
          dueAtMs: emittedAtMs,
          expiresAtMs: emittedAtMs + 500,
          payload: { effect: "overdrive-ready" },
        })
        break
      case "item-triggered":
        // tactical aggregation handled later or implicitly pushed
        pendingBeats.push({
          beatId: `item-${sequence}-${event.itemId}`,
          sourceSequence: sequence,
          targetOrdinal,
          kind: "item-proc",
          priority: "tactical",
          dueAtMs: emittedAtMs,
          expiresAtMs: emittedAtMs + 2000,
          payload: { itemId: event.itemId, label: event.label },
        })
        break
      default:
        // Push decorative for other non-critical events for now
        pendingBeats.push({
          beatId: `generic-${sequence}`,
          sourceSequence: sequence,
          targetOrdinal,
          kind: "ambient-effect",
          priority: "decorative",
          dueAtMs: emittedAtMs,
          expiresAtMs: emittedAtMs + 1000,
          payload: { type: event.type },
        })
        break
    }
  }

  function drain(nowMs: number): readonly PresentationBeat[] {
    const readyBeats: PresentationBeat[] = []
    const futureBeats: PresentationBeat[] = []
    for (const beat of pendingBeats) {
      if (beat.priority === "decorative" && beat.expiresAtMs !== null && nowMs >= beat.expiresAtMs) {
        decorativeDrops += 1
        presentationHealth.addDecorativeDrops(1)
      } else if (beat.dueAtMs <= nowMs) {
        readyBeats.push(beat)
      } else {
        futureBeats.push(beat)
      }
    }
    
    readyBeats.sort(compareBeats)
    pendingBeats = futureBeats
    return readyBeats
  }

  function reset(runId: string) {
    currentRunId = runId
    pendingBeats = []
    decorativeDrops = 0
    lateCriticalBeats = 0
    contactLatencyMs = []
    rigLatencyMs = []
  }

  function snapshotHealth(): PresentationHealthSnapshot {
    return {
      decorativeDrops,
      lateCriticalBeats,
      contactLatencyMs: [...contactLatencyMs],
      rigLatencyMs: [...rigLatencyMs],
    }
  }

  return {
    enqueue,
    drain,
    reset,
    snapshotHealth,
  }
}

import { describe, expect, it } from "vitest"
import { createPresentationScheduler } from "../scheduler"
import type { OverdrivePresentationEvent } from "../events"
import type { PresentationEventEnvelope } from "../scheduler-types"

function acceptedEnvelope(sequence: number, targetOrdinal: number): PresentationEventEnvelope<Extract<OverdrivePresentationEvent, { type: "accepted-character" }>> {
  return {
    sequence,
    runId: "run-1",
    targetOrdinal,
    emittedAtMs: 1000,
    event: {
      id: sequence,
      type: "accepted-character",
      character: "a",
      index: sequence - 1,
      word: "aaa",
      targetOrdinal,
      combo: 0,
      charge: 3,
    },
  }
}

function decorativeEnvelope(sequence: number, emittedAtMs: number): PresentationEventEnvelope<Extract<OverdrivePresentationEvent, { type: "overdrive-ready" }>> {
  return {
    sequence,
    runId: "run-1",
    targetOrdinal: 0,
    emittedAtMs,
    event: { id: sequence, type: "overdrive-ready" },
  }
}

describe("createPresentationScheduler", () => {
  it("keeps all accepted-character contacts while dropping expired decoration", () => {
    const scheduler = createPresentationScheduler({ runId: "run-1", now: () => 1_000 })
    for (let sequence = 1; sequence <= 12; sequence += 1) {
      scheduler.enqueue(acceptedEnvelope(sequence, sequence - 1))
    }
    scheduler.enqueue(decorativeEnvelope(13, 500))

    const beats = scheduler.drain(1_050)
    expect(beats.filter((beat) => beat.kind === "contact-cue")).toHaveLength(12)
    expect(beats.some((beat) => beat.kind === "ambient-effect")).toBe(false)
  })

  it("prioritizes critical beats over tactical and decorative", () => {
    // Tests for source ordering and prioritization
    const scheduler = createPresentationScheduler({ runId: "run-1", now: () => 1_000 })
    scheduler.enqueue(decorativeEnvelope(1, 1000))
    scheduler.enqueue(acceptedEnvelope(2, 0))

    const beats = scheduler.drain(1000)
    expect(beats[0].priority).toBe("critical")
    expect(beats[0].kind).toBe("contact-cue")
  })

  it("does not drain future beats before their due time", () => {
    const scheduler = createPresentationScheduler({ runId: "run-1", now: () => 1_000 })
    scheduler.enqueue(acceptedEnvelope(1, 0))

    expect(scheduler.drain(1_010).map((beat) => beat.kind)).toEqual(["contact-cue"])
    expect(scheduler.drain(1_050).map((beat) => beat.kind)).toEqual(["rig-clip"])
    expect(scheduler.drain(1_090).map((beat) => beat.kind)).toEqual(["target-hit"])
  })
})

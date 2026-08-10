import { describe, expect, it } from "vitest"
import {
  emitLegacyPresentationEvent as emitPresentationEvent,
  getPresentationEvents,
  resetPresentationEventsForTests,
} from "../events"

describe("presentation events", () => {
  it("assigns monotonic IDs and retains source order", () => {
    resetPresentationEventsForTests()
    const first = emitPresentationEvent({
      type: "accepted-character",
      character: "s",
      index: 0,
      word: "signal",
      targetOrdinal: 0,
      combo: 0,
      charge: 3,
    })
    const second = emitPresentationEvent({ type: "overdrive-ready" })

    expect(second.id).toBe(first.id + 1)
    expect(getPresentationEvents()).toEqual([first, second])
  })
})

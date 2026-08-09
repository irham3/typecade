import { describe, expect, it } from "vitest"
import { PresentationHealthCollector } from "../telemetry"

describe("PresentationHealthCollector", () => {
  it("reports stage p95 without sending per-character samples", () => {
    const collector = new PresentationHealthCollector()
    for (const value of [10, 12, 14, 16, 18, 20, 22, 24, 26, 60]) {
      collector.recordCueLatency(value)
    }
    const snapshot = collector.flushStage("warmup")
    expect(snapshot.cueLatencyP95Ms).toBe(60)
    expect(snapshot.sampleCount).toBe(10)
    expect(collector.snapshot().sampleCount).toBe(0)
  })
})

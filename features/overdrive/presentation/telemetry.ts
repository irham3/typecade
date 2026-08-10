import type { StageType } from "@/lib/engine/overdrive"

export type PresentationTelemetrySnapshot = {
  scope: "stage" | "run"
  stage: StageType | "run"
  sampleCount: number
  frameP50Ms: number
  frameP95Ms: number
  frameP99Ms: number
  cueLatencyP50Ms: number
  cueLatencyP95Ms: number
  cueLatencyP99Ms: number
  hitLatencyP50Ms: number
  hitLatencyP95Ms: number
  hitLatencyP99Ms: number
  lateCueCount: number
  lateHitCount: number
  decorativeDropCount: number
  peakLiveEffects: number
  peakUnsettledContacts: number
}

function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

export class PresentationHealthCollector {
  private frames: number[] = []
  private cues: number[] = []
  private hits: number[] = []
  private lateCues = 0
  private lateHits = 0
  private drops = 0
  private peakEffects = 0
  private peakUnsettled = 0

  recordFrame(ms: number) {
    this.frames.push(ms)
    if (this.frames.length > 256) this.frames.shift()
  }

  recordCueLatency(ms: number) {
    this.cues.push(ms)
    if (this.cues.length > 256) this.cues.shift()
  }

  recordHitLatency(ms: number) {
    this.hits.push(ms)
    if (this.hits.length > 256) this.hits.shift()
  }

  addLateCues(count: number) {
    this.lateCues += count
  }

  addLateHits(count: number) {
    this.lateHits += count
  }

  addDecorativeDrops(count: number) {
    this.drops += count
  }

  updatePeakEffects(count: number) {
    if (count > this.peakEffects) this.peakEffects = count
  }

  updatePeakUnsettled(count: number) {
    if (count > this.peakUnsettled) this.peakUnsettled = count
  }

  snapshot(): PresentationTelemetrySnapshot {
    return {
      scope: "run",
      stage: "run",
      sampleCount: this.cues.length,
      frameP50Ms: calculatePercentile(this.frames, 50),
      frameP95Ms: calculatePercentile(this.frames, 95),
      frameP99Ms: calculatePercentile(this.frames, 99),
      cueLatencyP50Ms: calculatePercentile(this.cues, 50),
      cueLatencyP95Ms: calculatePercentile(this.cues, 95),
      cueLatencyP99Ms: calculatePercentile(this.cues, 99),
      hitLatencyP50Ms: calculatePercentile(this.hits, 50),
      hitLatencyP95Ms: calculatePercentile(this.hits, 95),
      hitLatencyP99Ms: calculatePercentile(this.hits, 99),
      lateCueCount: this.lateCues,
      lateHitCount: this.lateHits,
      decorativeDropCount: this.drops,
      peakLiveEffects: this.peakEffects,
      peakUnsettledContacts: this.peakUnsettled,
    }
  }

  flushStage(stage: StageType): PresentationTelemetrySnapshot {
    const snap = this.snapshot()
    snap.scope = "stage"
    snap.stage = stage
    
    this.frames = []
    this.cues = []
    this.hits = []
    this.lateCues = 0
    this.lateHits = 0
    this.drops = 0
    this.peakEffects = 0
    this.peakUnsettled = 0

    return snap
  }
}

export const presentationHealth = new PresentationHealthCollector()

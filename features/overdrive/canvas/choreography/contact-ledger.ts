import { presentationHealth } from "../../presentation/telemetry"

export type ContactRecord = {
  sequence: number
  targetOrdinal: number
  characterIndex: number
  acceptedAtMs: number
  cueAtMs: number | null
  hitAtMs: number | null
  settled: boolean
}

export type ContactLedgerSnapshot = {
  settled: ContactRecord[]
  unsettledCount: number
  maxUnsettled: number
  lateCueCount: number
  lateHitCount: number
}

export class ContactLedger {
  private historyLimit: number
  private unsettled = new Map<number, ContactRecord>()
  private settled: ContactRecord[] = []
  private lateCueCount = 0
  private lateHitCount = 0
  private maxUnsettled = 0

  constructor(opts: { historyLimit: number }) {
    this.historyLimit = opts.historyLimit
  }

  get unsettledCount() {
    return this.unsettled.size
  }

  accept(opts: { sequence: number, targetOrdinal: number, characterIndex: number, acceptedAtMs: number }) {
    if (!this.unsettled.has(opts.sequence)) {
      this.unsettled.set(opts.sequence, {
        ...opts,
        cueAtMs: null,
        hitAtMs: null,
        settled: false,
      })
      if (this.unsettled.size > this.maxUnsettled) {
        this.maxUnsettled = this.unsettled.size
        presentationHealth.updatePeakUnsettled(this.maxUnsettled)
      }
    }
  }

  markCue(sequence: number, nowMs: number) {
    const record = this.unsettled.get(sequence)
    if (record) {
      record.cueAtMs = nowMs
      this.checkSettle(sequence, record)
    }
  }

  markHit(sequence: number, nowMs: number) {
    const record = this.unsettled.get(sequence)
    if (record) {
      record.hitAtMs = nowMs
      this.checkSettle(sequence, record)
    }
  }

  private checkSettle(sequence: number, record: ContactRecord) {
    if (record.cueAtMs !== null && record.hitAtMs !== null) {
      record.settled = true
      this.unsettled.delete(sequence)
      
      const cueLatency = record.cueAtMs - record.acceptedAtMs
      const hitLatency = record.hitAtMs - record.acceptedAtMs
      
      presentationHealth.recordCueLatency(cueLatency)
      presentationHealth.recordHitLatency(hitLatency)

      if (cueLatency > 50) {
        this.lateCueCount++
        presentationHealth.addLateCues(1)
      }
      if (hitLatency > 90) {
        this.lateHitCount++
        presentationHealth.addLateHits(1)
      }

      this.settled.push({ ...record })
      if (this.settled.length > this.historyLimit) {
        this.settled.shift()
      }
    }
  }

  snapshot(): ContactLedgerSnapshot {
    return {
      settled: [...this.settled],
      unsettledCount: this.unsettledCount,
      maxUnsettled: this.maxUnsettled,
      lateCueCount: this.lateCueCount,
      lateHitCount: this.lateHitCount,
    }
  }
}

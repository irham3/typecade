import { describe, expect, it } from "vitest"
import { ContactLedger } from "../contact-ledger"

describe("ContactLedger", () => {
  it("settles twelve rapid contacts without dropping identity", () => {
    const ledger = new ContactLedger({ historyLimit: 256 })
    for (let sequence = 1; sequence <= 12; sequence += 1) {
      ledger.accept({ sequence, targetOrdinal: 0, characterIndex: sequence - 1, acceptedAtMs: 0 })
      ledger.markCue(sequence, 20 + sequence)
      ledger.markHit(sequence, 60 + sequence)
    }

    expect(ledger.unsettledCount).toBe(0)
    expect(ledger.snapshot().settled).toHaveLength(12)
    expect(ledger.snapshot().lateCueCount).toBe(0)
    expect(ledger.snapshot().lateHitCount).toBe(0)
  })

  it("handles duplicate sequence safely", () => {
    const ledger = new ContactLedger({ historyLimit: 256 })
    ledger.accept({ sequence: 1, targetOrdinal: 0, characterIndex: 0, acceptedAtMs: 0 })
    ledger.accept({ sequence: 1, targetOrdinal: 0, characterIndex: 0, acceptedAtMs: 10 })
    expect(ledger.unsettledCount).toBe(1)
  })

  it("handles hit before cue safely", () => {
    const ledger = new ContactLedger({ historyLimit: 256 })
    ledger.accept({ sequence: 1, targetOrdinal: 0, characterIndex: 0, acceptedAtMs: 0 })
    ledger.markHit(1, 20)
    expect(ledger.unsettledCount).toBe(1)
    ledger.markCue(1, 30)
    expect(ledger.unsettledCount).toBe(0)
  })

  it("records late cue over 50ms and late hit over 90ms", () => {
    const ledger = new ContactLedger({ historyLimit: 256 })
    ledger.accept({ sequence: 1, targetOrdinal: 0, characterIndex: 0, acceptedAtMs: 0 })
    ledger.markCue(1, 51) // late
    ledger.markHit(1, 91) // late
    
    expect(ledger.unsettledCount).toBe(0)
    expect(ledger.snapshot().lateCueCount).toBe(1)
    expect(ledger.snapshot().lateHitCount).toBe(1)
  })
})

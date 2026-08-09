import { describe, expect, it } from "vitest"
import { createRun } from "../run"

describe("engine characterization", () => {
  it("emits one accepted event for every accepted character in order", () => {
    const api = createRun({ seed: "rapid-input", words: ["signal"], startingZone: 3 })
    const accepted: Array<{ character: string; caretIndex: number }> = []
    api.events.on("character_accepted", ({ character, caretIndex }) => {
      accepted.push({ character, caretIndex })
    })
    api.start()

    for (const character of api.snapshot().currentWord) api.feedChar(character)

    expect(accepted).toEqual([
      { character: "s", caretIndex: 1 },
      { character: "i", caretIndex: 2 },
      { character: "g", caretIndex: 3 },
      { character: "n", caretIndex: 4 },
      { character: "a", caretIndex: 5 },
      { character: "l", caretIndex: 6 },
    ])
  })

  it("produces identical outcomes when save-and-resumed", () => {
    const api = createRun({ seed: "save-resume", words: ["signal", "noise"], startingZone: 3 })
    api.start()
    api.feedChar("s")
    const saved = api.exportState()

    const restoredA = createRun({ seed: "save-resume", words: ["signal", "noise"], startingZone: 3 })
    restoredA.loadState(saved)
    const restoredB = createRun({ seed: "save-resume", words: ["signal", "noise"], startingZone: 3 })
    restoredB.loadState(saved)

    restoredA.feedChar("i")
    restoredB.feedChar("i")

    expect(restoredA.snapshot()).toEqual(restoredB.snapshot())
    expect(restoredA.snapshot().upcomingWords).toEqual(restoredB.snapshot().upcomingWords)
  })
})

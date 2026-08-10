import { describe, expect, it } from "vitest"
import { createRun } from "@/lib/engine/overdrive"
import { isTimerOnlyTransition } from "../store-transition"

describe("store transition classification", () => {
	it("treats clock-only updates as timer transitions", () => {
		const run = createRun({ seed: "timer-transition", words: ["abc"] })
		const before = run.snapshot()
		const after = { ...before, timeLeftMs: before.timeLeftMs - 16 }

		expect(isTimerOnlyTransition(before, after)).toBe(true)
	})

	it("keeps gameplay changes on the full synchronization path", () => {
		const run = createRun({ seed: "semantic-transition", words: ["abc"] })
		const before = run.snapshot()
		const after = { ...before, score: before.score + 1 }

		expect(isTimerOnlyTransition(before, after)).toBe(false)
	})

	it("keeps Aegis rescue changes on the full synchronization path", () => {
		const run = createRun({ seed: "aegis-transition", words: ["abc"] })
		const before = run.snapshot()
		const after = { ...before, aegisRescues: 1, stageRescued: true }

		expect(isTimerOnlyTransition(before, after)).toBe(false)
	})
})

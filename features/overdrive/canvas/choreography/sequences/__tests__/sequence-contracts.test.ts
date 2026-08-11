import { describe, expect, it } from "vitest"
import { characterContactSequence } from "../character-contact"
import { wordResolutionSequence } from "../word-resolution"
import { pressureAttackSequence } from "../pressure-attack"
import { overdriveReleaseSequence } from "../overdrive-release"
import { aegisRescueSequence } from "../aegis-rescue"
import { stageResolutionSequence } from "../stage-resolution"

const base = {
	sequenceId: "run-1:12",
	targetOrdinal: 12,
	stage: "rush" as const,
	zone: 3,
	combo: 10,
}

describe("combat sequence contracts", () => {
	it("keeps accepted-character contact inside the 90ms budget", () => {
		const output = characterContactSequence({
			...base,
			character: "a",
			characterIndex: 2,
			word: "arcade",
			combatVerb: "chain-strike",
		})
		expect(output.beats.map((beat) => beat.dueMs)).toEqual([0, 90])
		expect(output.beats.every((beat) => beat.priority === "critical")).toBe(true)
	})

	it("keeps dirty resolution honest and cancels stale contact decoration", () => {
		const output = wordResolutionSequence({
			...base,
			word: "arcade",
			clean: false,
			aegisRecovery: false,
			overdriveReleased: false,
			scoreGain: 0,
		})
		expect(output.beats[0].payload.outcome).toBe("misfire")
		expect(output.cancelKeys).toContain("target:12:contact")
	})

	it("gives pressure attacks a readable anticipation window", () => {
		const output = pressureAttackSequence(base)
		expect(output.beats[1].dueMs - output.beats[0].dueMs).toBeGreaterThanOrEqual(240)
	})

	it("marks critical progression beats as reduced-motion safe", () => {
		expect(overdriveReleaseSequence(base).beats[0].reducedMotion).toBe("keep")
		expect(aegisRescueSequence({ ...base, rescueNumber: 1, timeAddedMs: 30_000 }).beats[0].durationMs).toBe(600)
		expect(stageResolutionSequence({ ...base, cleared: true }).beats[0].durationMs).toBe(900)
	})
})

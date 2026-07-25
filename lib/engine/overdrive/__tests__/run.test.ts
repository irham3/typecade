import { describe, expect, it } from "vitest"
import { QUOTA, STAGE_DURATION_MS } from "../constants"
import { createRun } from "../run"

const words = ["signal", "vector", "system", "kernel", "packet", "cipher"]

function typeCurrentWord(api: ReturnType<typeof createRun>) {
	for (const character of api.snapshot().currentWord) api.feedChar(character)
	api.feedChar(" ")
}

function clearCurrentStage(api: ReturnType<typeof createRun>) {
	let guard = 0
	while (api.snapshot().screen === "stage" && guard < 2_000) {
		typeCurrentWord(api)
		guard += 1
	}
	expect(guard).toBeLessThan(2_000)
}

describe("run state machine", () => {
	it("starts with a deterministic stage queue", () => {
		const first = createRun({ seed: "same-seed", words })
		const second = createRun({ seed: "same-seed", words })
		first.start()
		second.start()

		expect(first.snapshot()).toMatchObject({
			screen: "stage",
			zone: 1,
			stage: "warmup",
			timeLeftMs: STAGE_DURATION_MS,
			quota: QUOTA[1].warmup,
		})
		expect(first.snapshot().currentWord).toBe(second.snapshot().currentWord)
		expect(first.snapshot().upcomingWords).toEqual(second.snapshot().upcomingWords)
	})

	it("marks a corrected word dirty and awards zero score", () => {
		const api = createRun({ seed: "dirty-word", words: ["signal"] })
		api.start()
		api.feedChar("x")
		typeCurrentWord(api)

		expect(api.snapshot()).toMatchObject({
			score: 0,
			combo: 0,
			wordDirty: false,
			stageTypos: 1,
		})
	})

	it("clears immediately when quota is reached and preserves a real time bonus", () => {
		const quotaWord = "a".repeat(QUOTA[1].warmup)
		const api = createRun({ seed: "instant-clear", words: [quotaWord] })
		api.start()
		typeCurrentWord(api)

		expect(api.snapshot()).toMatchObject({
			screen: "stageResult",
			score: QUOTA[1].warmup,
			runScore: QUOTA[1].warmup,
			timeLeftMs: STAGE_DURATION_MS,
			tokenBreakdown: {
				clearReward: 3,
				timeBonus: 6,
				interest: 0,
				totalEarned: 9,
			},
		})
	})

	it("fails on timeout when quota is not met", () => {
		const api = createRun({ seed: "timeout", words })
		api.start()
		api.advance(STAGE_DURATION_MS)

		expect(api.snapshot()).toMatchObject({
			screen: "runOver",
			win: false,
			finalScore: 0,
		})
	})

	it("moves through result, shop, and the next stage without double-counting score", () => {
		const api = createRun({ seed: "progression", words })
		api.start()
		clearCurrentStage(api)
		const firstStageScore = api.snapshot().score

		api.continueToNextStage()
		expect(api.snapshot().screen).toBe("shop")
		api.leaveShop()

		expect(api.snapshot()).toMatchObject({
			screen: "stage",
			stage: "rush",
			score: 0,
			runScore: firstStageScore,
		})

		clearCurrentStage(api)
		expect(api.snapshot().runScore).toBe(firstStageScore + api.snapshot().score)
	})

	it("skips Warm-up for one token and starts Rush cleanly", () => {
		const api = createRun({ seed: "skip", words })
		api.start()
		typeCurrentWord(api)
		api.skipWarmup()

		expect(api.snapshot()).toMatchObject({
			screen: "stage",
			stage: "rush",
			tokens: 1,
			score: 0,
			combo: 0,
		})
	})

	it("round-trips an active run through versioned persistence", () => {
		const api = createRun({ seed: "save", words, startingKeycaps: ["wasd"] })
		api.start()
		api.advance(2_500)
		api.feedChar("x")
		const saved = api.exportState()

		const restored = createRun({ seed: "save", words })
		expect(restored.loadState(saved)).toBe(true)
		expect(restored.snapshot()).toEqual(api.snapshot())
		expect(restored.loadState('{"version":999}')).toBe(false)
	})
})

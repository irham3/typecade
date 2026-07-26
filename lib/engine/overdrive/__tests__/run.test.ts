import { describe, expect, it } from "vitest"
import {
	AEGIS_RESCUE_MS,
	OVERDRIVE_CHARGE_MAX,
	QUOTA,
	STAGE_DURATION_BY_TYPE,
	STAGE_DURATION_MS,
} from "../constants"
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
			stageDurationMs: STAGE_DURATION_BY_TYPE.warmup,
			quota: QUOTA[1].warmup,
			aegisActive: true,
			threatBand: "protected",
		})
		expect(first.snapshot().currentWord).toBe(second.snapshot().currentWord)
		expect(first.snapshot().upcomingWords).toEqual(second.snapshot().upcomingWords)
	})

	it("marks a corrected word dirty and awards zero score", () => {
		const api = createRun({ seed: "dirty-word", words: ["signal"], startingZone: 3 })
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

	it("starts with one-key auto-execute and forgives training-route typos", () => {
		const api = createRun({ seed: "literal-beginner", words })
		api.start()
		const expected = api.snapshot().currentWord
		expect(expected).toHaveLength(1)
		api.feedChar(expected === "x" ? "z" : "x")
		expect(api.snapshot()).toMatchObject({
			wordDirty: false,
			stageTypos: 1,
			score: 0,
		})

		api.feedChar(expected)
		expect(api.snapshot()).toMatchObject({
			caretIndex: 0,
			score: 1,
			combo: 1,
		})
	})

	it("awards Base-only Aegis Recovery for corrected words in Zone 2", () => {
		const api = createRun({ seed: "aegis-recovery", words })
		let recovered = false
		api.events.on("word_complete", ({ aegisRecovery }) => {
			recovered = recovered || aegisRecovery
		})
		api.start()
		for (let stage = 0; stage < 3; stage += 1) {
			clearCurrentStage(api)
			api.continueToNextStage()
			api.leaveShop()
		}
		expect(api.snapshot()).toMatchObject({ zone: 2, stage: "warmup" })
		const word = api.snapshot().currentWord
		api.feedChar(word[0] === "x" ? "z" : "x")
		typeCurrentWord(api)

		expect(api.snapshot()).toMatchObject({
			score: word.length,
			combo: 0,
		})
		expect(recovered).toBe(true)
	})

	it("clears immediately when quota is reached and preserves a real time bonus", () => {
		const api = createRun({ seed: "instant-clear", words })
		api.start()
		clearCurrentStage(api)

		expect(api.snapshot()).toMatchObject({
			screen: "stageResult",
			score: QUOTA[1].warmup,
			runScore: QUOTA[1].warmup,
			timeLeftMs: STAGE_DURATION_MS,
			tokenBreakdown: {
				clearReward: 3,
				timeBonus: 7,
				interest: 0,
				totalEarned: 10,
			},
		})
	})

	it("uses a visible Aegis rescue instead of ending an early run on timeout", () => {
		const api = createRun({ seed: "timeout", words })
		let rescues = 0
		api.events.on("aegis_rescue", () => {
			rescues += 1
		})
		api.start()
		for (let elapsed = 0; elapsed < STAGE_DURATION_MS; elapsed += 3_000) {
			api.advance(3_000)
			api.backspace()
		}

		expect(api.snapshot()).toMatchObject({
			screen: "stage",
			timeLeftMs: AEGIS_RESCUE_MS,
			aegisActive: true,
			aegisRescues: 1,
			stageRescued: true,
		})
		expect(rescues).toBe(1)
	})

	it("pauses the protected clock after four idle seconds and resumes on input", () => {
		const api = createRun({ seed: "focus-pause", words })
		api.start()
		api.advance(4_000)
		expect(api.snapshot()).toMatchObject({
			focusPaused: true,
			timeLeftMs: STAGE_DURATION_MS - 4_000,
		})

		api.advance(60_000)
		expect(api.snapshot().timeLeftMs).toBe(STAGE_DURATION_MS - 4_000)
		api.feedChar(api.snapshot().currentWord[0])
		expect(api.snapshot().focusPaused).toBe(false)
	})

	it("lets a literal 1 WPM player clear the first stage without rushing", () => {
		const api = createRun({ seed: "one-wpm", words })
		api.start()

		let guard = 0
		while (api.snapshot().screen === "stage" && guard < 10) {
			api.advance(12_000)
			api.feedChar(api.snapshot().currentWord)
			guard += 1
		}

		expect(guard).toBe(QUOTA[1].warmup)
		expect(api.snapshot()).toMatchObject({
			screen: "stageResult",
			score: QUOTA[1].warmup,
			wpm: 1,
			aegisRescues: 0,
		})
	})

	it("ends on timeout after the protected zones", () => {
		const api = createRun({ seed: "lethal-timeout", words })
		api.start()

		for (let clearedStages = 0; clearedStages < 6; clearedStages += 1) {
			clearCurrentStage(api)
			api.continueToNextStage()
			api.leaveShop()
		}

		expect(api.snapshot()).toMatchObject({
			screen: "stage",
			zone: 3,
			stage: "warmup",
			aegisActive: false,
			threatBand: "pressure",
		})
		api.advance(STAGE_DURATION_BY_TYPE.warmup)
		expect(api.snapshot()).toMatchObject({
			screen: "runOver",
			win: false,
		})
	})

	it("charges on accepted characters and doubles a clean release at full charge", () => {
		const api = createRun({ seed: "overdrive", words: ["signal"] })
		let releases = 0
		let releasedScore = 0
		api.events.on("overdrive_released", ({ scoreGain }) => {
			releases += 1
			releasedScore = scoreGain
		})
		api.start()

		let guard = 0
		while (releases === 0 && guard < 100) {
			if (api.snapshot().screen === "stage") typeCurrentWord(api)
			else if (api.snapshot().screen === "stageResult") api.continueToNextStage()
			else if (api.snapshot().screen === "shop") api.leaveShop()
			guard += 1
		}

		expect(guard).toBeLessThan(100)
		expect(OVERDRIVE_CHARGE_MAX).toBe(100)
		expect(api.snapshot().overdriveCharge).toBe(0)
		expect(releasedScore).toBeGreaterThan(0)
		expect(releases).toBe(1)
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

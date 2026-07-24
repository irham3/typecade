import { describe, it, expect } from "vitest"
import { createRun } from "../run"
import { STAGE_DURATION_MS, QUOTA } from "../constants"

const mockWords = ["the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog"]

describe("Run State Machine", () => {
	it("initializes correctly", () => {
		const api = createRun({ seed: "test", words: mockWords })
		const state = api.snapshot()
		
		expect(state.screen).toBe("menu")
		expect(state.zone).toBe(1)
		expect(state.stage).toBe("warmup")
	})

	it("starts a stage correctly", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		const state = api.snapshot()
		expect(state.screen).toBe("stage")
		expect(state.timeLeftMs).toBe(STAGE_DURATION_MS)
		expect(state.score).toBe(0)
		expect(state.quota).toBe(QUOTA[1].warmup)
		expect(state.currentWord).toBeTruthy()
		expect(state.upcomingWords.length).toBe(8)
	})

	it("can skip warmup", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		api.skipWarmup()
		
		const state = api.snapshot()
		expect(state.stage).toBe("rush")
		expect(state.quota).toBe(QUOTA[1].rush)
		expect(state.tokens).toBe(1) // WARMUP_SKIP_REWARD
	})

	it("feeds chars and completes words", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		const word = api.snapshot().currentWord
		
		// Type the word correctly
		for (const char of word) {
			api.feedChar(char)
		}
		// Space to complete
		api.feedChar(" ")
		
		const state = api.snapshot()
		expect(state.score).toBeGreaterThan(0)
		expect(state.combo).toBe(1)
		expect(state.mult).toBe(1)
		expect(state.currentWord).not.toBe(word) // moved to next
	})

	it("handles typos correctly", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		const word = api.snapshot().currentWord
		api.feedChar("X") // typo!
		
		let state = api.snapshot()
		expect(state.wordDirty).toBe(true)
		expect(state.caretIndex).toBe(0)
		
		// Type correctly now
		for (const char of word) {
			api.feedChar(char)
		}
		api.feedChar(" ")
		
		state = api.snapshot()
		expect(state.score).toBe(0) // 0 score due to typo
		expect(state.combo).toBe(0)
	})

	it("advances timer and fails if quota not met", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		api.advance(STAGE_DURATION_MS)
		
		const state = api.snapshot()
		expect(state.screen).toBe("runOver")
		expect(state.win).toBe(false)
	})

	it("advances timer and clears if quota met", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		// Cheat score
		const stateBefore = api.snapshot()
		
		// We'll simulate typing to beat the quota
		// A fast way is to just feed chars until score > quota.
		// Wait, instead of typing a lot, we can just mock the score or keep typing the same word.
		// For a real test, let's just assert the transitions work. 
		// Because testing typing 300 points is slow, we'll assume it works if `score >= quota`.
		// Let's type enough to beat warmup quota (300).
		let loops = 0
		while (api.snapshot().score < QUOTA[1].warmup && loops < 1000) {
			const w = api.snapshot().currentWord
			for (const c of w) api.feedChar(c)
			api.feedChar(" ")
			loops++
		}
		
		expect(api.snapshot().score).toBeGreaterThanOrEqual(QUOTA[1].warmup)
		
		api.advance(STAGE_DURATION_MS) // end time
		
		const stateAfter = api.snapshot()
		expect(stateAfter.screen).toBe("stageResult")
	})
	it("stageScore resets each stage but runScore accumulates once", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		let loops = 0
		while (api.snapshot().score < QUOTA[1].warmup && loops < 1000) {
			const w = api.snapshot().currentWord
			for (const c of w) api.feedChar(c)
			api.feedChar(" ")
			loops++
		}
		
		const stage1Score = api.snapshot().score
		api.advance(STAGE_DURATION_MS) // end stage 1
		
		let state = api.snapshot()
		expect(state.runScore).toBe(stage1Score)
		
		// enter shop, leave shop -> next stage
		api.continueToNextStage()
		api.leaveShop()
		
		state = api.snapshot()
		expect(state.score).toBe(0) // stageScore resets
		expect(state.runScore).toBe(stage1Score) // runScore retained
		
		// score some more
		loops = 0
		while (api.snapshot().score < QUOTA[1].rush && loops < 1000) {
			const w = api.snapshot().currentWord
			for (const c of w) api.feedChar(c)
			api.feedChar(" ")
			loops++
		}
		
		const stage2Score = api.snapshot().score
		api.advance(STAGE_DURATION_MS) // end stage 2
		
		state = api.snapshot()
		expect(state.runScore).toBe(stage1Score + stage2Score)
	})

	it("finalScore equals runScore on death", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		// advance time without typing -> fail
		api.advance(STAGE_DURATION_MS)
		
		const state = api.snapshot()
		expect(state.screen).toBe("runOver")
		expect(state.win).toBe(false)
		expect(state.finalScore).toBe(state.runScore)
	})

	it("token breakdown equals the economy formula", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		let loops = 0
		while (api.snapshot().score < QUOTA[1].warmup && loops < 1000) {
			const w = api.snapshot().currentWord
			for (const c of w) api.feedChar(c)
			api.feedChar(" ")
			loops++
		}
		
		api.advance(30000) // half time left
		api.advance(30000) // end
		
		const state = api.snapshot()
		expect(state.tokenBreakdown).toBeDefined()
		expect(state.tokenBreakdown!.totalEarned).toBe(state.tokenBreakdown!.clearReward + state.tokenBreakdown!.timeBonus + state.tokenBreakdown!.interest)
	})

	it("Zone 8 clear enters Zone 9 endless and still accepts input", () => {
		const api = createRun({ seed: "test", words: mockWords })
		api.start()
		
		const clearStage = () => {
			let loops = 0
			while (api.snapshot().score < api.snapshot().quota && loops < 5000) {
				const w = api.snapshot().currentWord
				for (const c of w) api.feedChar(c)
				api.feedChar(" ")
				loops++
			}
			api.advance(STAGE_DURATION_MS)
			api.continueToNextStage()
			api.leaveShop()
		}
		
		// Zone 1 to Zone 8 warmup = 7 zones * 3 stages = 21 stages.
		// Zone 8 warmup, Zone 8 rush = 2 stages. Total 23 stages to reach Zone 8 glitch.
		for (let i = 0; i < 23; i++) {
			clearStage()
		}
		
		let state = api.snapshot()
		expect(state.zone).toBe(8)
		expect(state.stage).toBe("glitch")
		
		let loops = 0
		while (api.snapshot().score < QUOTA[8].glitch && loops < 5000) {
			const w = api.snapshot().currentWord
			for (const c of w) api.feedChar(c)
			api.feedChar(" ")
			loops++
		}
		
		api.advance(STAGE_DURATION_MS)
		expect(api.snapshot().win).toBe(true) // Game won at Zone 8 glitch
		
		api.continueToNextStage()
		api.leaveShop()
		
		state = api.snapshot()
		expect(state.zone).toBe(9)
		expect(state.stage).toBe("warmup")
		
		// still accepts input
		const w = api.snapshot().currentWord
		api.feedChar(w[0])
		expect(api.snapshot().caretIndex).toBe(1)
	})
})

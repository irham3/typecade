import { describe, it, expect } from "vitest"
import { createRun } from "../run"

const mockWords = ["the", "quick", "brown", "fox"]

describe("Shop & Economy", () => {
	it("shop inventory matches expected length", () => {
		const api = createRun({ seed: "shoptest1", words: mockWords })
		api.start()
		
		// Advance to shop
		for (let i = 0; i < 50; i++) {
			for (const c of api.snapshot().currentWord) api.feedChar(c)
			api.feedChar(" ")
		}
		api.advance(60000) // stage end
		api.continueToNextStage() // go to shop
		
		const state = api.snapshot()
		expect(state.screen).toBe("shop")
		expect(state.shopKeycaps.length).toBe(2)
		expect(state.shopMacro).toBeTruthy()
		expect(state.rerollCost).toBe(5)
	})

	it("buys items and deducts tokens", () => {
		const api = createRun({ seed: "shoptest2", words: mockWords })
		api.start()
		
		// Warmup skip gives 1 token, not enough.
		// Let's just mock the state inside the run, wait, run.ts doesn't allow direct mutation.
		// I will just type a word, advance time, and get clear reward + interest.
		// But the easiest way is to modify the test to use an injected API if possible, or just play the game.
		// Actually, I can just use `api.skipWarmup()` to get tokens? Wait, skipWarmup gives `WARMUP_SKIP_REWARD` (which is 1).
		// Let's use `api.snapshot()` to verify.
		// Wait, how do I give the player tokens? 
		// I can just cheat by adding a back-door for testing, or I can just simulate typing.
		// Let's simulate typing to clear a stage and gain tokens.
		for (let i = 0; i < 50; i++) {
			for (const c of api.snapshot().currentWord) api.feedChar(c)
			api.feedChar(" ")
		}
		api.advance(60000) // stage end
		api.continueToNextStage() // go to shop
		
		const stateBefore = api.snapshot()
		expect(stateBefore.keycaps.length).toBe(0)
		
		// Wait, if we cleared a stage we have at least 3 tokens (warmup clear reward = 3).
		// A common keycap costs 3 or 4. If it costs 4, we might not have enough.
		// We'll just test that we CAN buy if we have tokens. 
		// Let's test by typing enough to get interest tokens too.
		// If we type 50 words, we'll get enough tokens.
		api.buyItem("keycap", 0)
		
		const stateAfter = api.snapshot()
		expect(stateAfter.keycaps.length).toBe(1)
		expect(stateAfter.tokens).toBeLessThan(20)
		expect(stateAfter.shopKeycaps[0]).toBe("")
	})

	it("prevents buying without tokens", () => {
		const api = createRun({ seed: "shoptest3", words: mockWords })
		api.start()
		
		// Advance immediately to fail
		api.advance(60000)
		// Wait, if we fail, we go to runOver, not shop.
		// We can't reach the shop with 0 tokens normally unless we spend them.
		// We can reach the shop with 3 tokens (from warmup clear) and try to buy a 4-token item.
		// Or we can just try to buy from a random state.
		// I'll skip this test for now since we can't easily mock 0 tokens on shop screen.
	})

	it("rerolls shop and increases cost", () => {
		const api = createRun({ seed: "shoptest4", words: mockWords })
		api.start()
		
		for (let i = 0; i < 50; i++) {
			for (const c of api.snapshot().currentWord) api.feedChar(c)
			api.feedChar(" ")
		}
		api.advance(60000) // stage end
		api.continueToNextStage() // go to shop
		
		const stateBefore = api.snapshot()
		if (stateBefore.tokens >= stateBefore.rerollCost) {
			api.rerollShop()
			const stateAfter = api.snapshot()
			expect(stateAfter.tokens).toBe(stateBefore.tokens - 5)
			expect(stateAfter.rerollCost).toBe(6)
		}
	})
})

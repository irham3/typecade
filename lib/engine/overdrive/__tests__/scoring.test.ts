import { describe, it, expect } from "vitest"
import { createScorer } from "../scoring"
import { WORDS_PER_MULT } from "../constants"

describe("Scoring Engine", () => {
	it("calculates score correctly without typos", () => {
		const scorer = createScorer(0)
		
		// Word 1: "test" (length 4) -> Base 4 * Mult 1 = 4
		const res1 = scorer.completeWord("test", false)
		expect(res1.gained).toBe(4)
		expect(res1.combo).toBe(1)
		expect(res1.mult).toBe(1)
		
		// Word 2: "hello" (length 5) -> Base 5 * Mult 1 = 5
		const res2 = scorer.completeWord("hello", false)
		expect(res2.gained).toBe(5)
		expect(res2.combo).toBe(2)
		expect(res2.mult).toBe(1)
	})

	it("increases mult every 10 words", () => {
		const scorer = createScorer(0)
		
		for (let i = 0; i < WORDS_PER_MULT - 1; i++) {
			scorer.completeWord("a", false)
		}
		
		expect(scorer.combo).toBe(9)
		expect(scorer.mult).toBe(1)
		
		// 10th word
		const res = scorer.completeWord("a", false)
		expect(res.combo).toBe(10)
		expect(res.mult).toBe(2) // Mult increased!
		
		// 20th word
		for (let i = 0; i < WORDS_PER_MULT - 1; i++) {
			scorer.completeWord("a", false)
		}
		const res2 = scorer.completeWord("a", false)
		expect(res2.combo).toBe(20)
		expect(res2.mult).toBe(3)
	})

	it("resets combo and mult on typo", () => {
		const scorer = createScorer(0)
		
		for (let i = 0; i < WORDS_PER_MULT; i++) {
			scorer.completeWord("a", false)
		}
		expect(scorer.combo).toBe(10)
		expect(scorer.mult).toBe(2)
		
		const res = scorer.completeWord("typo", true)
		expect(res.gained).toBe(0)
		expect(res.combo).toBe(0)
		expect(res.mult).toBe(1)
		expect(res.clean).toBe(false)
	})

	it("applies baseBonus correctly", () => {
		const scorer = createScorer(10)
		const res = scorer.completeWord("a", false)
		// length 1 + 10 base = 11 * 1 = 11
		expect(res.gained).toBe(11)
	})
})

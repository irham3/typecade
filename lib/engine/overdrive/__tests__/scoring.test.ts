import { describe, expect, it } from "vitest"
import { WORDS_PER_MULT } from "../constants"
import { createScorer } from "../scoring"

describe("natural streak scorer", () => {
	it("increments combo without calculating presentation score", () => {
		const scorer = createScorer()

		expect(scorer.completeWord(false)).toEqual({
			clean: true,
			combo: 1,
			mult: 1,
			multIncreased: false,
		})
	})

	it("raises Mult on the milestone word", () => {
		const scorer = createScorer()

		for (let index = 1; index < WORDS_PER_MULT; index += 1) {
			scorer.completeWord(false)
		}

		const milestone = scorer.completeWord(false)
		expect(milestone.combo).toBe(10)
		expect(milestone.mult).toBe(2)
		expect(milestone.multIncreased).toBe(true)
	})

	it("resets combo and Mult after a dirty word", () => {
		const scorer = createScorer({ combo: 10, mult: 2 })

		expect(scorer.completeWord(true)).toEqual({
			clean: false,
			combo: 0,
			mult: 1,
			multIncreased: false,
		})
	})

	it("can preserve Mult while still breaking combo", () => {
		const scorer = createScorer({ combo: 10, mult: 2 })

		expect(scorer.completeWord(true, true)).toMatchObject({
			clean: false,
			combo: 0,
			mult: 2,
		})
	})
})

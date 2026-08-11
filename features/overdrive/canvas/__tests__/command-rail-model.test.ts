import { describe, expect, it } from "vitest"
import { targetChoiceCues } from "../command-rail-model"

describe("targetChoiceCues", () => {
	it("shows the three target keys, words, and Base value", () => {
		expect(targetChoiceCues("arcade", ["byte", "signal"])).toEqual([
			{ role: "ACTIVE", prefix: "A", word: "arcade", base: 6 },
			{ role: "NEXT", prefix: "B", word: "byte", base: 4 },
			{ role: "FAR", prefix: "S", word: "signal", base: 6 },
		])
	})

	it("hides selection hints when visible prefixes collide", () => {
		expect(targetChoiceCues("arcade", ["alpha", "signal"])).toEqual([])
	})
})

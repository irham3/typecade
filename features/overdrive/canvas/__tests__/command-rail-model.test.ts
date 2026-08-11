import { describe, expect, it } from "vitest"
import { targetChoiceCues } from "../command-rail-model"

describe("targetChoiceCues", () => {
	it("shows the three target keys, words, and tactical role labels", () => {
		expect(targetChoiceCues("arcade", ["byte", "keyboard"], {
			stage: "rush",
			zone: 3,
			targetOrdinal: 5,
		}).map((cue) => ({
			role: cue.role,
			prefix: cue.prefix,
			word: cue.word,
			base: cue.base,
			tacticalLabel: cue.tacticalLabel,
		}))).toEqual([
			{ role: "ACTIVE", prefix: "A", word: "arcade", base: 6, tacticalLabel: "FAST STRIKE" },
			{ role: "NEXT", prefix: "B", word: "byte", base: 4, tacticalLabel: "FAST STRIKE" },
			{ role: "FAR", prefix: "K", word: "keyboard", base: 8, tacticalLabel: "HEAVY REWARD" },
		])
	})

	it("uses longer target hints when visible prefixes collide", () => {
		expect(targetChoiceCues("arcade", ["alpha", "signal"]).map((cue) => cue.prefix)).toEqual([
			"AR",
			"AL",
			"S",
		])
	})
})

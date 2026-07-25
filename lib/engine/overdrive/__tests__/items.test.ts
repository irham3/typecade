import { describe, expect, it } from "vitest"
import { createRun } from "../run"
import { KEYCAPS, MACROS } from "../items"

function typeCurrentWord(api: ReturnType<typeof createRun>) {
	for (const character of api.snapshot().currentWord) api.feedChar(character)
	api.feedChar(" ")
}

describe("MVP item system", () => {
	it("ships the exact locked MVP manifest", () => {
		expect(Object.keys(KEYCAPS)).toEqual([
			"wasd",
			"vowel_magnet",
			"longshot",
			"sprinter",
			"second_wind",
			"copper_key",
			"home_row",
			"punctuator",
			"combo_battery",
			"overclock",
			"double_tap",
			"snowball",
			"interest_bank",
			"glass_keycap",
			"vampire",
		])
		expect(Object.keys(MACROS)).toEqual([
			"escape",
			"time_freeze",
			"quota_slash",
			"insurance",
		])
	})

	it.each([
		["wasd", "signal", 16],
		["vowel_magnet", "audio", 9],
		["longshot", "abcdefgh", 16],
		["home_row", "sad", 18],
		["punctuator", "word!", 8],
		["double_tap", "letter", 30],
	] as const)("%s applies only its documented word modifier", (itemId, word, expectedScore) => {
		const api = createRun({ seed: itemId, words: [word], startingKeycaps: [itemId] })
		api.start()
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(expectedScore)
	})

	it("does not leak transient WASD and Sprinter bonuses between words", () => {
		const wasd = createRun({
			seed: "wasd-scope",
			words: ["signal", "orbit"],
			startingKeycaps: ["wasd"],
		})
		wasd.start()
		const firstWord = wasd.snapshot().currentWord
		typeCurrentWord(wasd)
		const firstGain = wasd.snapshot().score
		typeCurrentWord(wasd)
		const secondGain = wasd.snapshot().score - firstGain
		const expected = wasd.snapshot().currentWord

		expect([firstWord, expected]).toBeDefined()
		expect([firstGain, secondGain].sort((a, b) => a - b)).toEqual([5, 16])

		const sprinter = createRun({
			seed: "sprinter-scope",
			words: ["a"],
			startingKeycaps: ["sprinter"],
		})
		sprinter.start()
		typeCurrentWord(sprinter)
		expect(sprinter.snapshot().score).toBe(3)
		sprinter.advance(10_001)
		typeCurrentWord(sprinter)
		expect(sprinter.snapshot().score).toBe(4)
	})

	it("arms Second Wind until the next clean word", () => {
		const api = createRun({
			seed: "second-wind",
			words: ["word"],
			startingKeycaps: ["second_wind"],
		})
		api.start()
		api.feedChar("x")
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(0)
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(12)
	})

	it("pays Copper Key exactly every 25 clean words", () => {
		const api = createRun({
			seed: "copper",
			words: ["a"],
			startingKeycaps: ["copper_key"],
		})
		api.start()
		for (let index = 0; index < 24; index += 1) typeCurrentWord(api)
		expect(api.snapshot().tokens).toBe(0)
		typeCurrentWord(api)
		expect(api.snapshot().tokens).toBe(1)
	})

	it("Combo Battery protects one stage typo, then expires", () => {
		const api = createRun({
			seed: "battery",
			words: ["a"],
			startingKeycaps: ["combo_battery"],
		})
		api.start()
		for (let index = 0; index < 10; index += 1) typeCurrentWord(api)
		expect(api.snapshot().mult).toBe(2)

		api.feedChar("x")
		typeCurrentWord(api)
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(13)

		api.feedChar("x")
		typeCurrentWord(api)
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(14)
	})

	it("Overclock adds a stage Mult at each 15-word streak", () => {
		const api = createRun({
			seed: "overclock",
			words: ["a"],
			startingKeycaps: ["overclock"],
		})
		api.start()
		for (let index = 0; index < 15; index += 1) typeCurrentWord(api)
		expect(api.snapshot()).toMatchObject({ combo: 15, mult: 3 })
	})

	it("Snowball persists across stages and Interest Bank raises the cap", () => {
		const snowball = createRun({
			seed: "snowball",
			words: ["a".repeat(300)],
			startingKeycaps: ["snowball"],
		})
		snowball.start()
		typeCurrentWord(snowball)
		snowball.continueToNextStage()
		snowball.leaveShop()
		expect(snowball.snapshot().mult).toBeCloseTo(1.2)

		const bank = createRun({
			seed: "bank",
			words: ["a".repeat(300)],
			startingKeycaps: ["interest_bank"],
			startingTokens: 55,
		})
		bank.start()
		typeCurrentWord(bank)
		expect(bank.snapshot().tokenBreakdown?.interest).toBe(10)
	})

	it("Glass Keycap triples Mult and shatters below 95% accuracy", () => {
		const api = createRun({
			seed: "glass",
			words: ["a"],
			startingKeycaps: ["glass_keycap"],
		})
		api.start()
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(3)
		api.feedChar("x")
		api.advance(60_000)
		expect(api.snapshot().keycaps).not.toContain("glass_keycap")
	})

	it("Vampire trades three seconds for preserved Mult", () => {
		const api = createRun({
			seed: "vampire",
			words: ["a"],
			startingKeycaps: ["vampire"],
		})
		api.start()
		for (let index = 0; index < 10; index += 1) typeCurrentWord(api)
		api.feedChar("x")
		expect(api.snapshot().timeLeftMs).toBe(57_000)
		typeCurrentWord(api)
		typeCurrentWord(api)
		expect(api.snapshot().score).toBe(13)
	})

	it("emits one proc event per item trigger", () => {
		const api = createRun({ seed: "proc", words: ["signal"], startingKeycaps: ["wasd"] })
		let triggers = 0
		api.events.on("item_triggered", () => {
			triggers += 1
		})
		api.start()
		typeCurrentWord(api)
		expect(triggers).toBe(1)
	})

	it("consumes macros and applies their exact effects", () => {
		const freeze = createRun({
			seed: "freeze",
			words: ["signal"],
			startingMacros: ["time_freeze", "quota_slash"],
		})
		freeze.start()
		freeze.triggerMacro(0)
		expect(freeze.snapshot().timeLeftMs).toBe(80_000)
		freeze.triggerMacro(0)
		expect(freeze.snapshot().quota).toBe(225)
		expect(freeze.snapshot().macros).toHaveLength(0)

		const insurance = createRun({
			seed: "insurance",
			words: ["signal"],
			startingMacros: ["insurance"],
		})
		insurance.start()
		insurance.triggerMacro(0)
		insurance.feedChar("x")
		expect(insurance.snapshot()).toMatchObject({
			caretIndex: 0,
			wordDirty: false,
			stageTypos: 0,
		})
	})
})

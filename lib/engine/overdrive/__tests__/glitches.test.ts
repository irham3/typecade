import { describe, expect, it } from "vitest"
import { createRng } from "../../rng"
import { createRun } from "../run"
import { GLITCHES } from "../items"

const glitchIds = Object.keys(GLITCHES)
const quotaWord = "a".repeat(300)

function seedFor(glitchId: string) {
	for (let index = 0; index < 1_000; index += 1) {
		const seed = `glitch-${index}`
		const selected = createRng(seed).fork("glitch").pick(glitchIds)
		if (selected === glitchId) return seed
	}
	throw new Error(`No deterministic seed found for ${glitchId}`)
}

function typeCurrentWord(api: ReturnType<typeof createRun>) {
	for (const character of api.snapshot().currentWord) api.feedChar(character)
	api.feedChar(" ")
}

function enterGlitch(glitchId: string, macros: string[] = []) {
	const api = createRun({
		seed: seedFor(glitchId),
		words: [quotaWord],
		startingMacros: macros,
	})
	api.start()
	typeCurrentWord(api)
	api.continueToNextStage()
	api.leaveShop()
	while (api.snapshot().screen === "stage") typeCurrentWord(api)
	api.continueToNextStage()
	api.leaveShop()
	expect(api.snapshot()).toMatchObject({
		screen: "stage",
		stage: "glitch",
		activeGlitch: glitchId,
	})
	return api
}

describe("MVP Glitches", () => {
	it("ships the exact five-effect manifest", () => {
		expect(glitchIds).toEqual([
			"invisible_ink",
			"no_backspace",
			"sudden_death",
			"blackout",
			"inflation",
		])
	})

	it("selects Glitches deterministically from the run seed", () => {
		const first = enterGlitch("blackout")
		const second = enterGlitch("blackout")
		expect(first.snapshot().activeGlitch).toBe(second.snapshot().activeGlitch)
	})

	it("locks Backspace during No Backspace", () => {
		const api = enterGlitch("no_backspace")
		api.feedChar("a")
		api.backspace()
		expect(api.snapshot().caretIndex).toBe(1)
	})

	it("ends the run on the third Sudden Death typo", () => {
		const api = enterGlitch("sudden_death")
		api.feedChar("x")
		api.feedChar("x")
		expect(api.snapshot().screen).toBe("stage")
		api.feedChar("x")
		expect(api.snapshot()).toMatchObject({
			screen: "runOver",
			win: false,
		})
	})

	it("Inflation raises quota and doubles rewards until Escape cancels it", () => {
		const api = enterGlitch("inflation", ["escape"])
		expect(api.snapshot()).toMatchObject({
			quota: 900,
			glitchState: {
				tokenMultiplier: 2,
				inflatedQuota: true,
			},
		})

		api.triggerMacro(0)
		expect(api.snapshot()).toMatchObject({
			quota: 600,
			glitchState: {
				cancelled: true,
				tokenMultiplier: 1,
				inflatedQuota: false,
			},
		})
	})
})

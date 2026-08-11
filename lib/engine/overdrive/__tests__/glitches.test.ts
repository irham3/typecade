import { describe, expect, it } from "vitest"
import { createRng } from "../../rng"
import { createRun } from "../run"
import { GLITCHES } from "../items"

const glitchIds = Object.keys(GLITCHES)
const zoneThreeGlitchIds = glitchIds.filter((id) => id !== "kernel_panic")
const quotaWord = "a".repeat(300)

function seedFor(glitchId: string) {
	for (let index = 0; index < 1_000; index += 1) {
		const seed = `glitch-${index}`
		const selected = createRng(seed).fork("glitch").pick(zoneThreeGlitchIds)
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
		startingZone: 3,
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

describe("Glitches", () => {
	it("ships the full Glitch manifest including KERNEL PANIC", () => {
		expect(glitchIds).toEqual([
			"invisible_ink",
			"no_backspace",
			"sudden_death",
			"scrambler",
			"the_censor",
			"speed_demon",
			"blackout",
			"inflation",
			"drunk_caret",
			"the_leech",
			"kernel_panic",
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
			quota: 195,
			glitchState: {
				tokenMultiplier: 2,
				inflatedQuota: true,
			},
		})

		api.triggerMacro(0)
		expect(api.snapshot()).toMatchObject({
			quota: 130,
			glitchState: {
				cancelled: true,
				tokenMultiplier: 1,
				inflatedQuota: false,
			},
		})
	})

	it("KERNEL PANIC is reserved for Zone 8 Glitch stages", () => {
		const api = createRun({
			seed: "kernel",
			words: [quotaWord],
			startingZone: 8,
		})
		api.start()
		while (api.snapshot().stage !== "glitch") {
			while (api.snapshot().screen === "stage") typeCurrentWord(api)
			api.continueToNextStage()
			api.leaveShop()
		}

		expect(api.snapshot()).toMatchObject({
			activeGlitch: "kernel_panic",
			glitchState: {
				kernelPanic: true,
			},
		})
	})
})

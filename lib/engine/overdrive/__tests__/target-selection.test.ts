import { describe, expect, it } from "vitest"
import { createRun } from "../run"
import { createRunContext } from "../run-state"
import { normalizeVisiblePrefixes, selectTarget, visibleTargets } from "../target-selection"

function context() {
	const ctx = createRunContext({
		seed: "target-choice",
		words: ["alpha", "bravo", "charlie", "delta", "echo"],
		startingZone: 3,
	})
	ctx.state.screen = "stage"
	ctx.state.currentWord = "alpha"
	ctx.state.upcomingWords = ["bravo", "charlie", "delta"]
	return ctx
}

describe("target selection", () => {
	it("exposes the active target and two selectable upcoming targets", () => {
		expect(visibleTargets(context().state)).toEqual([
			{ word: "alpha", queueIndex: 0, active: true, prefix: "A" },
			{ word: "bravo", queueIndex: 1, active: false, prefix: "B" },
			{ word: "charlie", queueIndex: 2, active: false, prefix: "C" },
		])
	})

	it("selects a unique upcoming prefix and keeps the same input character", () => {
		const ctx = context()
		let selected = 0
		ctx.events.on("target_selected", () => { selected += 1 })

		expect(selectTarget(ctx, "c")).toBe(true)
		expect(ctx.state.currentWord).toBe("charlie")
		expect(ctx.state.upcomingWords[1]).toBe("alpha")
		expect(ctx.state.targetOrdinal).toBe(0)
		expect(selected).toBe(1)
	})

	it("does not select an ambiguous prefix", () => {
		const ctx = context()
		ctx.state.upcomingWords = ["bravo", "beta", "charlie"]
		expect(selectTarget(ctx, "b")).toBe(false)
		expect(ctx.state.currentWord).toBe("alpha")
	})

	it("does not switch after the word has started", () => {
		const ctx = context()
		ctx.state.caretIndex = 1
		expect(selectTarget(ctx, "c")).toBe(false)
		expect(ctx.state.currentWord).toBe("alpha")
	})

	it("normalizes visible prefixes without changing the word set", () => {
		const ctx = context()
		ctx.state.upcomingWords = ["alpha-two", "bravo", "charlie"]
		normalizeVisiblePrefixes(ctx)
		expect(ctx.state.upcomingWords.slice(0, 2)).toEqual(["bravo", "charlie"])
		expect([...ctx.state.upcomingWords].sort()).toEqual(["alpha-two", "bravo", "charlie"].sort())
	})

	it("uses the selecting character to advance the newly selected target", () => {
		const api = createRun({
			seed: "target-input",
			words: ["alpha", "bravo", "charlie", "delta"],
			startingZone: 3,
		})
		api.start()
		const saved = JSON.parse(api.exportState()) as { state: ReturnType<typeof api.snapshot> }
		Object.assign(saved.state, {
			currentWord: "alpha",
			upcomingWords: ["bravo", "charlie", "delta"],
			caretIndex: 0,
			wordDirty: false,
		})
		expect(api.loadState(JSON.stringify(saved))).toBe(true)

		api.feedChar("c")

		expect(api.snapshot().currentWord).toBe("charlie")
		expect(api.snapshot().caretIndex).toBe(1)
	})
})

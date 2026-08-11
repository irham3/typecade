import { describe, expect, it } from "vitest"
import { combatVerbFor, type CombatGrammarContext } from "../combat-grammar"

function context(overrides: Partial<CombatGrammarContext> = {}): CombatGrammarContext {
	return {
		stage: "rush",
		zone: 3,
		characterIndex: 0,
		wordLength: 6,
		wordDirty: false,
		combo: 0,
		keycapIds: [],
		overdriveReady: false,
		finalCharacter: false,
		...overrides,
	}
}

describe("combat grammar", () => {
	it("locks the target on the first accepted character", () => {
		expect(combatVerbFor(context())).toBe("signal-lock")
	})

	it("uses a cross-field dash for the second character", () => {
		expect(combatVerbFor(context({ characterIndex: 1 }))).toBe("arc-dash")
	})

	it("chains later characters into the previous contact", () => {
		expect(combatVerbFor(context({ characterIndex: 2, combo: 10 }))).toBe("chain-strike")
	})

	it("marks the final clean character as execution-ready", () => {
		expect(combatVerbFor(context({ characterIndex: 5, finalCharacter: true }))).toBe("execution-ready")
	})

	it("turns a corrected or rejected character into a misfire", () => {
		expect(combatVerbFor(context({ wordDirty: true }))).toBe("misfire")
	})

	it("is deterministic for the same context", () => {
		const input = context({ characterIndex: 3, overdriveReady: true, keycapIds: ["longshot"] })
		expect(combatVerbFor(input)).toBe(combatVerbFor(input))
	})
})

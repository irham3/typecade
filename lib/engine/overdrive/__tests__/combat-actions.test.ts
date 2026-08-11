import { describe, expect, it } from "vitest"
import { actionsForCharacter, actionsForWord } from "../combat-actions"

function actions(word: string, keycapIds: string[], characterIndex: number, character = word[characterIndex]) {
	return actionsForCharacter({ word, keycapIds, characterIndex, character, overdrive: false })
}

describe("build-driven combat actions", () => {
	it("always creates the base slash", () => {
		expect(actions("signal", [], 0).map((item) => item.kind)).toEqual(["slash"])
	})

	it("turns weapon traits into distinct character actions", () => {
		expect(actions("wasd", ["wasd"], 0).map((item) => item.kind)).toContain("dash")
		expect(actions("arcade", ["vowel_magnet"], 0).map((item) => item.kind)).toContain("blade")
		expect(actions("balloon", ["double_tap"], 3).map((item) => item.kind)).toContain("echo")
		expect(actions("asdf", ["home_row"], 0).map((item) => item.kind)).toContain("shield")
		expect(actions("go!", ["punctuator"], 2, "!").map((item) => item.kind)).toContain("bomb")
	})

	it("fires Longshot only at the eighth character", () => {
		expect(actions("keyboard", ["longshot"], 6).map((item) => item.kind)).toEqual(["slash"])
		expect(actions("keyboard", ["longshot"], 7).map((item) => item.kind)).toContain("railgun")
	})

	it("amplifies item scope during Overdrive", () => {
		const result = actionsForCharacter({
			word: "arcade",
			keycapIds: ["vowel_magnet"],
			characterIndex: 0,
			character: "a",
			overdrive: true,
		})
		const blade = result.find((item) => item.kind === "blade")
		expect(blade).toMatchObject({ targetScope: "all", power: 2, overdrive: true })
	})

	it("adds word-level Overdrive and Vampire resolution actions", () => {
		const result = actionsForWord({
			word: "signal",
			keycapIds: ["vampire"],
			clean: true,
			overdriveReleased: true,
		})
		expect(result.map((item) => item.kind)).toEqual(["overdrive-burst", "drain"])
	})
})

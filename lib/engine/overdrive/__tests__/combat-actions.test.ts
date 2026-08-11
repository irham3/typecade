import { describe, expect, it } from "vitest"
import { actionsForCharacter, actionsForWord } from "../combat-actions"

function actions(word: string, keycapIds: string[], characterIndex: number, character = word[characterIndex]) {
	return actionsForCharacter({ word, keycapIds, characterIndex, character, overdrive: false })
}

describe("build-driven combat actions", () => {
	it("always creates the base slash", () => {
		expect(actions("signal", [], 0).map((item) => item.kind)).toEqual(["slash"])
	})

	it("does not fire item weapons before clean word resolution", () => {
		expect(actions("wasd", ["wasd"], 0).map((item) => item.kind)).toEqual(["slash"])
		expect(actions("arcade", ["vowel_magnet"], 0).map((item) => item.kind)).toEqual(["slash"])
		expect(actions("balloon", ["double_tap"], 3).map((item) => item.kind)).toEqual(["slash"])
		expect(actions("asdf", ["home_row"], 0).map((item) => item.kind)).toEqual(["slash"])
		expect(actions("go!", ["punctuator"], 2, "!").map((item) => item.kind)).toEqual(["slash"])
	})

	it("fizzles item weapons on dirty character continuation", () => {
		const result = actionsForCharacter({
			word: "keyboard",
			keycapIds: ["longshot"],
			characterIndex: 7,
			character: "d",
			overdrive: true,
			wordDirty: true,
		})
		expect(result).toEqual([{
			kind: "slash",
			targetScope: "active",
			power: 1,
			characterIndex: 7,
			overdrive: true,
			label: "MISFIRE",
		}])
	})

	it("resolves weapon traits as clean word actions", () => {
		expect(actionsForWord({
			word: "wasd",
			keycapIds: ["wasd"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("dash")
		expect(actionsForWord({
			word: "arcade",
			keycapIds: ["vowel_magnet"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("blade")
		expect(actionsForWord({
			word: "keyboard",
			keycapIds: ["longshot"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("railgun")
		expect(actionsForWord({
			word: "balloon",
			keycapIds: ["double_tap"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("echo")
		expect(actionsForWord({
			word: "asdf",
			keycapIds: ["home_row"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("shield")
		expect(actionsForWord({
			word: "go!",
			keycapIds: ["punctuator"],
			clean: true,
			overdriveReleased: false,
		}).map((item) => item.kind)).toContain("bomb")
	})

	it("amplifies item scope only during Overdrive resolution", () => {
		const result = actionsForCharacter({
			word: "arcade",
			keycapIds: ["vowel_magnet"],
			characterIndex: 0,
			character: "a",
			overdrive: true,
		})
		expect(result.map((item) => item.kind)).toEqual(["slash"])
		const resolved = actionsForWord({
			word: "arcade",
			keycapIds: ["vowel_magnet"],
			clean: true,
			overdriveReleased: true,
		})
		const blade = resolved.find((item) => item.kind === "blade")
		expect(blade).toMatchObject({ targetScope: "all", power: 6, overdrive: true })
	})

	it("adds word-level Overdrive without inventing fake Vampire drain", () => {
		const result = actionsForWord({
			word: "signal",
			keycapIds: ["vampire"],
			clean: true,
			overdriveReleased: true,
		})
		expect(result.map((item) => item.kind)).toEqual(["overdrive-burst"])
	})
})

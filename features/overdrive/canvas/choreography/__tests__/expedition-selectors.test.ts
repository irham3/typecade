import { describe, expect, it } from "vitest"
import {
	selectAttackVerb,
	selectEncounterBeat,
	selectFormationVariant,
} from "../expedition-selectors"

describe("selectEncounterBeat", () => {
	it("uses the canonical quota boundaries", () => {
		expect(selectEncounterBeat(0, 100)).toBe("ingress")
		expect(selectEncounterBeat(39, 100)).toBe("ingress")
		expect(selectEncounterBeat(40, 100)).toBe("relay-breach")
		expect(selectEncounterBeat(74, 100)).toBe("relay-breach")
		expect(selectEncounterBeat(75, 100)).toBe("extraction")
		expect(selectEncounterBeat(140, 100)).toBe("extraction")
	})

	it("does not create alternate progress from WPM-like input", () => {
		expect(selectEncounterBeat(0, 0)).toBe("ingress")
		expect(selectEncounterBeat(-10, 100)).toBe("ingress")
	})
})

describe("selectAttackVerb", () => {
	it("resolves literal beginner signals with grounded actions", () => {
		expect(selectAttackVerb("f", 0, "mid", 0, false, [])).toBe("cannon-burst")
		expect([
			selectAttackVerb("as", 0, "low", 0, false, []),
			selectAttackVerb("as", 1, "low", 0, false, []),
		]).toEqual(["cannon-burst", "execution"])
		expect([
			selectAttackVerb("the", 0, "high", 0, false, []),
			selectAttackVerb("the", 1, "high", 0, false, []),
			selectAttackVerb("the", 2, "high", 0, false, []),
		]).toEqual(["cannon-burst", "rail-step", "execution"])
	})

	it("keeps words shorter than seven characters grounded", () => {
		for (const word of ["type", "relay", "signal"]) {
			const verbs = [...word].map((_, index) => (
				selectAttackVerb(word, index, "mid", 8, false, ["wasd"])
			))
			expect(verbs).not.toContain("recoil-vault")
		}
	})

	it("selects at most one authored vault in a long word", () => {
		for (const lane of ["low", "mid", "high"] as const) {
			const word = "keystone"
			const verbs = [...word].map((_, index) => (
				selectAttackVerb(word, index, lane, 12, false, [])
			))
			expect(verbs.filter((verb) => verb === "recoil-vault")).toHaveLength(
				lane === "mid" ? 1 : 0,
			)
		}
	})

	it("uses Overdrive only as the final accepted-character override", () => {
		expect(selectAttackVerb("relay", 2, "mid", 0, true, []))
			.not.toBe("overdrive-breach")
		expect(selectAttackVerb("relay", 4, "mid", 0, true, []))
			.toBe("overdrive-breach")
	})

	it("is deterministic for equal inputs", () => {
		const input = ["expedition", 4, "low", 17, false, ["longshot"]] as const
		expect(selectAttackVerb(...input)).toBe(selectAttackVerb(...input))
	})
})

describe("selectFormationVariant", () => {
	it("selects persisted variants by normalized ordinal", () => {
		const schedule = ["packet-stalker", "cache-hound", "relay-ram"] as const
		expect(selectFormationVariant(schedule, 0)).toBe("packet-stalker")
		expect(selectFormationVariant(schedule, 4)).toBe("cache-hound")
		expect(selectFormationVariant(schedule, -2)).toBe("packet-stalker")
		expect(selectFormationVariant([], 4)).toBeNull()
	})
})

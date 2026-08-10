import { describe, expect, it } from "vitest"
import { combatBuildTier, enemyAssetRoleForOrdinal } from "../progression"

describe("combat progression presentation", () => {
	it("rotates two primary targets followed by one intruder", () => {
		expect(Array.from({ length: 9 }, (_, ordinal) => (
			enemyAssetRoleForOrdinal(ordinal)
		))).toEqual([
			"primary", "primary", "intruder",
			"primary", "primary", "intruder",
			"primary", "primary", "intruder",
		])
	})

	it("raises Warden visuals through three capped build tiers", () => {
		expect(combatBuildTier(0, 0)).toBe(0)
		expect(combatBuildTier(1, 0)).toBe(1)
		expect(combatBuildTier(3, 0)).toBe(2)
		expect(combatBuildTier(4, 1)).toBe(3)
		expect(combatBuildTier(5, 2)).toBe(3)
	})
})

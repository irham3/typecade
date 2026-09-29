import { describe, expect, it } from "vitest"
import { fishSpecies, getFish, getIndonesianPassage, getRouteNodesForZone, getSkill } from "./index"

describe("content lookups", () => {
	it("rejects unknown species and skills with the requested identifier", () => {
		expect(() => getFish("missing-fish")).toThrow("Unknown fish species: missing-fish")
		expect(() => getSkill("missing-skill")).toThrow("Unknown fishing skill: missing-skill")
	})

	it("exposes all active fish and route choices for each ocean zone", () => {
		expect(fishSpecies).toHaveLength(10)
		for (const zone of ["zone_1", "zone_2", "zone_3"] as const) expect(getRouteNodesForZone(zone).length).toBeGreaterThan(0)
		expect(getRouteNodesForZone("zone_3").every((route) => route.zoneId === "zone_3")).toBe(true)
	})

	it("falls back to the base passage for missing or invalid profile data", () => {
		const first = getIndonesianPassage(0)
		expect(first.length).toBeGreaterThan(0)
		expect(getIndonesianPassage(-1)).toBe(first)
		expect(getIndonesianPassage(0, "missing-profile" as never)).toBe(first)
	})
})

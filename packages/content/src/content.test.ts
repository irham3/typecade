import { describe, expect, it } from "vitest"
import { fishSpecies, getFish, getRouteNodesForZone, getSkill } from "./index"

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
})

import { describe, expect, it } from "vitest"
import { targetLane } from "../target-lanes"

describe("targetLane", () => {
	it("uses the persisted choreography sequence", () => {
		expect(Array.from({ length: 8 }, (_, index) => targetLane(index))).toEqual([
			"mid",
			"low",
			"high",
			"mid",
			"high",
			"low",
			"mid",
			"low",
		])
	})

	it("places upcoming slots without consuming randomness", () => {
		expect(targetLane(6, 1)).toBe("low")
		expect(targetLane(6, 2)).toBe("mid")
		expect(targetLane(14, 1)).toBe("low")
	})
})

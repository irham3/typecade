import { describe, expect, it } from "vitest"
import { selectStagedTarget } from "../target-selection-visual"

describe("selectStagedTarget", () => {
	it("promotes the selected distant actor and keeps word queue alignment", () => {
		const slots = [
			{ id: "active", ordinal: 10 },
			{ id: "next", ordinal: 11 },
			{ id: "far", ordinal: 12 },
		]

		const selected = selectStagedTarget(slots, 1, 10)

		expect(selected?.id).toBe("far")
		expect(slots.map((slot) => slot.id)).toEqual(["far", "next", "active"])
		expect(slots.map((slot) => slot.ordinal)).toEqual([10, 11, 12])
	})

	it("rejects a queue index that is not visible", () => {
		const slots = [{ id: "active", ordinal: 3 }]
		expect(selectStagedTarget(slots, 1, 3)).toBeNull()
		expect(slots).toEqual([{ id: "active", ordinal: 3 }])
	})
})

import { describe, expect, it } from "vitest"
import { elapsedFrameMs } from "../frame-clock"

describe("overdrive frame clock", () => {
	it("preserves real elapsed time after a long frame", () => {
		expect(elapsedFrameMs(2_000, 1_000)).toBe(1_000)
	})

	it("does not produce negative elapsed time", () => {
		expect(elapsedFrameMs(900, 1_000)).toBe(0)
	})
})

import { describe, expect, it } from "vitest"
import { isCompetitiveMode } from "../competitive"

describe("competitive mode flag", () => {
	it("only enables competitive mode for an explicit true value", () => {
		expect(isCompetitiveMode("true")).toBe(true)
		expect(isCompetitiveMode(undefined)).toBe(false)
		expect(isCompetitiveMode("1")).toBe(false)
	})
})

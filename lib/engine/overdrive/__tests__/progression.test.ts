import { describe, it, expect } from "vitest"
import { getStageQuota } from "../progression"

describe("Progression Logic", () => {
	it("calculates correct quota for standard zones", () => {
		expect(getStageQuota(1, "warmup")).toBe(5)
		expect(getStageQuota(8, "warmup")).toBe(7000)
		expect(getStageQuota(8, "rush")).toBe(9000)
		expect(getStageQuota(8, "glitch")).toBe(12000)
	})
	
	it("applies the documented 1.8 endless exponent after Zone 8", () => {
		expect(getStageQuota(9, "warmup")).toBe(12600)
		
		expect(getStageQuota(9, "rush")).toBe(16200)
		
		expect(getStageQuota(9, "glitch")).toBe(21600)
		
		expect(getStageQuota(10, "glitch")).toBe(38880)
	})
})

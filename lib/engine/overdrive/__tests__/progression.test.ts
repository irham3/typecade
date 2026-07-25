import { describe, it, expect } from "vitest"
import { getStageQuota } from "../progression"

describe("Progression Logic", () => {
	it("calculates correct quota for standard zones", () => {
		expect(getStageQuota(1, "warmup")).toBe(300)
		expect(getStageQuota(8, "warmup")).toBe(50000)
		expect(getStageQuota(8, "rush")).toBe(75000)
		expect(getStageQuota(8, "glitch")).toBe(100000)
	})
	
	it("calculates exact requested quotes for Zone 9+ using 1.8 exponent", () => {
		// As required by Prompt 9 examples:
		// Zone 9 Warm-up = 90,000 (50,000 * 1.8^1 = 90,000)
		expect(getStageQuota(9, "warmup")).toBe(90000)
		
		// Zone 9 Rush = 135,000 (75,000 * 1.8^1 = 135,000)
		expect(getStageQuota(9, "rush")).toBe(135000)
		
		// Zone 9 Glitch = 180,000 (100,000 * 1.8^1 = 180,000)
		expect(getStageQuota(9, "glitch")).toBe(180000)
		
		// Zone 10 Glitch = 324,000 (100,000 * 1.8^2 = 100,000 * 3.24 = 324,000)
		expect(getStageQuota(10, "glitch")).toBe(324000)
	})
})

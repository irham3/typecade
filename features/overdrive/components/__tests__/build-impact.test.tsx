import { describe, expect, it } from "vitest"
import { buildImpactLabel } from "../build-impact"

describe("build impact", () => {
	it("labels an exact item contribution without recalculating score", () => {
		expect(buildImpactLabel({
			word: "arcade",
			characterBase: 6,
			itemBaseBonus: 2,
			effectiveBase: 8,
			effectiveMult: 2,
			finalMultiplier: 1,
			total: 16,
			aegisRecovery: false,
			overdriveReleased: false,
			trace: [],
			itemImpacts: [{ itemId: "longshot", kind: "base", scoreDelta: 4 }],
		}, "longshot")).toContain("+4 BASE IMPACT")
	})
})

import { describe, expect, it } from "vitest"
import { getStagePresentationPreset, stageIntensity } from "../stage-presets"

describe("stage presentation presets", () => {
	it("keeps stage families visually distinct while using canonical threat bands", () => {
		expect(getStagePresentationPreset({ stage: "warmup", threatBand: "protected" }).id).toBe("protected-warmup")
		expect(getStagePresentationPreset({ stage: "rush", threatBand: "pressure" }).id).toBe("pressure-rush")
		expect(getStagePresentationPreset({ stage: "glitch", threatBand: "lethal" }).id).toBe("lethal-glitch")
		expect(getStagePresentationPreset({ stage: "warmup", threatBand: "protected" }).laneOrder).not.toEqual(
			getStagePresentationPreset({ stage: "rush", threatBand: "protected" }).laneOrder,
		)
	})

	it("escalates arena intensity from quota, combo, and Overdrive state", () => {
		const calm = stageIntensity({
			stage: "warmup",
			threatBand: "protected",
			combo: 0,
			quotaRatio: 0.1,
			overdriveReady: false,
			focusPaused: false,
			activeGlitch: null,
		})
		const hot = stageIntensity({
			stage: "rush",
			threatBand: "overclocked",
			combo: 16,
			quotaRatio: 0.9,
			overdriveReady: true,
			focusPaused: false,
			activeGlitch: null,
		})
		expect(hot).toBeGreaterThan(calm)
		expect(stageIntensity({
			stage: "rush",
			threatBand: "pressure",
			combo: 16,
			quotaRatio: 1,
			overdriveReady: true,
			focusPaused: true,
			activeGlitch: null,
		})).toBe(0.18)
	})
})

import { afterEach, describe, expect, it, vi } from "vitest"
import { trackEvent } from "../index"

describe("Overdrive telemetry", () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it("returns a typed, timestamped envelope in non-browser environments", () => {
		vi.setSystemTime(new Date("2026-07-25T00:00:00.000Z"))

		const envelope = trackEvent("run_start", {
			seed: "daily-seed",
			mode: "daily",
			language: "EN",
			rulesetVersion: "rules-v1",
			rngVersion: "rng-v1",
			wordPoolVersion: "words-v1",
			zone: 1,
		})

		expect(envelope).toEqual({
			name: "run_start",
			payload: {
				seed: "daily-seed",
				mode: "daily",
				language: "EN",
				rulesetVersion: "rules-v1",
				rngVersion: "rng-v1",
				wordPoolVersion: "words-v1",
				zone: 1,
			},
			timestamp: 1_784_937_600_000,
		})
	})

	it("returns a typed, timestamped envelope for presentation_health", () => {
		vi.setSystemTime(new Date("2026-07-25T00:00:00.000Z"))

		const envelope = trackEvent("presentation_health", {
			seed: "daily-seed",
			mode: "daily",
			language: "EN",
			rulesetVersion: "rules-v1",
			rngVersion: "rng-v1",
			wordPoolVersion: "words-v1",
			scope: "stage",
			stage: "warmup",
			sampleCount: 10,
			frameP50Ms: 16,
			frameP95Ms: 16,
			frameP99Ms: 16,
			cueLatencyP50Ms: 16,
			cueLatencyP95Ms: 16,
			cueLatencyP99Ms: 16,
			hitLatencyP50Ms: 16,
			hitLatencyP95Ms: 16,
			hitLatencyP99Ms: 16,
			lateCueCount: 0,
			lateHitCount: 0,
			decorativeDropCount: 0,
			peakLiveEffects: 0,
			peakUnsettledContacts: 0,
		})

		expect(envelope.name).toBe("presentation_health")
		expect(envelope.payload.sampleCount).toBe(10)
	})
})

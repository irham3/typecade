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
})

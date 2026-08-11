import { afterEach, describe, expect, it, vi } from "vitest"
import { sanitizeProperties, track } from "../index"

describe("product analytics", () => {
	afterEach(() => {
		vi.unstubAllGlobals()
		vi.unstubAllEnvs()
	})

	it("removes PII and raw typing data from event properties", () => {
		expect(sanitizeProperties({
			mode: "overdrive",
			score_bucket: "500-999",
			email: "player@example.com",
			word: "secret",
			build_size: 4,
			invalid: { nested: true },
		})).toEqual({
			mode: "overdrive",
			score_bucket: "500-999",
			build_size: 4,
		})
	})

	it("forwards a typed event when Umami is configured", () => {
		vi.stubEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", "website-id")
		const trackUmami = vi.fn()
		vi.stubGlobal("window", { umami: { track: trackUmami } })

		track("run_started", { mode: "overdrive", language: "EN" })

		expect(trackUmami).toHaveBeenCalledWith("run_started", {
			mode: "overdrive",
			language: "EN",
		})
	})
})

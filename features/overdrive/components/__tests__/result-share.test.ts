import { describe, expect, it } from "vitest"
import { createResultSharePayload } from "../result-share"

describe("result share payload", () => {
	it("is deterministic and contains the build summary", () => {
		const input = {
			seed: "free-seed",
			runScore: 420,
			zone: 3,
			keycaps: ["longshot"],
			macros: ["escape"],
			firmware: [],
			highestMult: 2,
		}
		const first = createResultSharePayload(input)
		expect(first).toEqual(createResultSharePayload(input))
		expect(first.text).toContain("2 Mult")
		expect(first.text).toContain("2 build items")
		expect(first.challengeUrl).toBe("/overdrive?challenge=ZnJlZS1zZWVk&build=longshot.escape")
		expect(first.text).toContain(first.challengeUrl)
	})
})

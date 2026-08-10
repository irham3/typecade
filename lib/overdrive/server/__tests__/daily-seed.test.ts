import { describe, expect, it } from "vitest"
import { deriveDailySeed } from "../daily-seed"

describe("daily seed derivation", () => {
	it("is stable for the same server secret and board identity", async () => {
		const first = await deriveDailySeed("server-secret", "2026-08-10", "EN", "rules-v1")
		const second = await deriveDailySeed("server-secret", "2026-08-10", "EN", "rules-v1")

		expect(first).toBe(second)
	})

	it("changes when the board identity changes", async () => {
		const first = await deriveDailySeed("server-secret", "2026-08-10", "EN", "rules-v1")
		const second = await deriveDailySeed("server-secret", "2026-08-11", "EN", "rules-v1")

		expect(first).not.toBe(second)
	})
})

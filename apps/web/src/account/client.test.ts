import { describe, expect, it } from "vitest"
import { getOceanClient } from "./client"

describe("Vite Adventure Supabase client", () => {
	it("caches a null client when public configuration is absent", () => {
		expect(getOceanClient()).toBeNull()
		expect(getOceanClient()).toBeNull()
	})
})

import { describe, expect, it } from "vitest"
import { createAccountClient, getAccountClient } from "./client"

describe("Vite Adventure Supabase client", () => {
	it("caches a null client when public configuration is absent", () => {
		expect(getAccountClient()).toBeNull()
		expect(getAccountClient()).toBeNull()
	})
	it("accepts only public HTTPS project endpoints and a nonempty key",()=>{
	 for(const [url,key] of [["bad","x"],["http://example.supabase.co","x".repeat(24)],["https://attacker.example","x".repeat(24)],["https://good.supabase.co",""],["https://good.supabase.co","short"]])expect(createAccountClient(url!,key!)).toBeNull()
	 expect(createAccountClient("https://test.supabase.co","x".repeat(24))).not.toBeNull()
	})
})

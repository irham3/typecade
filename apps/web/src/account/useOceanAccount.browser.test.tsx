import { act, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { User } from "@supabase/supabase-js"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import { useOceanAccount, type OceanAccountState } from "./useOceanAccount"

const mockState = vi.hoisted(() => ({ client: null as unknown, listener: null as ((event: string, session: unknown) => void) | null, settings: {} as Record<string, unknown> }))
vi.mock("./client", () => ({ getOceanClient: () => mockState.client }))

const user = { id: "account-test", email: "captain@example.test", user_metadata: { display_name: "Captain" } } as unknown as User
const validSave = serializeOceanSave(createShallowCoastExpedition("account"), createInitialCollection())
let current: OceanAccountState | undefined
let releaseSession: (() => void) | undefined
function Probe() { const account = useOceanAccount(); useEffect(() => { current = account }, [account]); return <output>{account.status}</output> }
function fakeClient() {
	const calls: string[] = []
	const auth = {
		getSession: async () => {
			if (mockState.settings.sessionPending) await new Promise<void>(resolve => { releaseSession = resolve })
			if (mockState.settings.sessionFailure) throw mockState.settings.sessionFailure
			return { data: { session: mockState.settings.session ?? null }, error: mockState.settings.sessionError ?? null }
		},
		onAuthStateChange: (listener: (event: string, session: unknown) => void) => { mockState.listener = listener; return { data: { subscription: { unsubscribe: vi.fn() } } } },
		signInWithPassword: async () => { if (mockState.settings.signInThrow) throw mockState.settings.signInThrow; if (mockState.settings.signInError) return { error: mockState.settings.signInError }; mockState.listener?.("SIGNED_IN", { user }); return { error: null } },
		signUp: async () => { if (mockState.settings.signUpThrow) throw mockState.settings.signUpThrow; if (mockState.settings.signUpError) return { data: { session: null }, error: mockState.settings.signUpError }; if (mockState.settings.signUpSession) mockState.listener?.("SIGNED_IN", { user }); return { data: { session: mockState.settings.signUpSession ? { user } : null }, error: null } },
		signOut: async () => { if (mockState.settings.signOutThrow) throw mockState.settings.signOutThrow; if (mockState.settings.signOutError) return { error: mockState.settings.signOutError }; mockState.listener?.("SIGNED_OUT", null); return { error: null } },
	}
	const client = { auth, from(table: string) {
		const query = {
			select: () => query, eq: () => query, order: () => query,
			limit: async () => { calls.push(`select:${table}`); if (mockState.settings.queryThrow) throw mockState.settings.queryThrow; return mockState.settings.queryResult ?? { data: [], error: null } },
			maybeSingle: async () => { calls.push(`single:${table}`); if (mockState.settings.queryThrow) throw mockState.settings.queryThrow; return mockState.settings.queryResult ?? { data: null, error: null } },
			upsert: async () => { calls.push(`upsert:${table}`); if (mockState.settings.upsertThrow) throw mockState.settings.upsertThrow; return mockState.settings.upsertResult ?? { error: null } },
		}
		return query
	} }
	return { client, calls }
}

describe("Adventure account session", () => {
	let host: HTMLDivElement
	let root: Root
	beforeEach(() => {
		;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
		mockState.client = null; mockState.listener = null; mockState.settings = {}; current = undefined; releaseSession = undefined
		host = document.createElement("div"); document.body.append(host); root = createRoot(host)
	})
	afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks() })
	async function mount() {
		await act(async () => { root.render(<Probe />) })
		await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
	}
	async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) }) }

	it("keeps play available when account sync is unconfigured", async () => {
		await mount()
		expect(current!.loading).toBe(false)
		await act(async () => { expect(await current!.signIn("a@b.test", "password")).toBe(false) })
		await act(async () => { expect(await current!.signUp("a@b.test", "password123", "Captain")).toBe(false) })
		await current!.signOut(); await current!.syncSave("{}"); expect(await current!.restoreSave()).toBeNull()
		await current!.refresh()
		expect(current!.status).toContain("not configured")
	})

	it("restores sessions, signs in and signs up, syncs queries, and signs out", async () => {
		const mock = fakeClient(); mockState.client = mock.client
		mockState.settings.session = { user }
		await mount(); expect(current!.user?.id).toBe(user.id)
		mockState.settings.queryResult = { data: [{ user_id: user.id, display_name: "Captain", xp: 40, catches: 1, species_discovered: 1, best_voyage: 1 }], error: null }
		await act(async () => current!.refresh()); expect(current!.leaderboard[0]?.xp).toBe(40)
		mockState.settings.queryResult = { data: [{ achievement_id: "first_catch", unlocked_at: "today" }], error: null }
		await act(async () => { expect(await current!.signIn(" captain@example.test ", "secret")).toBe(true) })
		await settle()
		expect(current!.user?.id).toBe(user.id)
		await act(async () => { expect(await current!.signUp("captain@example.test", "short", "A")).toBe(false) })
		mockState.settings.signUpError = new Error("email rejected")
		await act(async () => { expect(await current!.signUp("captain@example.test", "password123", "Captain")).toBe(false) })
		mockState.settings.signUpError = null
		mockState.settings.signUpSession = true
		await act(async () => { expect(await current!.signUp("captain@example.test", "password123", "Captain")).toBe(true) })
		await settle()
		await act(async () => current!.syncSave(JSON.stringify({ contentVersion: "invalid" })))
		mockState.settings.queryResult = { data: { save_data: { savedAt: "2026-10-01" } }, error: null }
		await act(async () => { expect(await current!.restoreSave()).toContain("savedAt") })
		mockState.settings.signOutError = new Error("cannot sign out")
		await act(async () => current!.signOut()); expect(current!.status).toBe("cannot sign out")
		mockState.settings.signOutError = null; await act(async () => current!.signOut()); await settle()
		expect(current!.user).toBeNull()
		expect(mock.calls).toContain("select:ocean_progress")
	})

	it("reports returned and thrown auth, restore, sync and query errors", async () => {
		const mock = fakeClient(); mockState.client = mock.client; mockState.settings.session = { user }
		await mount()
		mockState.settings.signInError = new Error("bad password")
		await act(async () => { expect(await current!.signIn("captain@example.test", "bad")).toBe(false) })
		expect(current!.status).toBe("bad password")
		mockState.settings.signInError = null; mockState.settings.signInThrow = "network down"
		await act(async () => { expect(await current!.signIn("captain@example.test", "bad")).toBe(false) })
		expect(current!.status).toBe("Could not sign in.")
		mockState.settings.signInThrow = new Error("signin down")
		await act(async () => { expect(await current!.signIn("captain@example.test", "bad")).toBe(false) })
		expect(current!.status).toBe("signin down")
		mockState.settings.signInThrow = null; mockState.settings.signUpThrow = "signup down"
		await act(async () => { expect(await current!.signUp("captain@example.test", "password123", "Captain")).toBe(false) })
		expect(current!.status).toBe("Could not create account.")
		mockState.settings.signUpThrow = new Error("signup down")
		await act(async () => { expect(await current!.signUp("captain@example.test", "password123", "Captain")).toBe(false) })
		expect(current!.status).toBe("signup down")
		mockState.settings.signUpThrow = null; mockState.settings.signOutThrow = "signout down"
		await act(async () => current!.signOut()); expect(current!.status).toBe("Could not sign out.")
		mockState.settings.signOutThrow = new Error("signout unavailable")
		await act(async () => current!.signOut()); expect(current!.status).toBe("signout unavailable")
		mockState.settings.signOutThrow = null; mockState.settings.queryResult = { data: null, error: new Error("db rejected") }
		await act(async () => current!.refresh()); expect(current!.status).toBe("db rejected")
		mockState.settings.queryResult = { data: null, error: null }; mockState.settings.queryThrow = "network rejected"
		await act(async () => current!.refresh()); expect(current!.status).toBe("Could not load captain records.")
		await act(async () => { expect(await current!.restoreSave()).toBeNull() }); expect(current!.status).toBe("Adventure save could not load.")
		mockState.settings.queryThrow = new Error("save fetch failed")
		await act(async () => { expect(await current!.restoreSave()).toBeNull() }); expect(current!.status).toBe("save fetch failed")
		mockState.settings.queryThrow = null; mockState.settings.upsertThrow = "save rejected"
		await act(async () => current!.syncSave(validSave)); expect(current!.status).toBe("Adventure save could not sync.")
		mockState.settings.upsertThrow = new Error("save rejected")
		await act(async () => current!.syncSave(validSave)); expect(current!.status).toBe("save rejected")
	})

	it("handles failed session restore and unauthenticated sign-up confirmation", async () => {
		const mock = fakeClient(); mockState.client = mock.client; mockState.settings.sessionFailure = "session failed"
		await mount(); expect(current!.status).toBe("Could not restore account session.")
		await act(async () => root.unmount()); root = createRoot(host)
		mockState.settings.sessionFailure = new Error("session offline")
		await mount(); expect(current!.status).toBe("session offline")
		await act(async () => root.unmount())
		root = createRoot(host)
		mockState.settings.sessionFailure = null; mockState.settings.sessionError = new Error("session warning")
		await mount(); expect(current!.status).toBe("session warning")
		mockState.settings.sessionError = null; mockState.settings.signUpSession = false
		await act(async () => { expect(await current!.signUp("captain@example.test", "password123", "Captain")).toBe(true) })
		expect(current!.status).toContain("Check your email")
	})

	it("ignores a session response that arrives after unmount", async () => {
		const mock = fakeClient(); mockState.client = mock.client; mockState.settings.sessionPending = true
		await act(async () => root.render(<Probe />))
		await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })
		expect(releaseSession).toBeTypeOf("function")
		await act(async () => root.unmount())
		await act(async () => { releaseSession?.(); await new Promise(resolve => setTimeout(resolve, 0)) })
		expect(mockState.listener).not.toBeNull()
	})

	it("reports a delayed session failure while the account screen stays mounted", async () => {
		const mock = fakeClient(); mockState.client = mock.client; mockState.settings.sessionPending = true
		await act(async () => root.render(<Probe />))
		mockState.settings.sessionFailure = "session offline"
		await act(async () => { releaseSession?.(); await new Promise(resolve => setTimeout(resolve, 0)) })
		expect(current!.status).toBe("Could not restore account session.")
	})
})

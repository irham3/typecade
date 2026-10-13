import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import type { CollectionRecord } from "@typecade/contracts"
import { createInitialCollection, createShallowCoastExpedition, serializeOceanSave } from "@typecade/game-rules"
import {
	createOceanClient, displayName, earnedOceanAchievements, loadOceanAchievements, loadOceanLeaderboard,
	loadOceanSave, mergeOceanSaves, oceanAchievements, reportSessionRestoreError, syncOceanSave,
} from "./ocean-account"

const user = { id: "captain-1", email: "sailor@example.com", user_metadata: { display_name: "Sailor" } } as unknown as User
const record = (fishId: string, count = 1, firstCaughtAt = "2026-10-01T00:00:00.000Z", lastCaughtAt = "2026-10-02T00:00:00.000Z") => ({ fishId, count, largestSizeKg: 1, bestQuality: 1, firstCaughtAt, lastCaughtAt })
function save({ xp = 0, voyage = 1, records = {} as Record<string, CollectionRecord>, savedAt = "2026-10-01T00:00:00.000Z" }: { xp?: number; voyage?: number; records?: Record<string, CollectionRecord>; savedAt?: string } = {}) {
	const expedition = { ...createShallowCoastExpedition("test"), voyage }
	const collection = { ...createInitialCollection(), xp, records }
	return serializeOceanSave(expedition, collection, savedAt)
}
function mockClient(results: Array<{ data?: unknown; error?: unknown }> = []) {
	const calls: Array<{ table: string; operation: string; args: unknown[] }> = []
	const client = { from(table: string) {
		const state = { operation: "", args: [] as unknown[] }
		const query = {
			select: (...args: unknown[]) => { state.operation = "select"; state.args.push(...args); return query },
			upsert: (...args: unknown[]) => { state.operation = "upsert"; state.args.push(...args); return query },
			eq: (...args: unknown[]) => { state.args.push(...args); return query },
			order: (...args: unknown[]) => { state.args.push(...args); return query },
			limit: (...args: unknown[]) => { state.args.push(...args); return Promise.resolve(results.shift() ?? { data: null, error: null }) },
			maybeSingle: () => Promise.resolve(results.shift() ?? { data: null, error: null }),
			then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
				calls.push({ table, operation: state.operation, args: state.args })
				return Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve, reject)
			},
		}
		return query
	} } as unknown as SupabaseClient
	return { client, calls }
}

describe("Adventure account data", () => {
	it("filters late session errors and keeps useful active errors", () => {
		const report = vi.fn()
		reportSessionRestoreError(new Error("session offline"), true, report)
		reportSessionRestoreError("offline", true, report)
		reportSessionRestoreError("late offline", false, report)
		expect(report.mock.calls).toEqual([["session offline"], ["Could not restore account session."]])
	})
	it("accepts only Supabase URLs and a public key", () => {
		expect(createOceanClient("", "")).toBeNull()
		expect(createOceanClient("http://example.com", "x".repeat(30))).toBeNull()
		expect(createOceanClient("https://example.com", "x".repeat(30))).toBeNull()
		expect(createOceanClient("https://supa.supabase.co", "x".repeat(30))).not.toBeNull()
		expect(createOceanClient("https://supa.supabase.in", "x".repeat(30))).not.toBeNull()
		expect(createOceanClient("https://supa.supabase.co", "short")).toBeNull()
	})

	it("uses safe account names and a visible fallback", () => {
		expect(displayName(user)).toBe("Sailor")
		expect(displayName({ ...user, user_metadata: { username: "<Skipper>\n" } })).toBe("Skipper")
		expect(displayName({ ...user, email: "captain@example.com", user_metadata: {} })).toBe("Ocean Captain")
		expect(displayName({ ...user, email: undefined, user_metadata: {} })).toBe("Ocean Captain")
		expect(displayName({ ...user, user_metadata: { display_name: "< >" } })).toBe("Ocean Captain")
	})

	it("unlocks only Adventure achievements earned by the saved collection", () => {
		expect(earnedOceanAchievements("broken")).toEqual([])
		expect(earnedOceanAchievements(save())).toEqual([])
		const full = save({ xp: 5000, voyage: 2, records: {
			reef_minnow: record("reef_minnow", 2), coral_fry: record("coral_fry"), crown_leviathan: record("crown_leviathan"),
		} })
		expect(earnedOceanAchievements(full)).toEqual(oceanAchievements.map(item => item.id))
	})

	it("merges local and account saves without dropping discoveries or double counting", () => {
		expect(mergeOceanSaves(null, null)).toBeNull()
		const local = save({ xp: 40, records: { reef_minnow: record("reef_minnow", 3) } })
		const cloud = save({ xp: 80, voyage: 2, savedAt: "2026-10-03T00:00:00.000Z", records: { reef_minnow: record("reef_minnow", 2, "2026-10-02T00:00:00.000Z", "2026-10-04T00:00:00.000Z"), coral_fry: record("coral_fry") } })
		const merged = JSON.parse(mergeOceanSaves(local, cloud)!)
		expect(merged.expedition.voyage).toBe(2)
		expect(merged.collection.xp).toBe(80)
		expect(merged.collection.records.reef_minnow.count).toBe(3)
		expect(merged.collection.records.reef_minnow.firstCaughtAt).toBe("2026-10-01T00:00:00.000Z")
		expect(merged.collection.records.reef_minnow.lastCaughtAt).toBe("2026-10-04T00:00:00.000Z")
		expect(Object.keys(merged.collection.records)).toHaveLength(2)
		expect(mergeOceanSaves("invalid", cloud)).toBe(cloud)
		expect(mergeOceanSaves(local, "invalid")).toBe(local)
		expect(JSON.parse(mergeOceanSaves(cloud, local)!).expedition.voyage).toBe(2)
	})

	it("loads account saves and reports database errors", async () => {
		const { client } = mockClient([{ data: { save_data: { savedAt: "2026-10-01" } }, error: null }, { data: null, error: null }, { data: null, error: new Error("offline") }])
		expect(await loadOceanSave(client, user.id)).toContain("savedAt")
		expect(await loadOceanSave(client, user.id)).toBeNull()
		await expect(loadOceanSave(client, user.id)).rejects.toThrow("offline")
	})

	it("writes private saves and account progress before idempotent achievements", async () => {
		const empty = mockClient()
		await syncOceanSave(empty.client, user, "invalid")
		expect(empty.calls).toHaveLength(0)
		const noAwards = mockClient()
		await syncOceanSave(noAwards.client, user, save())
		expect(noAwards.calls.map(call => call.table)).toEqual(["ocean_saves", "ocean_progress"])
		const award = save({ xp: 5000, voyage: 2, records: { reef_minnow: record("reef_minnow"), coral_fry: record("coral_fry"), crown_leviathan: record("crown_leviathan") } })
		const full = mockClient()
		await syncOceanSave(full.client, user, award)
		expect(full.calls.map(call => call.table)).toEqual(["ocean_saves", "ocean_progress", "ocean_achievements"])
		expect((full.calls[2]!.args[0] as unknown[])).toHaveLength(5)
	})

	it("surfaces save, leaderboard and achievement query failures", async () => {
		const saveError = mockClient([{ data: null, error: new Error("save") }])
		await expect(syncOceanSave(saveError.client, user, save())).rejects.toThrow("save")
		const progressError = mockClient([{ data: null, error: null }, { data: null, error: new Error("progress") }])
		await expect(syncOceanSave(progressError.client, user, save())).rejects.toThrow("progress")
		const achievementError = mockClient([{ data: null, error: null }, { data: null, error: null }, { data: null, error: new Error("achievement") }])
		await expect(syncOceanSave(achievementError.client, user, save({ records: { reef_minnow: record("reef_minnow") } }))).rejects.toThrow("achievement")
		const boards = mockClient([{ data: [{ user_id: user.id }], error: null }, { data: null, error: null }, { data: null, error: new Error("board") }])
		expect(await loadOceanLeaderboard(boards.client)).toHaveLength(1)
		expect(await loadOceanLeaderboard(boards.client)).toEqual([])
		await expect(loadOceanLeaderboard(boards.client)).rejects.toThrow("board")
		const awards = mockClient([{ data: [{ achievement_id: "first_catch" }], error: null }, { data: null, error: null }, { data: null, error: new Error("awards") }])
		expect(await loadOceanAchievements(awards.client, user.id)).toHaveLength(1)
		expect(await loadOceanAchievements(awards.client, user.id)).toEqual([])
		await expect(loadOceanAchievements(awards.client, user.id)).rejects.toThrow("awards")
	})
})

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"
import { getAccountLevelProgress, restoreOceanSave, serializeOceanSave } from "@typecade/game-rules"

export const oceanAchievements = [
	{ id: "first_catch", title: "First Catch", detail: "Land your first fish." },
	{ id: "three_species", title: "Local Naturalist", detail: "Discover three fish species." },
	{ id: "captain_level_5", title: "Seasoned Captain", detail: "Reach captain level 5." },
	{ id: "voyage_2", title: "Farther Waters", detail: "Begin your second voyage." },
	{ id: "leviathan_caught", title: "Leviathan Tamer", detail: "Catch the Crown Leviathan." },
] as const
export interface OceanLeaderboardRow { user_id: string; display_name: string; xp: number; catches: number; species_discovered: number; best_voyage: number }
export interface OceanAchievementRecord { achievement_id: string; unlocked_at: string }

export function reportSessionRestoreError(error: unknown, active: boolean, report: (message: string) => void): void {
	if (!active) return
	report(error instanceof Error ? error.message : "Could not restore account session.")
}

export function createOceanClient(url: string, key: string): SupabaseClient | null {
	try {
		const parsed = new URL(url)
		if (parsed.protocol !== "https:" || !/(?:^|\.)supabase\.(?:co|in)$/i.test(parsed.hostname) || !key || key.length < 20) return null
		return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
	} catch {
		return null
	}
}

export function displayName(user: User): string {
	const metadata = user.user_metadata?.display_name ?? user.user_metadata?.username
	const name = typeof metadata === "string" ? metadata.trim() : undefined
	return (name || "Ocean Captain").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 24) || "Ocean Captain"
}

export function earnedOceanAchievements(save: string): string[] {
	const restored = restoreOceanSave(save)
	if (!restored) return []
	const collection = restored.collection
	const catches = Object.values(collection.records).reduce((total, record) => total + record.count, 0)
	const level = getAccountLevelProgress(collection.xp).level
	return oceanAchievements.filter(({ id }) => id === "first_catch" ? catches > 0
		: id === "three_species" ? Object.keys(collection.records).length >= 3
		: id === "captain_level_5" ? level >= 5
		: id === "voyage_2" ? restored.expedition.voyage >= 2
		: (collection.records.crown_leviathan?.count ?? 0) > 0).map(({ id }) => id)
}

export function mergeOceanSaves(localSave: string | null, cloudSave: string | null): string | null {
	const local = restoreOceanSave(localSave)
	const cloud = restoreOceanSave(cloudSave)
	if (!local) return cloudSave && cloud ? cloudSave : null
	if (!cloud) return localSave
	const records = { ...local.collection.records }
	for (const [fishId, cloudRecord] of Object.entries(cloud.collection.records)) {
		const localRecord = records[fishId]
		records[fishId] = localRecord ? { ...cloudRecord, ...localRecord, count: Math.max(localRecord.count, cloudRecord.count), firstCaughtAt: localRecord.firstCaughtAt < cloudRecord.firstCaughtAt ? localRecord.firstCaughtAt : cloudRecord.firstCaughtAt, lastCaughtAt: localRecord.lastCaughtAt > cloudRecord.lastCaughtAt ? localRecord.lastCaughtAt : cloudRecord.lastCaughtAt } : cloudRecord
	}
	const newest = local.savedAt >= cloud.savedAt ? local : cloud
	return serializeOceanSave(newest.expedition, {
		records, xp: Math.max(local.collection.xp, cloud.collection.xp), coins: Math.max(local.collection.coins, cloud.collection.coins),
		materials: Math.max(local.collection.materials, cloud.collection.materials),
		grantedResultKeys: [...new Set([...local.collection.grantedResultKeys, ...cloud.collection.grantedResultKeys])],
	}, local.savedAt >= cloud.savedAt ? local.savedAt : cloud.savedAt)
}

export async function loadOceanSave(client: SupabaseClient, userId: string): Promise<string | null> {
	const { data, error } = await client.from("ocean_saves").select("save_data").eq("user_id", userId).maybeSingle()
	if (error) throw error
	return data?.save_data ? JSON.stringify(data.save_data) : null
}

export async function syncOceanSave(client: SupabaseClient, user: User, save: string): Promise<void> {
	const restored = restoreOceanSave(save)
	if (!restored) return
	const achievements = earnedOceanAchievements(save)
	const catches = Object.values(restored.collection.records).reduce((total, record) => total + record.count, 0)
	const name = displayName(user)
	const saveResult = await client.from("ocean_saves").upsert({ user_id: user.id, save_data: JSON.parse(save), updated_at: restored.savedAt }, { onConflict: "user_id" })
	if (saveResult.error) throw saveResult.error
	const progressResult = await client.from("ocean_progress").upsert({
		user_id: user.id, display_name: name, xp: restored.collection.xp, coins: restored.collection.coins,
		catches, species_discovered: Object.keys(restored.collection.records).length,
		best_voyage: restored.expedition.voyage, updated_at: restored.savedAt,
	}, { onConflict: "user_id" })
	if (progressResult.error) throw progressResult.error
	if (achievements.length) {
		const result = await client.from("ocean_achievements").upsert(achievements.map(achievement_id => ({ user_id: user.id, achievement_id })), { onConflict: "user_id,achievement_id", ignoreDuplicates: true })
		if (result.error) throw result.error
	}
}

export async function loadOceanLeaderboard(client: SupabaseClient): Promise<OceanLeaderboardRow[]> {
	const { data, error } = await client.from("ocean_progress").select("user_id,display_name,xp,catches,species_discovered,best_voyage")
		.order("xp", { ascending: false }).order("catches", { ascending: false }).limit(10)
	if (error) throw error
	return (data ?? []) as unknown as OceanLeaderboardRow[]
}

export async function loadOceanAchievements(client: SupabaseClient, userId: string): Promise<OceanAchievementRecord[]> {
	const { data, error } = await client.from("ocean_achievements").select("achievement_id,unlocked_at").eq("user_id", userId)
	if (error) throw error
	return (data ?? []) as unknown as OceanAchievementRecord[]
}

import { useCallback, useEffect, useState } from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { getOceanClient } from "./client"
import { loadOceanAchievements, loadOceanLeaderboard, loadOceanSave, reportSessionRestoreError, syncOceanSave } from "./ocean-account"

export interface OceanAccountState {
	client: SupabaseClient | null
	user: User | null
	loading: boolean
	status: string
	leaderboard: Awaited<ReturnType<typeof loadOceanLeaderboard>>
	achievements: Awaited<ReturnType<typeof loadOceanAchievements>>
	signIn(email: string, password: string): Promise<boolean>
	signUp(email: string, password: string, displayName: string): Promise<boolean>
	signOut(): Promise<void>
	refresh(): Promise<void>
	syncSave(save: string): Promise<void>
	restoreSave(): Promise<string | null>
}

export function useOceanAccount(): OceanAccountState {
	const client = getOceanClient()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(Boolean(client))
	const [status, setStatus] = useState(client ? "" : "Account sync is unavailable: Supabase is not configured.")
	const [leaderboard, setLeaderboard] = useState<OceanAccountState["leaderboard"]>([])
	const [achievements, setAchievements] = useState<OceanAccountState["achievements"]>([])

	const refresh = useCallback(async () => {
		if (!client) return
		try {
			const [board, earned] = await Promise.all([
				loadOceanLeaderboard(client),
				user ? loadOceanAchievements(client, user.id) : Promise.resolve([]),
			])
			setLeaderboard(board); setAchievements(earned)
		} catch (error) { setStatus(error instanceof Error ? error.message : "Could not load captain records.") }
	}, [client, user])

	useEffect(() => {
		if (!client) return
		let active = true
		void client.auth.getSession().then(({ data, error }) => {
			if (!active) return
			if (error) setStatus(error.message)
			setUser(data.session?.user ?? null); setLoading(false)
		}).catch(error => {
			reportSessionRestoreError(error, active, message => { setStatus(message); setLoading(false) })
		})
		const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null); setLoading(false)
			if (!session) setAchievements([])
		})
		return () => { active = false; subscription.unsubscribe() }
	}, [client])

	useEffect(() => { void Promise.resolve().then(refresh) }, [refresh])

	const signIn = useCallback(async (email: string, password: string) => {
		if (!client) { setStatus("Account sync is unavailable: Supabase is not configured."); return false }
		setLoading(true)
		try {
			const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
			if (error) { setStatus(error.message); return false }
			setStatus("Signed in. Adventure progress is syncing."); return true
		} catch (error) { setStatus(error instanceof Error ? error.message : "Could not sign in."); return false }
		finally { setLoading(false) }
	}, [client])

	const signUp = useCallback(async (email: string, password: string, name: string) => {
		if (!client) { setStatus("Account sync is unavailable: Supabase is not configured."); return false }
		if (password.length < 8 || name.trim().length < 2) { setStatus("Use a display name and a password with at least 8 characters."); return false }
		setLoading(true)
		try {
			const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim().slice(0, 24) } } })
			if (error) { setStatus(error.message); return false }
			setStatus(data.session ? "Account created. Adventure progress is syncing." : "Account created. Check your email to confirm it.")
			return true
		} catch (error) { setStatus(error instanceof Error ? error.message : "Could not create account."); return false }
		finally { setLoading(false) }
	}, [client])

	const signOut = useCallback(async () => {
		if (!client) return
		try {
			const { error } = await client.auth.signOut()
			setStatus(error?.message ?? "Signed out. Your local captain save is kept on this device.")
		} catch (error) { setStatus(error instanceof Error ? error.message : "Could not sign out.") }
	}, [client])

	const syncSave = useCallback(async (save: string) => {
		if (!client || !user) return
		try { await syncOceanSave(client, user, save); await refresh() }
		catch (error) { setStatus(error instanceof Error ? error.message : "Adventure save could not sync.") }
	}, [client, refresh, user])

	const restoreSave = useCallback(async () => {
		if (!client || !user) return null
		try { return await loadOceanSave(client, user.id) }
		catch (error) { setStatus(error instanceof Error ? error.message : "Adventure save could not load."); return null }
	}, [client, user])

	return { client, user, loading, status, leaderboard, achievements, signIn, signUp, signOut, refresh, syncSave, restoreSave }
}

import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import type { Database } from "./database.types"

function getConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
		?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !key) return null
	return { url, key }
}

export async function getAuthenticatedUser(request: Request): Promise<User | null> {
	const authorization = request.headers.get("authorization")
	if (!authorization?.startsWith("Bearer ")) return null
	const config = getConfig()
	if (!config) return null

	const client = createClient<Database>(config.url, config.key, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
	})
	const { data, error } = await client.auth.getUser(authorization.slice("Bearer ".length))
	return error ? null : data.user
}

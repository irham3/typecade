import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

export function getSupabaseAdminClient(): SupabaseClient<Database> {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
	if (!url || !serviceRoleKey) {
		throw new Error("Supabase server configuration is incomplete")
	}
	return createClient<Database>(url, serviceRoleKey, {
		auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
	})
}

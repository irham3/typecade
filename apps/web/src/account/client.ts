import { createOceanClient } from "./ocean-account"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null | undefined

export function getOceanClient(): SupabaseClient | null {
	if (client === undefined) client = createOceanClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
	return client
}

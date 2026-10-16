import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export function createAccountClient(url: string, key: string): SupabaseClient | null {
 try {
  const parsed = new URL(url)
  if (parsed.protocol !== "https:" || !/(?:^|\.)supabase\.(?:co|in)$/i.test(parsed.hostname) || !key || key.length < 20) return null
  return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
 } catch { return null }
}
let client: SupabaseClient | null | undefined
export function getAccountClient(): SupabaseClient | null {
 if (client === undefined) client = createAccountClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
 return client
}

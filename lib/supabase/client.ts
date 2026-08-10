import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Singleton Supabase client for the browser.
 *
 * Three guard rails here:
 *   1. Returns null if either env var is missing — call sites handle this
 *      as "no signed-in features" rather than throwing.
 *   2. Returns null if the URL doesn't look like a Supabase project
 *      (`https://<ref>.supabase.co`). This catches:
 *        - empty/placeholder URLs from a fresh `.env.local` clone
 *        - the rare case where the project was deleted and the URL now
 *          fails DNS — without this guard the auth-js client would log
 *          an unhelpful "Failed to fetch" on every page load.
 *   3. Validates the anon key looks like a JWT (three dot-separated
 *      base64 segments). Empty / placeholder values would silently work
 *      for `createClient` but fail every request — better to fail loud
 *      at startup.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function looksLikeSupabaseUrl(url: string): boolean {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") return false;
        // Supabase project URLs always end in .supabase.co (or
        // .supabase.in for older projects; both accepted).
        return /(?:^|\.)supabase\.(?:co|in)$/i.test(parsed.hostname);
    } catch {
        return false;
    }
}

function looksLikeJwt(token: string): boolean {
    if (!token) return false;
    const parts = token.split(".");
    return parts.length === 3 && parts.every((p) => p.length > 0);
}

export const isSupabaseConfigured: boolean =
    looksLikeSupabaseUrl(supabaseUrl) && looksLikeJwt(supabaseAnonKey);

let supabaseClient: SupabaseClient<Database> | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
    if (supabaseClient) return supabaseClient;
    if (!isSupabaseConfigured) return null;
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    });
    return supabaseClient;
};

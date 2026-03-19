import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
    if (supabaseClient) return supabaseClient;
    if (!supabaseUrl || !supabaseAnonKey) return null;
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });
    return supabaseClient;
};

/**
 * Centralized Supabase error classification + tuning constants.
 *
 * Free-tier Supabase projects auto-pause after ~7 days of inactivity and take
 * 1-2 minutes to wake up on the next request. During that window, queries
 * return errors that the UI previously swallowed silently, making the app look
 * broken (empty leaderboards, empty rooms, missing profile). This module lets
 * call sites detect that specific condition and surface a helpful message.
 */

/** Polling interval for the lobby room list (ms). 30s is a good balance of
 *  freshness vs Supabase resource usage on the free tier. */
export const LOBBY_POLL_INTERVAL_MS = 30_000;

/** Polling interval for the leaderboard (ms). Leaderboards rarely change fast. */
export const BOARD_POLL_INTERVAL_MS = 60_000;

type SupabaseErrorLike = {
    message?: string;
    code?: string | number;
};

/**
 * Returns true if the given Supabase error looks like the database is paused,
 * waking up, or otherwise temporarily unreachable.
 */
export function isSupabaseUnavailable(error: SupabaseErrorLike | null | undefined): boolean {
    if (!error) return false;
    const message = (error.message ?? "").toLowerCase();
    const code = String(error.code ?? "");

    // Supabase pause / wake-up signals
    if (message.includes("project is paused")) return true;
    if (message.includes("project paused")) return true;
    if (message.includes("waking up")) return true;
    if (message.includes("connection terminated")) return true;
    if (message.includes("fetch failed")) return true;
    if (message.includes("network request failed")) return true;
    if (message.includes("networkerror")) return true;
    if (message.includes("econnrefused")) return true;
    if (message.includes("econnreset")) return true;
    if (message.includes("timeout")) return true;
    if (code === "PGRST301" || code === "503") return true; // service unavailable

    return false;
}

/**
 * Convenience alias — most call sites care about "should we show the
 * 'database is waking up' banner?". Same logic as isSupabaseUnavailable.
 */
export function classifySupabaseError(error: SupabaseErrorLike | null | undefined): boolean {
    return isSupabaseUnavailable(error);
}

/** Human-friendly copy for the unavailable banner / toast. */
export const SUPABASE_UNAVAILABLE_MESSAGE =
    "The database is waking up from sleep. This usually takes 1-2 minutes — please wait or refresh shortly.";

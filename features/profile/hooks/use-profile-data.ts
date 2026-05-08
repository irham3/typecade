import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/store";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useProfileData() {
    const { user, supabaseReady } = useAuth();
    const storeStats = useStore(state => state.stats);
    const [stats, setStats] = useState(storeStats);
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [memberSince, setMemberSince] = useState("");
    const [timeframe, setTimeframe] = useState("All time");
    const [refreshKey, setRefreshKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const formatMemberSince = useMemo(() => {
        const date = user?.created_at ? new Date(user.created_at) : null;
        if (!date) return "";
        return `Member since ${date.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
    }, [user?.created_at]);

    useEffect(() => {
        setMemberSince(formatMemberSince);
    }, [formatMemberSince]);

    useEffect(() => {
        if (!supabaseReady || !user) return;
        const client = getSupabaseClient();
        if (!client) return;
        const load = async () => {
            setIsLoading(true);
            try {
                const [{ data: profile }, { data: statsRow }, { data: history }] = await Promise.all([
                client.from("profiles").select("display_name, username, created_at").eq("user_id", user.id).maybeSingle(),
                client.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
                client
                    .from("typing_tests")
                    .select("created_at, mode, mode_value, wpm, accuracy, duration_seconds")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(100),
            ]);

            const profileRow = (profile ?? null) as { display_name?: string; username?: string; created_at?: string } | null;
            if (profileRow?.username) {
                setUsername(profileRow.username);
            }
            if (profileRow?.display_name) {
                setDisplayName(profileRow.display_name);
            } else if (profileRow?.username) {
                setDisplayName(profileRow.username);
            } else if (user.email) {
                setDisplayName(user.email.split("@")[0]);
            } else {
                setDisplayName("Typecade User");
            }

            if (profileRow?.created_at) {
                const date = new Date(profileRow.created_at);
                setMemberSince(`Member since ${date.toLocaleString("en-US", { month: "short", year: "numeric" })}`);
            }

            const historyRows = ((history ?? []) as Array<{
                created_at: string;
                mode: string;
                mode_value: number;
                wpm: number;
                accuracy: number;
                duration_seconds: number;
            }>).map((row) => ({
                date: new Date(row.created_at).toISOString().split("T")[0],
                mode: row.mode === "time" ? `Time ${row.mode_value}s` : row.mode === "words" ? `Words ${row.mode_value}` : row.mode,
                wpm: row.wpm,
                accuracy: row.accuracy,
                duration: row.duration_seconds,
            }));

            const s = (statsRow ?? null) as {
                best_wpm?: number;
                best_accuracy?: number;
                total_tests?: number;
                total_time_typed_seconds?: number;
                avg_wpm?: number;
                avg_accuracy?: number;
            } | null;

            if (s) {
                setStats({
                    wpm: s.best_wpm ?? 0,
                    accuracy: s.best_accuracy ?? 0,
                    tests: s.total_tests ?? 0,
                    timeTyped: Math.floor((s.total_time_typed_seconds ?? 0) / 60),
                    avgWpm: s.avg_wpm ?? 0,
                    avgAccuracy: s.avg_accuracy ?? 0,
                    history: historyRows,
                });
            } else if (historyRows.length > 0) {
                const bestWpm = Math.max(...historyRows.map(h => h.wpm));
                const bestAccuracy = Math.max(...historyRows.map(h => h.accuracy));
                const totalTests = historyRows.length;
                const totalTime = historyRows.reduce((sum, h) => sum + h.duration, 0);
                const avgWpm = Math.round(historyRows.reduce((sum, h) => sum + h.wpm, 0) / totalTests);
                const avgAcc = Math.round(historyRows.reduce((sum, h) => sum + h.accuracy, 0) / totalTests);
                setStats({
                    wpm: bestWpm,
                    accuracy: bestAccuracy,
                    tests: totalTests,
                    timeTyped: Math.floor(totalTime / 60),
                    avgWpm,
                    avgAccuracy: avgAcc,
                    history: historyRows,
                });
            }
            } finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [supabaseReady, user, refreshKey]);

    const reloadProfile = useCallback(() => {
        setRefreshKey(k => k + 1);
    }, []);

    const filteredHistory = useMemo(() => {
        if (!stats.history) return [];
        let valid = stats.history.filter((h) => h.wpm > 0);
        
        if (timeframe === "Last 7 days") {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 7);
            valid = valid.filter((h) => new Date(h.date) >= dateLimit);
        } else if (timeframe === "Last 30 days") {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 30);
            valid = valid.filter((h) => new Date(h.date) >= dateLimit);
        }
        return valid;
    }, [stats.history, timeframe]);

    return {
        user,
        stats,
        displayName,
        username,
        memberSince,
        timeframe,
        setTimeframe,
        filteredHistory,
        reloadProfile,
        isLoading,
    };
}

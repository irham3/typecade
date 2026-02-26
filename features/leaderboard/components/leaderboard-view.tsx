import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export function LeaderboardView() {
    const { user, supabaseReady } = useAuth();
    const [filterMode, setFilterMode] = useState("All Time");
    const [rows, setRows] = useState<Array<{
        user_id: string;
        display_name: string;
        best_wpm: number;
        best_accuracy: number;
        total_tests: number;
    }>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const queryParams = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (filterMode === "Today") {
            return { mode: null, modeValue: null, since: today.toISOString() };
        }
        if (filterMode === "This Week") {
            const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return { mode: null, modeValue: null, since: since.toISOString() };
        }
        if (filterMode === "Words 50") {
            return { mode: "words", modeValue: 50, since: null };
        }
        if (filterMode === "Time 60s") {
            return { mode: "time", modeValue: 60, since: null };
        }
        return { mode: null, modeValue: null, since: null };
    }, [filterMode]);

    useEffect(() => {
        if (!supabaseReady) return;
        const load = async () => {
            const client = getSupabaseClient();
            if (!client) return;
            setIsLoading(true);
            const rawClient = client as unknown as Record<string, (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>>;
            const { data, error } = await rawClient.rpc("get_leaderboard", {
                p_mode: queryParams.mode,
                p_mode_value: queryParams.modeValue,
                p_since: queryParams.since,
            });
            setIsLoading(false);
            if (error) return;
            setRows((data ?? []) as Array<{
                user_id: string;
                display_name: string;
                best_wpm: number;
                best_accuracy: number;
                total_tests: number;
            }>);
        };
        void load();
    }, [supabaseReady, queryParams]);

    const board = useMemo(() => {
        return rows
            .sort((a, b) => b.best_wpm - a.best_wpm)
            .slice(0, 50)
            .map((item, index) => ({
                rank: index + 1,
                user: item.display_name,
                wpm: item.best_wpm,
                acc: item.best_accuracy,
                tests: item.total_tests,
                isCurrentUser: user ? item.user_id === user.id : false,
            }));
    }, [rows, user]);

    return (
        <div className="w-full max-w-4xl flex flex-col pt-8">

            <div className="flex flex-col text-center mb-10 items-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,166,35,0.15)]">
                    <Trophy size={32} className="text-accent" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">Hall of Fame</h1>
                <p className="text-text-dim text-lg">Top speed typists from across the globe.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 border border-white/5 p-2 rounded-2xl bg-[#1A1A1A] w-fit mx-auto">
                {["All Time", "This Week", "Today", "Words 50", "Time 60s"].map(opt => (
                    <Button
                        key={opt}
                        onClick={() => setFilterMode(opt)}
                        variant={filterMode === opt ? "active" : "ghost"}
                    >
                        {opt}
                    </Button>
                ))}
            </div>

            <div className="bg-[#1A1A1A] rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/5 bg-[#0F0F0F]">
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">Rank</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">User</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">WPM</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim text-right">Accuracy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {board.map((item, i) => (
                            <tr
                                key={i}
                                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${item.isCurrentUser ? "bg-accent/10 border-accent/20 hover:bg-accent/10 relative" : ""
                                    }`}
                            >
                                {/* Visual indicator for current user row */}
                                {item.isCurrentUser && <td className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}

                                <td className="px-6 py-4 font-mono">
                                    {item.rank === 1 && <Crown size={18} className="text-[#FFD700]" />}
                                    {item.rank === 2 && <Medal size={18} className="text-[#C0C0C0]" />}
                                    {item.rank === 3 && <Medal size={18} className="text-[#CD7F32]" />}
                                    {item.rank > 3 && <span className={`${item.isCurrentUser ? "text-accent font-bold" : "text-text-dim"} w-4.5 inline-block text-center`}>{item.rank}</span>}
                                </td>

                                <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                    {item.user}
                                    {item.isCurrentUser && <span className="text-[10px] uppercase font-bold bg-accent/20 text-accent px-2 py-0.5 rounded-full">You</span>}
                                </td>

                                <td className="px-6 py-4 font-mono text-lg font-bold text-accent">
                                    {item.wpm}
                                </td>

                                <td className="px-6 py-4 font-mono text-right text-text-dim">
                                    {item.acc}%
                                </td>
                            </tr>
                        ))}
                        {!isLoading && board.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-text-dim">
                                    No results yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Crown, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CountUp } from "@/components/ui/count-up";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

const filterOptions = ["All Time", "This Week", "Today", "Words 50", "Time 60s"] as const;
type FilterOption = (typeof filterOptions)[number];

const listItemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.035,
            duration: 0.3,
            ease: "easeOut" as const,
        },
    }),
};

export function LeaderboardView() {
    const { user, supabaseReady } = useAuth();
    const [filterMode, setFilterMode] = useState<FilterOption>("All Time");
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

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={18} className="text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
        if (rank === 2) return <Medal size={18} className="text-silver" />;
        if (rank === 3) return <Medal size={18} className="text-bronze" />;
        return null;
    };

    return (
        <div className="w-full max-w-4xl flex flex-col pt-8">

            {/* Header */}
            <div className="flex flex-col text-center mb-10 items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 glass glow-accent"
                >
                    <Trophy size={30} className="text-accent" />
                </motion.div>
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 tracking-tight"
                >
                    Hall of Fame
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-text-dim text-base"
                >
                    Top speed typists from across the globe.
                </motion.p>
            </div>

            {/* Filter using SegmentedControl */}
            <div className="flex justify-center mb-10">
                <SegmentedControl
                    options={[...filterOptions]}
                    value={filterMode}
                    onChange={(val) => setFilterMode(val as FilterOption)}
                    size="sm"
                />
            </div>

            {/* Table */}
            <div className="glass rounded-3xl shadow-2xl overflow-hidden relative">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">Rank</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">User</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim">WPM</th>
                            <th className="px-6 py-5 text-xs uppercase font-bold tracking-widest text-text-dim text-right">Accuracy</th>
                        </tr>
                    </thead>
                    <motion.tbody
                        initial="hidden"
                        animate="visible"
                    >
                        {board.map((item, i) => (
                            <motion.tr
                                key={i}
                                custom={i}
                                variants={listItemVariants}
                                className={`border-b border-white/4 hover:bg-white/3 transition-colors ${item.isCurrentUser ? "bg-accent/6 border-accent/20 hover:bg-accent/8 relative" : ""
                                    }`}
                            >
                                {item.isCurrentUser && <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full" />}

                                <td className="px-6 py-4 font-mono">
                                    {getRankIcon(item.rank) || (
                                        <span className={`${item.isCurrentUser ? "text-accent font-bold" : "text-text-dim"} w-4.5 inline-block text-center`}>{item.rank}</span>
                                    )}
                                </td>

                                <td className="px-6 py-4 font-semibold text-foreground flex items-center gap-2">
                                    {item.user}
                                    {item.isCurrentUser && (
                                        <span className="text-[10px] uppercase font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">You</span>
                                    )}
                                    {item.rank <= 3 && (
                                        <Flame size={12} className="text-accent-secondary opacity-50" />
                                    )}
                                </td>

                                <td className="px-6 py-4 font-mono text-lg font-bold text-accent">
                                    <CountUp end={item.wpm} duration={800} delay={i * 30} />
                                </td>

                                <td className="px-6 py-4 font-mono text-right text-text-dim">
                                    {item.acc}%
                                </td>
                            </motion.tr>
                        ))}
                        {!isLoading && board.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-text-dim">
                                    <div className="flex flex-col items-center gap-2">
                                        <Trophy size={24} className="opacity-20" />
                                        <span>No results yet.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </motion.tbody>
                </table>
            </div>

        </div>
    );
}

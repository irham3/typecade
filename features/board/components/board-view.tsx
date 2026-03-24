import { useEffect, useMemo, useState } from "react";
import { Trophy, Crown, Flame } from "@/components/icons";
import { motion } from "framer-motion";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CountUp } from "@/components/ui/count-up";
import { UserAvatar } from "@/components/ui/user-avatar";
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

export function BoardView() {
    const { user, supabaseReady } = useAuth();
    const [filterMode, setFilterMode] = useState<FilterOption>("All Time");
    const [rows, setRows] = useState<Array<{
        user_id: string;
        display_name: string;
        avatar_url?: string;
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
                avatar_url?: string;
                best_wpm: number;
                best_accuracy: number;
                total_tests: number;
            }>);
        };
        void load();
    }, [supabaseReady, queryParams]);

    const board = useMemo(() => {
        return [...rows]
            .sort((a, b) => b.best_wpm - a.best_wpm)
            .slice(0, 50)
            .map((item, index) => ({
                rank: index + 1,
                user: item.display_name,
                avatar_url: item.avatar_url,
                wpm: item.best_wpm,
                acc: item.best_accuracy,
                tests: item.total_tests,
                isCurrentUser: user ? item.user_id === user.id : false,
            }));
    }, [rows, user]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={18} className="text-gold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
        if (rank === 2) return <Trophy size={16} className="text-silver drop-shadow-[0_0_8px_rgba(148,163,184,0.3)]" />;
        if (rank === 3) return <Trophy size={16} className="text-bronze drop-shadow-[0_0_8px_rgba(205,127,50,0.3)]" />;
        return null;
    };

    return (
        <div className="w-full max-w-4xl flex flex-col pt-6 sm:pt-10">
            {/* Title */}
            <div className="flex justify-center mb-8 sm:mb-12">
                <h1 className="text-4xl sm:text-6xl font-pixel uppercase tracking-[0.2em] filter drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]">
                    <span className="text-accent">High</span> <span className="text-accent-secondary">Scores</span>
                </h1>
            </div>

            {/* Sub-header options */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-5 sm:mb-6 gap-3 px-1">
                <p className="text-text-dim text-sm hidden sm:block">Top speed typists from across the globe.</p>
                <div className="flex justify-start sm:justify-end overflow-x-auto hide-scrollbar">
                    <SegmentedControl
                        options={[...filterOptions]}
                        value={filterMode}
                        onChange={(val) => setFilterMode(val as FilterOption)}
                        size="sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col">
                {/* Header table (NOT SCROLLABLE) */}
                <div className="pr-1 sm:pr-2 bg-panel-bg/95 backdrop-blur-xl border-b border-foreground/10 shadow-sm z-20">
                    <table className="w-full text-left font-sans text-xs sm:text-sm">
                        <colgroup>
                            <col className="w-[15%] sm:w-[15%]" />
                            <col className="w-[50%] sm:w-[55%]" />
                            <col className="w-[15%] sm:w-[15%]" />
                            <col className="w-[20%] sm:w-[15%]" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className="px-3 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-xs uppercase font-bold tracking-widest text-text-dim">Rank</th>
                                <th className="px-3 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-xs uppercase font-bold tracking-widest text-text-dim">User</th>
                                <th className="px-3 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-xs uppercase font-bold tracking-widest text-text-dim">WPM</th>
                                <th className="px-3 sm:px-6 py-4 sm:py-5 text-[10px] sm:text-xs uppercase font-bold tracking-widest text-text-dim text-right">Accuracy</th>
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Body table (SCROLLABLE) */}
                <div className="max-h-125 sm:max-h-187.5 overflow-y-auto pr-1 sm:pr-2 
                    [&::-webkit-scrollbar]:w-2 
                    [&::-webkit-scrollbar-track]:bg-transparent 
                    [&::-webkit-scrollbar-thumb]:bg-foreground/10 
                    [&::-webkit-scrollbar-thumb]:rounded-full 
                    hover:[&::-webkit-scrollbar-thumb]:bg-foreground/20">
                    <table className="w-full text-left font-sans text-xs sm:text-sm">
                        <colgroup>
                            <col className="w-[15%] sm:w-[15%]" />
                            <col className="w-[50%] sm:w-[55%]" />
                            <col className="w-[15%] sm:w-[15%]" />
                            <col className="w-[20%] sm:w-[15%]" />
                        </colgroup>
                        <motion.tbody
                            initial="hidden"
                            animate="visible"
                        >
                            {board.map((item, i) => (
                                <motion.tr
                                    key={item.user + i}
                                    custom={i}
                                    initial="hidden"
                                    animate="visible"
                                    variants={listItemVariants}
                                    className={`border-b border-foreground/5 hover:bg-foreground/5 transition-colors ${item.isCurrentUser ? "bg-accent/10 border-accent/20 hover:bg-accent/15 relative" : ""
                                        }`}
                                >
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono relative">
                                        {item.isCurrentUser && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent rounded-r-full" />}
                                        {getRankIcon(item.rank) || (
                                            <span className={`${item.isCurrentUser ? "text-accent font-bold" : "text-text-dim"} w-4.5 inline-block text-center`}>{item.rank}</span>
                                        )}
                                    </td>

                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-foreground/10 bg-panel-bg flex items-center justify-center">
                                            <UserAvatar
                                                src={item.avatar_url}
                                                alt={item.user}
                                                iconSize={14}
                                                showTooltipPreview={true}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                                            <span className="truncate max-w-22.5 sm:max-w-50">{item.user}</span>
                                            {item.isCurrentUser && (
                                                <span className="text-[10px] uppercase font-bold bg-accent/15 text-accent px-2 py-0.5 rounded-full border border-accent/20">You</span>
                                            )}
                                            {item.rank <= 3 && (
                                                <Flame size={12} className="text-accent-secondary opacity-50" />
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-base sm:text-lg font-bold text-accent">
                                        <CountUp end={item.wpm} duration={800} delay={i * 30} />
                                    </td>

                                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-right text-text-dim">
                                        {item.acc}%
                                    </td>
                                </motion.tr>
                            ))}
                            {!isLoading && board.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-text-dim">
                                        <div className="flex flex-col items-center gap-2">
                                            <Trophy size={24} className="opacity-20" />
                                            <span>{!supabaseReady ? "Database connecting... (If this persists, please restart your 'npm run dev' to load .env variables)" : "No results yet."}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </div>

            {/* Your Rank Footer Box */}
            {user && (
                <div className="mt-8 rounded-xl border-2 border-accent/40 bg-accent/5 p-4 sm:p-5 flex flex-col shadow-[0_0_25px_rgba(var(--accent-rgb),0.2),inset_0_0_15px_rgba(var(--accent-rgb),0.1)]">
                    <div className="text-center mb-3">
                        <span className="text-accent-secondary font-display font-bold tracking-widest text-sm uppercase text-glow-accent">Your Rank</span>
                    </div>
                    {(() => {
                        const userRow = board.find(item => item.isCurrentUser) || {
                            rank: "N/A", user: user.user_metadata?.display_name || user.email?.split("@")[0] || "Player", wpm: 0, acc: 0
                        };
                        return (
                            <div className="flex flex-col sm:flex-row items-center justify-between font-mono text-sm sm:text-base text-foreground gap-2 px-2">
                                <span className="w-full sm:w-auto text-left">Rank: <span className="text-accent-secondary">{userRow.rank}</span></span>
                                <span className="w-full sm:w-auto text-center truncate px-2 opacity-80">Typist: [{userRow.user}]</span>
                                <span className="w-full sm:w-auto text-center font-bold text-accent text-glow-bright">WPM: {userRow.wpm}</span>
                                <span className="w-full sm:w-auto text-center">Accuracy: {userRow.acc}%</span>
                                <span className="w-full sm:w-auto text-right text-text-dim text-xs">Date: Today</span>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}

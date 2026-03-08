import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { User, Activity, FileText, Zap, ChevronDown, TrendingUp, Target, Clock, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function ProfileView() {
    const { user, supabaseReady } = useAuth();
    const storeStats = useStore(state => state.stats);
    const [stats, setStats] = useState(storeStats);
    const [displayName, setDisplayName] = useState("Typecade User");
    const [memberSince, setMemberSince] = useState("Member since");
    const [timeframe, setTimeframe] = useState("Last 30 days");
    const [timeframeOpen, setTimeframeOpen] = useState(false);

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = Math.floor(mins % 60);
        return `${h}h ${m}m`;
    };

    const formatMemberSince = useMemo(() => {
        const date = user?.created_at ? new Date(user.created_at) : null;
        if (!date) return "Member since";
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
            const [{ data: profile }, { data: statsRow }, { data: history }] = await Promise.all([
                client.from("profiles").select("display_name, username, created_at").eq("user_id", user.id).maybeSingle(),
                client.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
                client
                    .from("typing_tests")
                    .select("created_at, mode, mode_value, wpm, accuracy, duration_seconds")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(30),
            ]);

            const profileRow = (profile ?? null) as { display_name?: string; username?: string; created_at?: string } | null;
            if (profileRow?.display_name) {
                setDisplayName(profileRow.display_name);
            } else if (profileRow?.username) {
                setDisplayName(profileRow.username);
            } else if (user.email) {
                setDisplayName(user.email.split("@")[0]);
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
        };
        void load();
    }, [supabaseReady, user]);

    const statCards = [
        { label: "Personal Best", value: stats.wpm, suffix: " WPM", icon: TrendingUp, color: "text-accent", delay: 0 },
        { label: "Top Accuracy", value: stats.accuracy, suffix: "%", icon: Target, color: "text-accent-secondary", delay: 100 },
        { label: "Total Tests", value: stats.tests, suffix: "", icon: Hash, color: "text-foreground", delay: 200 },
        { label: "Time Typed", value: null, display: formatHours(stats.timeTyped), icon: Clock, color: "text-foreground", delay: 300 },
    ];

    return (
        <div className="w-full max-w-5xl pt-4 sm:pt-4 lg:pt-8 font-sans px-0">

            {/* Header Profile */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-8 shadow-2xl relative overflow-hidden"
            >
                {/* Decorative accent glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/6 rounded-full blur-[100px] pointer-events-none" />

                {/* Avatar */}
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-[2px] shrink-0 relative group">
                    <div className="absolute inset-0 rounded-full bg-linear-to-tr from-accent/40 to-accent-secondary/30 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-full h-full rounded-full bg-panel-bg border border-white/8 flex items-center justify-center overflow-hidden cursor-pointer">
                        <User size={28} className="text-text-dim group-hover:text-foreground transition-colors sm:hidden" />
                        <User size={40} className="text-text-dim group-hover:text-foreground transition-colors hidden sm:block" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs font-bold tracking-widest uppercase">Edit</span>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-1 flex flex-col w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full gap-4">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">{displayName}</h1>
                            <span className="text-xs font-medium text-text-dim bg-white/4 px-3 py-1 rounded-full border border-white/6">
                                {memberSince}
                            </span>
                        </div>
                        <Button variant="outline" className="px-5 py-2.5 rounded-xl text-sm font-medium">
                            Edit Profile
                        </Button>
                    </div>

                    {/* Quick stats grid with CountUp */}
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center md:text-left">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                                className="flex flex-col gap-1"
                            >
                                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                                    <stat.icon size={12} className="text-text-dim" />
                                    <span className="text-text-dim text-xs uppercase font-bold tracking-wider">{stat.label}</span>
                                </div>
                                <span className={`text-xl sm:text-2xl font-mono font-bold ${stat.color}`}>
                                    {stat.value !== null ? (
                                        <CountUp end={stat.value} duration={1200} delay={stat.delay} decimals={stat.label === "Top Accuracy" ? 1 : 0} suffix={stat.suffix} />
                                    ) : (
                                        stat.display
                                    )}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">

                {/* Left Col: Performance + History */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Performance Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base font-display font-medium text-foreground flex items-center gap-2">
                                <Activity size={16} className="text-accent" /> Recent Performance
                            </h3>
                            <DropdownMenu open={timeframeOpen} onOpenChange={setTimeframeOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-auto bg-white/3 border border-white/6 text-xs text-text-dim px-3 py-1.5 rounded-lg outline-none gap-2">
                                        {timeframe} <ChevronDown size={12} className="opacity-40" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTimeframe("Last 30 days")}>Last 30 days</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTimeframe("Last 7 days")}>Last 7 days</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Bar Chart */}
                        <div className="w-full h-36 sm:h-48 flex items-end gap-1 sm:gap-2 justify-between mt-4 sm:mt-6 group">
                            {stats.history.slice(0, 15).reverse().map((test, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scaleY: 0 }}
                                    animate={{ scaleY: 1 }}
                                    transition={{ delay: 0.5 + i * 0.03, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="relative flex-1 flex flex-col items-center justify-end h-full group/bar origin-bottom"
                                >
                                    <div
                                        className="w-full rounded-t-md transition-all duration-200 group-hover:opacity-30 hover:opacity-100!"
                                        style={{
                                            height: `${Math.max(10, (test.wpm / 140) * 100)}%`,
                                            background: `linear-gradient(to top, rgba(var(--accent-rgb), 0.4), rgba(var(--accent-rgb), 0.15))`,
                                        }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 glass px-3 py-1.5 rounded-lg text-xs font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-xl text-center">
                                        <span className="text-accent font-bold block">{test.wpm} WPM</span>
                                        <span className="text-text-dim text-[10px]">{test.date}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* History Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass rounded-2xl sm:rounded-3xl overflow-hidden"
                    >
                        <div className="p-4 sm:p-6 border-b border-white/5">
                            <h3 className="text-base font-display font-medium text-foreground flex items-center gap-2">
                                <FileText size={16} className="text-text-dim" /> Test History
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-sm">
                                <thead>
                                    <tr className="border-b border-white/4">
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Date</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Mode</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">WPM</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Acc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.history.slice(0, 5).map((test, i) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 + i * 0.05 }}
                                            className="border-b border-white/4 hover:bg-white/3 transition-colors"
                                        >
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-text-dim font-mono text-[10px] sm:text-xs">{test.date}</td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-foreground text-xs sm:text-sm">{test.mode}</td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono font-bold text-accent text-xs sm:text-sm">{test.wpm}</td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm">{test.accuracy}%</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 text-center flex justify-center border-t border-white/4">
                            <Button variant="ghost" className="text-xs font-bold text-text-dim hover:text-white uppercase tracking-widest px-4">See complete history</Button>
                        </div>
                    </motion.div>

                </div>

                {/* Right Col: Deep Insights */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 h-fit"
                >
                    <h3 className="text-base font-display font-medium text-foreground mb-6 flex items-center gap-2">
                        <Zap size={16} className="text-accent" /> Deep Insights
                    </h3>

                    <div className="space-y-5">
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Average WPM (All time)</span>
                            <span className="text-xl font-mono text-foreground font-medium">
                                <CountUp end={stats.avgWpm} duration={1000} delay={500} />
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Average Accuracy</span>
                            <span className="text-xl font-mono text-foreground font-medium">
                                <CountUp end={stats.avgAccuracy} duration={1000} delay={600} decimals={1} suffix="%" />
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Favorite Mode</span>
                            <span className="text-base text-foreground font-medium flex items-center gap-2 mt-1">
                                <span className="px-2.5 py-1 bg-white/4 rounded-lg text-xs border border-white/6 font-mono">Time 60s</span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs">Language</span>
                            <span className="text-base text-foreground font-medium flex items-center gap-2 mt-1">
                                English
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}


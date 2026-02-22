import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { User, Activity, FileText, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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

            const stats = (statsRow ?? null) as {
                best_wpm?: number;
                best_accuracy?: number;
                total_tests?: number;
                total_time_typed_seconds?: number;
                avg_wpm?: number;
                avg_accuracy?: number;
            } | null;

            if (stats) {
                setStats({
                    wpm: stats.best_wpm ?? 0,
                    accuracy: stats.best_accuracy ?? 0,
                    tests: stats.total_tests ?? 0,
                    timeTyped: Math.floor((stats.total_time_typed_seconds ?? 0) / 60),
                    avgWpm: stats.avg_wpm ?? 0,
                    avgAccuracy: stats.avg_accuracy ?? 0,
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

    return (
        <div className="w-full max-w-5xl pt-4 lg:pt-8 font-sans">

            {/* Header Profile */}
            <div className="w-full bg-linear-to-br from-[#1A1A1A] to-[#0F0F0F] border border-white/5 rounded-4xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl relative overflow-hidden">

                {/* Avatar */}
                <div className="w-32 h-32 rounded-full bg-linear-to-tr from-accent/20 to-accent/5 p-0.5 shadow-[0_0_30px_rgba(245,166,35,0.15)] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#141414] border border-white/10 flex items-center justify-center relative overflow-hidden group hover:cursor-pointer">
                        <User size={48} className="text-text-dim group-hover:text-foreground transition-colors" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-xs font-bold tracking-widest uppercase">Edit</span>
                        </div>
                    </div>
                </div>

                {/* User Info & Quick Stats */}
                <div className="flex-1 flex flex-col w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full gap-4">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">{displayName}</h1>
                            <span className="text-sm font-medium text-text-dim bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                {memberSince}
                            </span>
                        </div>
                        <Button variant="outline" className="px-5 py-5 sm:py-2.5 rounded-xl text-sm font-medium">
                            Edit Profile
                        </Button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center md:text-left">
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs uppercase font-bold tracking-wider">Personal Best</span>
                            <span className="text-2xl font-mono font-bold text-accent">{stats.wpm} <span className="text-sm">WPM</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs uppercase font-bold tracking-wider">Top Accuracy</span>
                            <span className="text-2xl font-mono font-bold text-foreground">{stats.accuracy}%</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs uppercase font-bold tracking-wider">Total Tests</span>
                            <span className="text-2xl font-mono font-bold text-foreground">{stats.tests}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs uppercase font-bold tracking-wider">Time Typed</span>
                            <span className="text-xl font-mono font-bold text-foreground mt-1">{formatHours(stats.timeTyped)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

                {/* Left Col: Additional Stats & Graph Placeholder */}
                <div className="lg:col-span-2 space-y-8">

                    <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-2">
                                <Activity size={18} className="text-accent" /> Recent Performance
                            </h3>
                            <DropdownMenu open={timeframeOpen} onOpenChange={setTimeframeOpen}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-auto bg-[#0F0F0F] border border-white/5 text-xs text-text-dim px-3 py-1.5 rounded-lg outline-none gap-2">
                                        {timeframe} <ChevronDown size={12} className="opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setTimeframe("Last 30 days")}>Last 30 days</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTimeframe("Last 7 days")}>Last 7 days</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* CSS-based Mock Chart */}
                        <div className="w-full h-48 flex items-end gap-1 sm:gap-2 justify-between mt-6 group">
                            {stats.history.slice(0, 15).reverse().map((test, i) => (
                                <div key={i} className="relative flex-1 flex flex-col items-center justify-end h-full group/bar">
                                    <div
                                        className="w-full bg-[#333] group-hover:opacity-40 hover:opacity-100! hover:bg-accent hover:shadow-[0_0_15px_rgba(245,166,35,0.4)] transition-all rounded-t-sm"
                                        style={{ height: `${Math.max(10, (test.wpm / 140) * 100)}%` }}
                                    />
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 bg-[#0F0F0F] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-xl text-center">
                                        <span className="text-accent font-bold block">{test.wpm} WPM</span>
                                        <span className="text-text-dim text-[10px]">{test.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-display font-medium text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-text-dim" /> Test History
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-sm">
                                <thead>
                                    <tr className="border-b border-white/5 bg-[#0F0F0F]/50">
                                        <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-text-dim">Date</th>
                                        <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-text-dim">Mode</th>
                                        <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-text-dim">WPM</th>
                                        <th className="px-6 py-4 text-xs uppercase font-bold tracking-wider text-text-dim">Acc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.history.slice(0, 5).map((test, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-text-dim font-mono text-xs">{test.date}</td>
                                            <td className="px-6 py-4 text-foreground">{test.mode}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-accent">{test.wpm}</td>
                                            <td className="px-6 py-4 font-mono">{test.accuracy}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-[#0F0F0F]/30 text-center flex justify-center">
                            <Button variant="ghost" className="text-xs font-bold text-text-dim hover:text-white uppercase tracking-widest px-4">See complete history</Button>
                        </div>
                    </div>

                </div>

                {/* Right Col: Details */}
                <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 h-fit">
                    <h3 className="text-lg font-display font-medium text-foreground mb-6 flex items-center gap-2">
                        <Zap size={18} className="text-accent" /> Deep Insights
                    </h3>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Average WPM (All time)</span>
                            <span className="text-xl font-mono text-foreground font-medium">{stats.avgWpm}</span>
                        </div>
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Average Accuracy</span>
                            <span className="text-xl font-mono text-foreground font-medium">{stats.avgAccuracy}%</span>
                        </div>
                        <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                            <span className="text-text-dim text-xs">Favorite Mode</span>
                            <span className="text-base text-foreground font-medium flex items-center gap-2 mt-1">
                                <span className="px-2 py-1 bg-white/5 rounded text-xs border border-white/10 font-mono">Time 60s</span>
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-text-dim text-xs">Language</span>
                            <span className="text-base text-foreground font-medium flex items-center gap-2 mt-1">
                                English
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState } from "react";
import { Trophy, Medal, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LeaderboardView() {
    const [filterMode, setFilterMode] = useState("All Time");

    const DUMMY_BOARD = [
        { rank: 1, user: "CodeWizard", wpm: 156, acc: 99.1, tests: 2341 },
        { rank: 2, user: "UltraTyper", wpm: 148, acc: 98.7, tests: 1892 },
        { rank: 3, user: "SpeedDemon", wpm: 142, acc: 97.3, tests: 4201 },
        { rank: 4, user: "NeoTypist", wpm: 139, acc: 96.0, tests: 1120 },
        { rank: 5, user: "MechBoard", wpm: 135, acc: 98.2, tests: 3405 },
        { rank: 6, user: "qwerty_king", wpm: 128, acc: 95.5, tests: 852 },
        { rank: 7, user: "Lexicon", wpm: 124, acc: 99.8, tests: 923 },
        { rank: 8, user: "DvorakMaster", wpm: 120, acc: 97.2, tests: 110 },
        { rank: 42, user: "TypingNinja", wpm: 94, acc: 98.2, tests: 847, isCurrentUser: true }, // Current User at lower rank
    ];

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

            <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 shadow-2xl overflow-hidden relative">
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
                        {DUMMY_BOARD.map((item, i) => (
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
                                    {item.rank > 3 && <span className={`${item.isCurrentUser ? "text-accent font-bold" : "text-text-dim"} w-[18px] inline-block text-center`}>{item.rank}</span>}
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
                    </tbody>
                </table>
            </div>

        </div>
    );
}

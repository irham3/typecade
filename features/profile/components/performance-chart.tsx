import { useState } from "react";
import { Activity, ChevronDown } from "@/components/icons";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { UserStats } from '@/lib/store';

interface PerformanceChartProps {
    filteredHistory: UserStats['history'];
    timeframe: string;
    setTimeframe: (timeframe: string) => void;
    statsWpm: number;
}

export function PerformanceChart({ filteredHistory, timeframe, setTimeframe, statsWpm }: PerformanceChartProps) {
    const [timeframeOpen, setTimeframeOpen] = useState(false);

    return (
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
                        <Button variant="ghost" className="h-auto bg-foreground/5 border border-foreground/10 text-xs text-text-dim px-3 py-1.5 rounded-lg outline-none gap-2">
                            {timeframe} <ChevronDown size={12} className="opacity-40" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTimeframe("All time")}>All time</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe("Last 30 days")}>Last 30 days</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe("Last 7 days")}>Last 7 days</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Bar Chart */}
            <div className="w-full h-36 sm:h-48 flex items-end gap-1 sm:gap-2 justify-between mt-4 sm:mt-6 group">
                {filteredHistory.slice(0, 25).reverse().map((test, i) => (
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
                                height: `${Math.max(10, Math.min(100, (test.wpm / Math.max(60, statsWpm)) * 100))}%`,
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
    );
}

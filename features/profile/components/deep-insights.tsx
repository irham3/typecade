import { Zap } from "@/components/icons";
import { motion } from "framer-motion";
import { CountUp } from "@/components/ui/count-up";
import type { UserStats } from '@/lib/store';

interface DeepInsightsProps {
    stats: UserStats;
}

export function DeepInsights({ stats }: DeepInsightsProps) {
    return (
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
                <div className="flex flex-col gap-1 pb-4 border-b border-foreground/5">
                    <span className="text-text-dim text-xs">Average WPM (All time)</span>
                    <span className="text-xl font-mono text-foreground font-medium">
                        <CountUp end={stats.avgWpm} duration={1000} delay={500} />
                    </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 border-b border-foreground/5">
                    <span className="text-text-dim text-xs">Average Accuracy</span>
                    <span className="text-xl font-mono text-foreground font-medium">
                        <CountUp end={stats.avgAccuracy} duration={1000} delay={600} decimals={1} suffix="%" />
                    </span>
                </div>
                <div className="flex flex-col gap-1 pb-4 border-b border-white/5">
                    <span className="text-text-dim text-xs">Favorite Mode</span>
                    <span className="text-base text-foreground font-medium flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-1 bg-foreground/5 rounded-lg text-xs border border-foreground/10 font-mono">Time 60s</span>
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
    );
}

import { FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { UserStats } from '@/lib/store';

interface TestHistoryTableProps {
    filteredHistory: UserStats['history'];
}

export function TestHistoryTable({ filteredHistory }: TestHistoryTableProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl sm:rounded-3xl overflow-hidden"
        >
            <div className="p-4 sm:p-6 border-b border-foreground/5">
                <h3 className="text-base font-display font-medium text-foreground flex items-center gap-2">
                    <FileText size={16} className="text-text-dim" /> Test History
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left font-sans text-sm">
                    <thead>
                        <tr className="border-b border-foreground/5">
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Date</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Mode</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">WPM</th>
                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs uppercase font-bold tracking-wider text-text-dim">Acc</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHistory.slice(0, 5).map((test, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                                className="border-b border-foreground/5 hover:bg-foreground/5 transition-colors"
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
            <div className="p-4 text-center flex justify-center border-t border-foreground/5">
                <Button variant="ghost" className="text-xs font-bold text-text-dim hover:text-white uppercase tracking-widest px-4">See complete history</Button>
            </div>
        </motion.div>
    );
}

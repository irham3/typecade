import { Trophy, Home, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Player {
    id: string;
    name: string;
    wpm: number;
    progress: number;
    color: string;
    status: "playing" | "finished" | "waiting";
    place?: number;
    correctChars: number;
}

interface RaceResultsModalProps {
    isOpen: boolean;
    players: Player[];
    onClose: () => void;
    onLeave: () => void;
}

export function RaceResultsModal({ isOpen, players, onClose, onLeave }: RaceResultsModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-md border border-white/10"
                >
                    <div className="bg-[#141414] p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full relative">
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-text-dim hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <Trophy size={48} className="text-accent mb-6" />
                        <h2 className="text-2xl font-display font-medium mb-8">RACE RESULTS</h2>

                        <div className="w-full space-y-4 font-sans mb-10">
                            {[...players].sort((a, b) => (b.wpm - a.wpm)).map((p, i) => (
                                <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border ${p.id === "p1" ? "border-accent/30 bg-accent/5 text-foreground" : "border-white/5 text-text-dim"}`}>
                                    <div className="flex gap-4 items-center">
                                        <span className="font-bold font-mono text-sm opacity-50">{i + 1}</span>
                                        <span className="font-medium text-sm">{p.name}</span>
                                    </div>
                                    <span className="font-mono text-sm font-bold">{p.wpm} WPM</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 w-full">
                            <button className="flex-1 py-3 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
                                <RotateCcw size={16} /> Play Again
                            </button>
                            <button onClick={onLeave} className="flex-1 py-3 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 rounded-xl text-sm font-medium transition-colors hover:bg-white/5">
                                <Home size={16} /> Leave
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

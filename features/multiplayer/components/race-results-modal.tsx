import { Trophy, Home, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
    currentUserId?: string;
    showRestart: boolean;
    onClose: () => void;
    onLeave: () => void;
    onRestart: () => void;
}

export function RaceResultsModal({ isOpen, players, currentUserId, showRestart, onClose, onLeave, onRestart }: RaceResultsModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-md border border-white/10"
                >
                    <div className="bg-[#141414] p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="absolute top-6 right-6 rounded-full"
                        >
                            <X size={20} />
                        </Button>
                        <Trophy size={48} className="text-accent mb-6" />
                        <h2 className="text-2xl font-display font-medium mb-8">RACE RESULTS</h2>

                        <div className="w-full space-y-4 font-sans mb-10">
                            {[...players].sort((a, b) => (b.wpm - a.wpm)).map((p, i) => (
                                <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border ${p.id === currentUserId || p.id === "p1" ? "border-accent/30 bg-accent/5 text-foreground" : "border-white/5 text-text-dim"}`}>
                                    <div className="flex gap-4 items-center">
                                        <span className="font-bold font-mono text-sm opacity-50">{i + 1}</span>
                                        <span className="font-medium text-sm">{p.name}</span>
                                    </div>
                                    <span className="font-mono text-sm font-bold">{p.wpm} WPM</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4 w-full">
                            {showRestart ? (
                                <>
                                    <Button onClick={onRestart} className="flex-1 py-6 gap-2 text-sm font-medium">
                                        <RotateCcw size={16} /> Play Again
                                    </Button>
                                    <Button variant="outline" onClick={onLeave} className="flex-1 py-6 gap-2 text-sm font-medium">
                                        <Home size={16} /> Leave
                                    </Button>
                                </>
                            ) : (
                                <Button variant="outline" onClick={onLeave} className="w-full py-6 gap-2 text-sm font-medium">
                                    <Home size={16} /> Leave
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

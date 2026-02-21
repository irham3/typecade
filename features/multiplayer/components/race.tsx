import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Home, RotateCcw } from "lucide-react";

interface Player {
    id: string;
    name: string;
    wpm: number;
    progress: number;
    color: string;
    status: "playing" | "finished" | "waiting";
    place?: number;
}

export function MultiplayerRace({ onLeave }: { onLeave: () => void }) {
    const [countdown, setCountdown] = useState<number | null>(3);
    const [timeLeft, setTimeLeft] = useState(60);
    const [raceState, setRaceState] = useState<"countdown" | "racing" | "finished">("countdown");

    const [players, setPlayers] = useState<Player[]>([
        { id: "p1", name: "TypingNinja (You)", wpm: 0, progress: 0, color: "#F5A623", status: "waiting" },
        { id: "p2", name: "FastFingers99", wpm: 0, progress: 0, color: "#4EA8DE", status: "waiting" },
        { id: "p3", name: "CodeMonkey", wpm: 0, progress: 0, color: "#72DDF7", status: "waiting" },
        { id: "p4", name: "Keyboard_Slayer", wpm: 0, progress: 0, color: "#FF6B6B", status: "waiting" },
    ]);

    // Dummy typing engine
    const [typedChars, setTypedChars] = useState("");
    const targetText = "the quick brown fox jumps over the lazy dog and types faster to think clearer in this multiplayer race".replace(/ /g, "\u00A0");

    useEffect(() => {
        if (raceState === "countdown" && countdown !== null) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else if (countdown === 0) {
                const timer = setTimeout(() => {
                    setRaceState("racing");
                    setPlayers(p => p.map(player => ({ ...player, status: "playing" })));
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [countdown, raceState]);

    useEffect(() => {
        if (raceState === "racing") {
            const timer = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setRaceState("finished");
                        clearInterval(timer);
                        return 0;
                    }
                    return t - 1;
                });

                // Simulate bots typing
                setPlayers(p => p.map(player => {
                    if (player.id === "p1" || player.status === "finished") return player;
                    const advance = Math.random() > 0.3 ? Math.random() * 2 + 0.5 : 0;
                    const newProgress = Math.min(100, player.progress + advance);
                    const newWpm = Math.floor(60 + (Math.random() * 40));

                    if (newProgress >= 100) {
                        return { ...player, progress: 100, status: "finished", wpm: newWpm, place: Math.floor(Math.random() * 3) + 1 };
                    }

                    return { ...player, progress: newProgress, wpm: newWpm };
                }));
            }, 500);
            return () => clearInterval(timer);
        }
    }, [raceState]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (raceState !== "racing") return;
        const val = e.target.value;
        setTypedChars(val);

        // Update player 1 progress
        const progress = Math.min(100, (val.length / targetText.length) * 100);
        // Dummy WPM calc
        const wpm = progress > 0 ? Math.floor(70 + (progress * 0.5)) : 0;

        setPlayers(p => p.map(player => {
            if (player.id === "p1") {
                if (progress >= 100) {
                    setRaceState("finished");
                    return { ...player, progress: 100, wpm, status: "finished", place: 1 };
                }
                return { ...player, progress, wpm };
            }
            return player;
        }));
    };

    return (
        <div className="w-full max-w-4xl flex flex-col font-sans relative">

            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 px-6 py-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-white/10 rounded-md font-mono text-xs text-text-dim">R-4821</div>
                    <h2 className="text-xl font-display font-bold text-foreground">SpeedRace x</h2>
                </div>
                <div className="font-mono text-xl text-accent font-bold">
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>
            </div>

            {/* Lanes */}
            <div className="space-y-6 mb-12 flex-1">
                {players.map(player => (
                    <div key={player.id} className="w-full flex flex-col gap-2 group">
                        <div className="flex justify-between items-end text-sm">
                            <span className={`font-medium flex items-center gap-2 ${player.id === "p1" ? "text-foreground" : "text-text-dim"}`}>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: player.color }} />
                                {player.name}
                            </span>
                            <span className="font-mono text-xs text-text-dim opacity-70 group-hover:opacity-100 transition-opacity">
                                {player.status === "finished" ? (
                                    <span className="text-white flex items-center gap-1 font-bold">
                                        ✓ FINISHED
                                    </span>
                                ) : `${player.wpm} WPM`}
                            </span>
                        </div>
                        <div className="w-full h-8 bg-[#1A1A1A] rounded-md overflow-hidden relative border border-white/5">
                            <motion.div
                                className="h-full absolute left-0 top-0 bottom-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                style={{ backgroundColor: player.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${player.progress}%` }}
                                transition={{ ease: "linear", duration: 0.5 }}
                            />
                            <div
                                className="absolute inset-0 z-10 opacity-20 pointer-events-none"
                                style={{
                                    backgroundImage: "linear-gradient(90deg, transparent 96%, rgba(255,255,255,1) 96%)",
                                    backgroundSize: "20px 100%"
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area (Only visible when racing) */}
            <div className={`relative transition-all duration-500 bg-[#0F0F0F] rounded-2xl p-8 border border-white/5 ${raceState === "racing" ? "opacity-100 translate-y-0" : "opacity-50 pointer-events-none"}`}>
                <input
                    autoFocus
                    className="absolute inset-0 opacity-0 z-50 cursor-text"
                    value={typedChars}
                    onChange={handleInput}
                    disabled={raceState !== "racing"}
                />
                <div className="font-mono text-2xl leading-[1.8] text-text-dim/40 max-h-32 overflow-hidden relative">
                    {targetText.split("").map((char, i) => {
                        const typed = typedChars[i];
                        let color = "inherit";
                        if (typed != null) {
                            color = typed === char ? "var(--color-accent)" : "var(--color-error-text)";
                        }
                        return (
                            <span key={i} style={{ color }} className="relative transition-colors">
                                {i === typedChars.length && raceState === "racing" && (
                                    <span className="absolute left-0 bottom-1 w-[2px] h-[80%] bg-accent animate-pulse" />
                                )}
                                {char}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {raceState === "countdown" && countdown !== null && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-[120px] font-display font-bold text-accent drop-shadow-2xl"
                        >
                            {countdown === 0 ? "GO!" : countdown}
                        </motion.div>
                    </motion.div>
                )}

                {raceState === "finished" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md rounded-3xl border border-white/10"
                    >
                        <div className="bg-[#141414] p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full">
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

        </div>
    );
}

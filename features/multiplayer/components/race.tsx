import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Medal } from "lucide-react";
import { useRef } from "react";
import { generateWords } from "@/lib/words";
import { RaceResultsModal } from "./race-results-modal";
import { Button } from "@/components/ui/button";

export interface Player {
    id: string;
    name: string;
    wpm: number;
    progress: number;
    color: string;
    status: "playing" | "finished" | "waiting";
    place?: number;
    correctChars: number;
}

export function MultiplayerRace({ onLeave }: { onLeave: () => void }) {
    const [countdown, setCountdown] = useState<number | null>(3);
    const [timeLeft, setTimeLeft] = useState(60);
    const [raceState, setRaceState] = useState<"countdown" | "racing" | "finished">("countdown");
    const [showResults, setShowResults] = useState(true);

    const [players, setPlayers] = useState<Player[]>([
        { id: "p1", name: "TypingNinja (You)", wpm: 0, progress: 0, correctChars: 0, color: "var(--color-accent)", status: "waiting" },
        { id: "p2", name: "Newbie_Typer", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p3", name: "SlowPoke", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p4", name: "AverageJoe", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p5", name: "FastFingers99", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p6", name: "Keyboard_Slayer", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p7", name: "TypeGod_T800", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    ]);

    // Dummy typing engine
    const [typedChars, setTypedChars] = useState("");
    const [targetText, setTargetText] = useState<string>("");
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const startTimeRef = useRef<number | null>(null);
    const [translateY, setTranslateY] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setTargetText(generateWords("EN", 50, false, false));
            setMounted(true);
        }, 0);
    }, []);

    useEffect(() => {
        if (raceState === "countdown" && countdown !== null) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else if (countdown === 0) {
                const timer = setTimeout(() => {
                    setRaceState("racing");
                    startTimeRef.current = Date.now();
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

                // Simulate bots and update P1 WPM dynamically based on time left
                setPlayers(p => {
                    const elapsedMin = startTimeRef.current ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60) : 0.01;

                    return p.map(player => {
                        if (player.status === "finished") return player;

                        if (player.id === "p1") {
                            const newWpm = Math.max(0, Math.floor((player.correctChars / 5) / elapsedMin));
                            const newProgress = Math.min(100, (player.correctChars / 600) * 100);
                            return { ...player, wpm: newWpm, progress: newProgress };
                        }

                        // Bot logic
                        const botSpeeds: Record<string, number> = {
                            "p2": 15,
                            "p3": 30,
                            "p4": 50,
                            "p5": 70,
                            "p6": 90,
                            "p7": 110
                        };
                        const baseSpeed = botSpeeds[player.id] || 40;
                        const currentWpm = baseSpeed + (Math.random() * 10 - 5);
                        const charsAdded = (currentWpm * 5) / 120; // 500ms segment of chars
                        const newCorrectChars = player.correctChars + charsAdded;
                        const newProgress = Math.min(100, (newCorrectChars / 600) * 100); // 600 chars is the '100% full bar' threshold (120 WPM for 60s)

                        return { ...player, correctChars: newCorrectChars, progress: newProgress, wpm: Math.floor(currentWpm) };
                    });
                });
            }, 500);
            return () => clearInterval(timer);
        }
    }, [raceState, timeLeft]);

    useEffect(() => {
        if (raceState === "countdown") {
            const timer = setTimeout(() => setTranslateY(0), 0);
            return () => clearTimeout(timer);
        }

        if (!activeCharRef.current) return;
        const charTop = activeCharRef.current.offsetTop;

        const parentElem = activeCharRef.current.parentElement?.parentElement;
        if (!parentElem) return;

        const computedLineHeight = window.getComputedStyle(parentElem).lineHeight;
        const lineHeight = parseFloat(computedLineHeight) || activeCharRef.current.offsetHeight;

        if (lineHeight === 0) return;

        const lineIndex = Math.floor((charTop + 2) / lineHeight);
        // Container is 2 lines high. Keep active line at the top so next line is always visible.
        const newTranslate = lineIndex * lineHeight;
        const timer = setTimeout(() => setTranslateY(newTranslate), 0);
        return () => clearTimeout(timer);
    }, [typedChars, raceState]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (raceState !== "racing") return;
        const val = e.target.value;
        setTypedChars(val);

        if (targetText.length - val.length < 150) {
            setTargetText((prev: string) => prev + " " + generateWords("EN", 30, false, false));
        }

        // Update player 1 wpm internally, visually updated more rapidly by setInterval
        const elapsedMin = startTimeRef.current ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60) : 0.01;
        const correctChars = val.split("").filter((char, i) => char === targetText[i]).length;
        const wpm = Math.max(0, Math.floor((correctChars / 5) / elapsedMin));
        const progress = Math.min(100, (correctChars / 600) * 100);

        setPlayers(p => p.map(player => {
            if (player.id === "p1") {
                return { ...player, progress, wpm, correctChars };
            }
            return player;
        }));
    };

    const renderText = () => {
        const words = targetText.split(" ");
        let globalIndex = 0;

        return words.map((word, wIdx) => {
            const wordLen = word.length;
            const wordChars = word.split("");
            const isLastWord = wIdx === words.length - 1;

            const wordNodes = wordChars.map((char, cIdx) => {
                const index = globalIndex + cIdx;
                const typedChar = typedChars[index];

                let charStatusClass = "text-text-dim";
                if (typedChar != null) {
                    if (typedChar === char) {
                        charStatusClass = "text-accent drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]";
                    } else {
                        charStatusClass = "text-error-text bg-error-bg/60 rounded-sm";
                    }
                }

                const isCurrent = index === typedChars.length;

                return (
                    <span
                        key={cIdx}
                        ref={isCurrent ? activeCharRef : null}
                        className={`relative transition-colors duration-100 ${charStatusClass}`}
                    >
                        {isCurrent && raceState === "racing" && (
                            <span className="absolute -left-px top-[10%] w-[3px] h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                        )}
                        {char}
                    </span>
                );
            });

            const spaceIndex = globalIndex + wordLen;
            const spaceTyped = typedChars[spaceIndex];
            const isSpaceCurrent = spaceIndex === typedChars.length;

            let spaceStatusClass = "text-text-dim";
            if (spaceTyped != null) {
                if (spaceTyped === " ") {
                    spaceStatusClass = "text-accent";
                } else {
                    spaceStatusClass = "text-error-text bg-error-bg/60 rounded-sm";
                }
            }

            globalIndex += wordLen + (isLastWord ? 0 : 1);

            return (
                <span key={wIdx} className="inline-block">
                    {wordNodes}
                    {!isLastWord && (
                        <span
                            ref={isSpaceCurrent ? activeCharRef : null}
                            className={`relative transition-colors duration-100 ${spaceStatusClass}`}
                        >
                            {isSpaceCurrent && raceState === "racing" && (
                                <span className="absolute -left-px top-[10%] w-[3px] h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                            )}
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    if (!mounted) return null;

    if (raceState === "countdown") {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background overflow-hidden">
                <div className="absolute top-[30%] text-2xl font-mono text-text-dim tracking-[0.2em] uppercase">
                    Match Starting In
                </div>
                <div className="relative flex items-center justify-center w-full h-full">
                    <AnimatePresence>
                        {countdown !== null && (
                            <motion.div
                                key={countdown}
                                initial={{ opacity: 0, scale: 0.5, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                                transition={{ duration: 0.4 }}
                                className="absolute text-[200px] leading-none font-mono font-black text-accent drop-shadow-[0_0_50px_rgba(99,102,241,0.4)]"
                            >
                                {countdown === 0 ? "GO!" : countdown}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-4xl flex flex-col font-sans relative"
        >

            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 px-6 py-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-white/10 rounded-md font-mono text-xs text-text-dim">R-4821</div>
                    <h2 className="text-xl font-display font-bold text-foreground">SpeedRace x</h2>
                </div>
                <div className="flex items-center gap-4">
                    {raceState === "finished" && !showResults && (
                        <Button
                            variant="primary"
                            onClick={() => setShowResults(true)}
                            className="font-bold rounded-lg text-sm"
                        >
                            View Results
                        </Button>
                    )}
                    <div className="font-mono text-xl text-accent font-bold">
                        00:{timeLeft.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Input Area (Moved above lanes) */}
            <div className={`relative bg-[#0F0F0F] rounded-[24px] p-6 sm:p-8 border border-white/5 shadow-xl overflow-hidden mb-6 mt-2 shrink-0 ${raceState === "racing" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                <input
                    autoFocus
                    className="absolute inset-0 opacity-0 z-50 cursor-text"
                    value={typedChars}
                    onChange={handleInput}
                    disabled={raceState !== "racing"}
                    spellCheck="false"
                    autoComplete="off"
                />

                <div
                    className="h-[3.2em] overflow-hidden relative z-10 w-full rounded-lg font-mono text-2xl sm:text-[2rem] leading-[1.6] tracking-tight"
                    style={{
                        maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
                    }}
                >
                    <div
                        className="transition-transform duration-300 ease-out relative text-left"
                        style={{ transform: `translateY(-${translateY}px)` }}
                    >
                        {renderText()}
                    </div>
                </div>
            </div>

            {/* Lanes */}
            <div className="space-y-2 mb-8 w-full flex-1">
                {(() => {
                    const sortedPlayers = [...players].sort((a, b) => b.wpm - a.wpm);
                    const p1Index = sortedPlayers.findIndex(p => p.id === "p1");
                    const lastIndex = sortedPlayers.length - 1;
                    const visibleIndicesArray = Array.from(new Set([0, 1, 2, 3, p1Index, lastIndex].filter(i => i <= lastIndex && i >= 0))).sort((a, b) => a - b);

                    return visibleIndicesArray.map((idx, i) => {
                        const player = sortedPlayers[idx];
                        const prevIdx = i > 0 ? visibleIndicesArray[i - 1] : -1;
                        const showGap = idx - prevIdx > 1;

                        let rankIcon = <span className="font-mono text-text-dim/50 font-bold text-lg w-6 text-center">{idx + 1}</span>;
                        if (idx === 0) rankIcon = <Medal className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] w-6 h-6" strokeWidth={2.5} />;
                        else if (idx === 1) rankIcon = <Medal className="text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.4)] w-6 h-6" strokeWidth={2.5} />;
                        else if (idx === 2) rankIcon = <Medal className="text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.4)] w-6 h-6" strokeWidth={2.5} />;

                        return (
                            <div key={player.id} className="w-full flex flex-col gap-2">
                                {showGap && (
                                    <div className="w-full flex justify-center py-1 opacity-50">
                                        <div className="flex gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                                        </div>
                                    </div>
                                )}
                                <motion.div layout="position" className={`w-full flex items-center gap-4 group p-3 sm:p-4 rounded-xl transition-colors ${player.id === "p1" ? "bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-[#141414] border border-white/5"}`}>
                                    <div className="flex items-center justify-center w-6 shrink-0">
                                        {rankIcon}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1.5 relative">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className={`font-medium flex items-center gap-2 ${player.id === "p1" ? "text-white" : "text-text-dim"}`}>
                                                {player.name}
                                                {player.id === "p1" && <span className="ml-2 px-1.5 py-0.5 bg-accent/20 text-accent text-[8px] rounded-full uppercase font-bold tracking-widest">You</span>}
                                            </span>
                                            <span className="font-mono text-xs text-text-dim/70">
                                                {player.status === "finished" ? (
                                                    <span className="text-white flex items-center gap-1 font-bold">
                                                        ✓ FINISHED
                                                    </span>
                                                ) : `${player.wpm} WPM`}
                                            </span>
                                        </div>
                                        <div className="w-full h-3.5 bg-[#0F0F0F] rounded-full overflow-hidden relative border border-white/5">
                                            <motion.div
                                                className={`h-full absolute left-0 top-0 bottom-0 ${player.id === "p1" ? "bg-accent shadow-[0_0_10px_rgba(99,102,241,0.8)]" : "bg-text-dim/30"}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${player.progress}%` }}
                                                transition={{ ease: "linear", duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    });
                })()}
            </div>
            {/* Overlays */}
            <RaceResultsModal
                isOpen={raceState === "finished" && showResults}
                players={players}
                onClose={() => setShowResults(false)}
                onLeave={onLeave}
            />

        </motion.div>
    );
}

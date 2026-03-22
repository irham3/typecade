import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Medal, Copy, Check } from "lucide-react";
import { generateWords } from "@/lib/words";
import { RaceResultsModal } from "./race-results-modal";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { sanitizeTestResult } from "@/lib/utils/validation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLivePlayerSync, type LivePlayerSyncPayload } from "../hooks/use-live-player-sync";
import { useRoomData } from "../hooks/use-room-data";
import { useRoomChannel } from "../hooks/use-room-channel";
import { useRaceTimer } from "../hooks/use-race-timer";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type RaceState = "waiting" | "countdown" | "racing" | "finished";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOT_SPEEDS: Record<string, number> = { p2: 15, p3: 30, p4: 50, p5: 70, p6: 90, p7: 110 };

const OFFLINE_PLAYERS: Player[] = [
    { id: "p1", name: "TypingNinja (You)", wpm: 0, progress: 0, correctChars: 0, color: "var(--color-accent)", status: "waiting" },
    { id: "p2", name: "Newbie_Typer",      wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    { id: "p3", name: "SlowPoke",          wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    { id: "p4", name: "AverageJoe",        wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    { id: "p5", name: "FastFingers99",     wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    { id: "p6", name: "Keyboard_Slayer",   wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    { id: "p7", name: "TypeGod_T800",      wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiplayerRace({ onLeave, roomCode }: { onLeave: () => void; roomCode?: string | null }) {
    const { user, supabaseReady } = useAuth();

    // ── 1. Fetch room data once on mount ─────────────────────────────────────
    const {
        roomId,
        roomNotFound,
        raceConfig,
        hostId,
        targetText: initialTargetText,
        initialStatus,
        raceStartedAt: initialRaceStartedAt,
        mounted,
    } = useRoomData({ roomCode, user, supabaseReady });

    // ── 2. Derived flags ──────────────────────────────────────────────────────
    const isRealtime = useMemo(() => Boolean(roomId && user && supabaseReady), [roomId, user, supabaseReady]);
    const currentUserId = useMemo(() => (isRealtime && user ? user.id : "p1"), [isRealtime, user]);

    // ── 3. UI + game state ────────────────────────────────────────────────────
    const [raceState, setRaceState] = useState<RaceState>("waiting");
    const [raceStartedAt, setRaceStartedAt] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(true);
    const [players, setPlayers] = useState<Player[]>(OFFLINE_PLAYERS);
    const [targetText, setTargetText] = useState(initialTargetText);
    const [typedChars, setTypedChars] = useState("");
    const [translateY, setTranslateY] = useState(0);
    const [copied, setCopied] = useState(false);

    // ── 4. Refs ───────────────────────────────────────────────────────────────
    // Stable refs avoid stale closures inside intervals & callbacks.
    const typedCharsRef = useRef(typedChars);
    const startTimeRef = useRef<number | null>(null);
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const livePlayersRef = useRef<Record<string, LivePlayerSyncPayload>>({});
    const savedRef = useRef(false);
    const finishSyncedRef = useRef(false);
    const pendingResultRef = useRef<{ wpm: number; acc: number; timeTaken: number } | null>(null);

    useEffect(() => { typedCharsRef.current = typedChars; }, [typedChars]);

    // ── 5. Initialize state after room data is ready ──────────────────────────
    useEffect(() => {
        if (!mounted) return;
        setTargetText(initialTargetText);
        if (isRealtime) {
            setPlayers([]);
            setRaceState(initialStatus);
            setRaceStartedAt(initialRaceStartedAt);
            setShowResults(initialStatus === "finished");
        } else {
            setPlayers(OFFLINE_PLAYERS);
            setRaceState("countdown");
            setShowResults(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]); // intentionally only when mount completes

    // ── 6. Live player sync ───────────────────────────────────────────────────
    const { syncLive } = useLivePlayerSync({
        isRealtime,
        roomId,
        userId: user?.id ?? null,
        channelRef,
        dbIntervalMs: 3000,
        broadcastIntervalMs: 16,
    });

    // ── 7. Live stats calculation (defined early so it can be used in hooks below)
    // Uses startTimeRef (stable ref) so it doesn't need deps that change often.
    const calculateLiveStats = useCallback((value: string) => {
        const startMs = startTimeRef.current;
        const elapsedMs = startMs ? Math.max(1, Date.now() - startMs) : 1;
        const correctChars = value.split("").filter((char, i) => char === targetText[i]).length;
        const wpm = Math.max(0, Math.round(((correctChars / 5) / (elapsedMs / 60_000)) * 10) / 10);
        const accuracy = value.length > 0 ? Math.max(0, Math.round((correctChars / value.length) * 100)) : 100;
        const totalChars = raceConfig.mode === "words"
            ? raceConfig.value * 5
            : (100 * 5) * (raceConfig.value / 60);
        const progress = Math.min(100, (correctChars / totalChars) * 100);
        return { wpm, accuracy, progress, correctChars, elapsedMs };
    }, [targetText, raceConfig]);

    // ── 8. Race timer ─────────────────────────────────────────────────────────
    // handleTimeUp is defined here — BEFORE useRaceTimer — so the ref is stable.
    const handleTimeUpRef = useRef<() => void>(() => undefined);
    const handleTimeUp = useCallback(() => {
        setRaceState("finished");
        if (isRealtime && user && roomId) {
            const duration = raceConfig.mode === "time" ? raceConfig.value : 300;
            const elapsedMin = Math.max(0.01, duration / 60);
            setPlayers(p => p.map(player => {
                if (player.id !== currentUserId) return player;
                const wpm = Math.max(0, Math.floor((player.correctChars / 5) / elapsedMin));
                syncLive({ progress: player.progress, wpm, correctChars: Math.floor(player.correctChars), status: "finished" });
                return { ...player, wpm, status: "finished" };
            }));
        }
    }, [isRealtime, user, roomId, currentUserId, raceConfig, syncLive]);

    useEffect(() => { handleTimeUpRef.current = handleTimeUp; }, [handleTimeUp]);

    const { countdown, setCountdown, timeLeft, startRef: timerStartRef } = useRaceTimer({
        raceState,
        raceConfig,
        raceStartedAt,
        onTimeUp: useCallback(() => handleTimeUpRef.current(), []),
    });

    // Keep startTimeRef in sync with the timer's startRef for WPM calculations
    useEffect(() => {
        startTimeRef.current = timerStartRef.current;
    });

    // ── 9. Supabase channel ───────────────────────────────────────────────────
    const { leaveRoom } = useRoomChannel({
        roomId,
        userId: user?.id ?? null,
        roomCode,
        raceConfig,
        channelRef,
        livePlayersRef,
        currentUserId,
        setPlayers,
        setRaceState,
        setShowResults,
        setTargetText,
        setTypedChars,
        setTranslateY,
        setRaceStartedAt,
        finishSyncedRef,
    });

    // ── 10. Countdown → Racing transition ─────────────────────────────────────
    useEffect(() => {
        if (raceState !== "countdown" || countdown !== 0) return;
        const timer = setTimeout(() => {
            setRaceState("racing");
            setPlayers(p => p.map(player => ({ ...player, status: "playing" })));
        }, 0);
        return () => clearTimeout(timer);
    }, [raceState, countdown]);

    // ── 11. Offline bot simulation ────────────────────────────────────────────
    useEffect(() => {
        if (raceState !== "racing" || isRealtime) return;
        const totalChars = raceConfig.mode === "words"
            ? raceConfig.value * 5
            : (100 * 5) * (raceConfig.value / 60);
        const timer = setInterval(() => {
            const elapsedMin = startTimeRef.current
                ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60)
                : 0.01;
            setPlayers(p => p.map(player => {
                if (player.status === "finished") return player;
                if (player.id === "p1") {
                    const newWpm = Math.max(0, Math.floor((player.correctChars / 5) / elapsedMin));
                    const newProgress = Math.min(100, (player.correctChars / totalChars) * 100);
                    return { ...player, wpm: newWpm, progress: newProgress };
                }
                const baseSpeed = BOT_SPEEDS[player.id] ?? 40;
                const currentWpm = baseSpeed + (Math.random() * 10 - 5);
                const charsAdded = (currentWpm * 5) / 120;
                const newCorrectChars = player.correctChars + charsAdded;
                const newProgress = Math.min(100, (newCorrectChars / totalChars) * 100);
                return { ...player, correctChars: newCorrectChars, progress: newProgress, wpm: Math.floor(currentWpm), status: newProgress >= 100 ? "finished" : "playing" };
            }));
        }, 500);
        return () => clearInterval(timer);
    }, [raceState, isRealtime, raceConfig]);

    // ── 12. Realtime self-sync interval (smooth visual update) ────────────────
    useEffect(() => {
        if (raceState !== "racing" || !isRealtime) return;
        const timer = setInterval(() => {
            const stats = calculateLiveStats(typedCharsRef.current);
            setPlayers(p => p.map(player => {
                if (player.id !== currentUserId || player.status === "finished") return player;
                return { ...player, wpm: stats.wpm, progress: stats.progress, correctChars: stats.correctChars };
            }));
            syncLive({ progress: stats.progress, wpm: stats.wpm, correctChars: Math.floor(stats.correctChars), status: "playing" });
        }, 50);
        return () => clearInterval(timer);
    }, [raceState, isRealtime, calculateLiveStats, currentUserId, syncLive]);

    // ── 13. Save result when race finishes ────────────────────────────────────
    useEffect(() => {
        if (raceState === "racing") { savedRef.current = false; return; }
        if (raceState !== "finished" || savedRef.current) return;
        savedRef.current = true;

        const stats = calculateLiveStats(typedCharsRef.current);
        const timeTaken = Math.max(0, Math.floor(stats.elapsedMs / 1000));

        setPlayers(p => p.map(player => {
            if (player.id !== currentUserId) return player;
            return { ...player, wpm: stats.wpm, progress: stats.progress, correctChars: stats.correctChars, status: "finished" };
        }));

        if (isRealtime && user && roomId) {
            syncLive({ progress: stats.progress, wpm: stats.wpm, correctChars: Math.floor(stats.correctChars), status: "finished" });
        }

        pendingResultRef.current = { wpm: stats.wpm, acc: stats.accuracy, timeTaken };
        void saveResult(stats.wpm, stats.accuracy, timeTaken).then(ok => {
            if (ok) pendingResultRef.current = null;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raceState]);

    // ── 14. Retry saving result if supabase wasn't ready on first attempt ─────
    useEffect(() => {
        const pending = pendingResultRef.current;
        if (!pending || !supabaseReady || !user) return;
        void saveResult(pending.wpm, pending.acc, pending.timeTaken).then(ok => {
            if (ok) pendingResultRef.current = null;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabaseReady, user]);

    // ── 15. Host marks room as finished ──────────────────────────────────────
    useEffect(() => {
        if (raceState !== "finished" || !isRealtime || !user || !roomId || hostId !== user.id || finishSyncedRef.current) return;
        finishSyncedRef.current = true;
        const client = getSupabaseClient();
        if (!client) return;
        void client.from("multiplayer_rooms")
            .update({ status: "finished" } as unknown as never)
            .eq("id", roomId);
    }, [raceState, isRealtime, user, roomId, hostId]);

    // ── 16. Typing area scroll ────────────────────────────────────────────────
    useEffect(() => {
        if (raceState === "countdown") { setTranslateY(0); return; }
        if (!activeCharRef.current) return;
        const charTop = activeCharRef.current.offsetTop;
        const parentElem = activeCharRef.current.parentElement?.parentElement;
        if (!parentElem) return;
        const lineHeight = parseFloat(window.getComputedStyle(parentElem).lineHeight) || activeCharRef.current.offsetHeight;
        if (lineHeight === 0) return;
        const lineIndex = Math.floor((charTop + 2) / lineHeight);
        const timer = setTimeout(() => setTranslateY(lineIndex * lineHeight), 0);
        return () => clearTimeout(timer);
    }, [typedChars, raceState]);

    // ── Save result helper ────────────────────────────────────────────────────
    const saveResult = useCallback(async (finalWpm: number, finalAcc: number, timeTaken: number) => {
        if (!supabaseReady || !user) return false;
        const client = getSupabaseClient();
        if (!client) return false;
        const safe = sanitizeTestResult(finalWpm, finalAcc, timeTaken);
        const { error } = await client.from("typing_tests").insert({
            user_id: user.id,
            mode: raceConfig.mode,
            mode_value: raceConfig.value,
            language: raceConfig.language,
            wpm: safe.wpm,
            accuracy: safe.accuracy,
            duration_seconds: safe.durationSeconds,
        } as unknown as never);
        if (error) return false;
        const { error: rpcError } = await (client as unknown as {
            rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;
        }).rpc("update_user_stats", { p_user_id: user.id });
        return !rpcError;
    }, [supabaseReady, user, raceConfig]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (raceState !== "racing") return;
        const val = e.target.value;
        setTypedChars(val);

        if (!isRealtime && targetText.length - val.length < 150) {
            setTargetText(prev => prev + " " + generateWords(raceConfig.language, 30, false, false));
        }

        const elapsedMin = startTimeRef.current
            ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60)
            : 0.01;
        const correctChars = val.split("").filter((char, i) => char === targetText[i]).length;
        const wpm = Math.max(0, Math.floor((correctChars / 5) / elapsedMin));
        const totalChars = raceConfig.mode === "words"
            ? raceConfig.value * 5
            : (100 * 5) * (raceConfig.value / 60);
        const progress = Math.min(100, (correctChars / totalChars) * 100);
        const isFinished = progress >= 100;

        if (isFinished) setRaceState("finished");

        setPlayers(p => p.map(player => {
            if (player.id !== currentUserId) return player;
            return { ...player, progress, wpm, correctChars, status: isFinished ? "finished" : "playing" };
        }));

        if (isRealtime && user && roomId) {
            syncLive({ progress, wpm, correctChars: Math.floor(correctChars), status: isFinished ? "finished" : "playing" });
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/race?code=${roomCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStartRace = async () => {
        if (!user || !roomId || hostId !== user.id) return; // Only host can start
        const client = getSupabaseClient();
        if (!client) return;
        await client.from("multiplayer_rooms")
            .update({ status: "racing", updated_at: new Date().toISOString() } as unknown as never)
            .eq("id", roomId);
    };

    const handleLeave = () => {
        leaveRoom();
        onLeave();
    };

    const handleRestart = () => {
        if (isRealtime) return;
        setTypedChars("");
        setTargetText(generateWords(raceConfig.language, 50, false, false));
        setPlayers(p => p.map(player => ({ ...player, status: "waiting", progress: 0, wpm: 0, correctChars: 0 })));
        setCountdown(3);
        setRaceState("countdown");
        setShowResults(false);
    };

    // ── Render text ───────────────────────────────────────────────────────────
    const renderText = () => {
        const words = targetText.split(" ");
        let globalIndex = 0;
        return words.map((word, wIdx) => {
            const wordLen = word.length;
            const isLastWord = wIdx === words.length - 1;
            const wordNodes = word.split("").map((char, cIdx) => {
                const index = globalIndex + cIdx;
                const typedChar = typedChars[index];
                let cls = "text-text-dim";
                if (typedChar != null) {
                    cls = typedChar === char
                        ? "text-accent drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                        : "text-error-text bg-error-bg/60 rounded-sm";
                }
                const isCurrent = index === typedChars.length;
                return (
                    <span key={cIdx} ref={isCurrent ? activeCharRef : null} className={`relative transition-colors duration-100 ${cls}`}>
                        {isCurrent && raceState === "racing" && (
                            <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                        )}
                        {char}
                    </span>
                );
            });

            const spaceIndex = globalIndex + wordLen;
            const spaceTyped = typedChars[spaceIndex];
            const isSpaceCurrent = spaceIndex === typedChars.length;
            let spaceCls = "text-text-dim";
            if (spaceTyped != null) {
                spaceCls = spaceTyped === " " ? "text-accent" : "text-error-text bg-error-bg/60 rounded-sm";
            }
            globalIndex += wordLen + (isLastWord ? 0 : 1);

            return (
                <span key={wIdx} className="inline-block">
                    {wordNodes}
                    {!isLastWord && (
                        <span ref={isSpaceCurrent ? activeCharRef : null} className={`relative transition-colors duration-100 ${spaceCls}`}>
                            {isSpaceCurrent && raceState === "racing" && (
                                <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                            )}
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    // ── Early returns ─────────────────────────────────────────────────────────

    if (!mounted) return null;

    if (roomNotFound) {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background gap-6 p-4">
                <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="glass flex flex-col items-center p-12 rounded-3xl max-w-md w-full text-center border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)] relative z-10"
                >
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <div className="text-3xl">🚫</div>
                    </div>
                    <h2 className="text-3xl font-display font-bold text-foreground mb-2">Arena Closed</h2>
                    <p className="text-text-dim text-sm mb-8 leading-relaxed">
                        The room code <span className="font-mono text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">{roomCode}</span> does not exist or the match has already concluded.
                    </p>
                    <Button onClick={handleLeave} className="w-full py-6 font-bold text-base hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-shadow">
                        Return to Lobby
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (raceState === "waiting") {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] min-w-75 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] min-w-100 bg-accent-secondary/5 rounded-full blur-[120px] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center"
                >
                    <div className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        Pre-Match Lobby
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-display font-bold mb-10 text-center shimmer-text tracking-tight">Gathering Racers...</h2>
                    {roomCode && (
                        <div className="mb-12 flex flex-col items-center gap-3 w-full max-w-md">
                            <div className="text-xs text-text-dim/80 uppercase tracking-widest font-bold">Invite Code</div>
                            <div className="flex items-stretch w-full glass rounded-2xl border border-white/10 p-1.5 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-shadow">
                                <span className="flex-1 flex justify-center items-center text-3xl font-mono font-black tracking-[0.3em] text-foreground py-3 pl-4 bg-black/40 rounded-xl mr-1.5 border border-white/5">
                                    {roomCode}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={copyLink}
                                    className={`h-auto aspect-square rounded-xl transition-all ${copied ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/5 hover:bg-white/10 text-text-dim hover:text-white'}`}
                                    title="Copy Invite Link"
                                >
                                    {copied ? <Check size={24} /> : <Copy size={22} />}
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="w-full max-w-lg mb-10">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <span className="text-sm font-bold text-text-dim uppercase tracking-wider">Players ({players.length}/6)</span>
                            {players.length < 2 && <span className="text-xs text-accent animate-pulse">Waiting for opponent...</span>}
                        </div>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {players.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 p-4 glass-subtle rounded-2xl border border-white/5 relative overflow-hidden group"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-accent to-accent-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-accent/20 to-black flex items-center justify-center text-accent font-bold text-lg shadow-inner border border-accent/20">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="font-bold text-base text-foreground/90">{p.name}</span>
                                            {p.id === currentUserId && <span className="text-[10px] text-accent font-mono uppercase tracking-widest -mt-0.5">You</span>}
                                        </div>
                                        <span className="text-[10px] text-accent-secondary/80 font-bold px-2.5 py-1 bg-accent-secondary/10 rounded-md uppercase tracking-widest border border-accent-secondary/20">Ready</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                    {user && hostId === user.id ? (
                        <Button
                            variant="primary"
                            onClick={handleStartRace}
                            disabled={players.length < 2}
                            className={`w-full max-w-lg py-7 text-lg font-display font-bold rounded-2xl transition-all ${players.length >= 2 ? 'hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.02]' : 'opacity-60 grayscale'}`}
                        >
                            {players.length < 2 ? "Waiting for players..." : "Start Race"}
                        </Button>
                    ) : (
                        <div className="w-full max-w-lg py-5 text-center text-text-dim/70 font-bold tracking-widest uppercase bg-panel-bg/50 rounded-2xl border border-white/5 animate-pulse">
                            Host is preparing...
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    if (raceState === "countdown") {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background overflow-hidden">
                <div className="absolute inset-0 bg-vignette" />
                <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute top-[25%] text-2xl md:text-3xl font-display font-medium text-text-dim tracking-[0.2em] uppercase"
                >
                    Get Ready
                </motion.div>
                <div className="relative flex items-center justify-center w-full h-full">
                    <AnimatePresence>
                        {countdown !== null && (
                            <motion.div
                                key={countdown}
                                initial={{ opacity: 0, scale: 0.2, filter: "blur(20px)", y: 20 }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, scale: 2, filter: "blur(10px)" }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="absolute text-[180px] md:text-[250px] leading-none font-display font-black text-transparent bg-clip-text bg-linear-to-b from-white to-accent drop-shadow-[0_0_80px_rgba(99,102,241,0.6)]"
                            >
                                {countdown === 0 ? "GO!" : countdown}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    // ── Racing / Finished UI ──────────────────────────────────────────────────
    return (
        <>
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-5xl flex flex-col font-sans relative mx-auto"
        >
            <div className="fixed inset-0 bg-vignette opacity-50 pointer-events-none z-[-1]" />
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-[-1]" />

            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8 px-8 py-5 glass rounded-3xl border border-white/10 glow-accent relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-accent/5 to-transparent pointer-events-none" />
                <div className="flex items-center gap-5 relative z-10">
                    <div className="px-3 py-1.5 bg-black/40 rounded-lg font-mono text-xs font-bold text-accent border border-accent/20 shadow-inner">ROOM CODE: {roomCode}</div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">Arena Match</h2>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    {raceState === "finished" && !showResults && (
                        <Button variant="primary" onClick={() => setShowResults(true)}
                            className="font-bold rounded-xl text-sm px-6 shadow-lg shadow-accent/20 animate-pulse-glow"
                        >
                            View Results
                        </Button>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-text-dim/80 uppercase tracking-widest mb-1">Time Left</span>
                        <div className={`font-mono text-3xl font-black ${timeLeft <= 10 && raceState === "racing" ? "text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)] animate-pulse" : "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"}`}>
                            00:{timeLeft.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Typing Zone */}
            <div className={`relative glass rounded-4xl p-8 sm:p-10 border border-white/10 shadow-2xl overflow-hidden mb-10 shrink-0 transition-opacity duration-300 ${raceState === "racing" ? "opacity-100" : "opacity-50 pointer-events-none grayscale"}`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-50" />
                <input
                    autoFocus
                    className="absolute inset-0 opacity-0 z-50 cursor-default"
                    value={typedChars}
                    onChange={handleInput}
                    onPaste={(e) => e.preventDefault()}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onKeyDown={(e) => {
                        // Allow Ctrl/Cmd + R (Reload)
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') return;
                        if (e.ctrlKey || e.metaKey) e.preventDefault();
                    }}
                    disabled={raceState !== "racing"}
                    spellCheck="false"
                    autoComplete="off"
                />
                <div
                    className="h-[3.8em] overflow-hidden relative z-10 w-full rounded-xl font-mono text-3xl sm:text-[2.2rem] leading-[1.65] tracking-tight select-none"
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                    }}
                >
                    <div className="transition-transform duration-200 ease-out relative text-left" style={{ transform: `translateY(-${translateY}px)` }}>
                        {renderText()}
                    </div>
                </div>
            </div>

            {/* Racing Lanes */}
            <div className="space-y-4 mb-12 w-full flex-1 relative">
                <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none opacity-5">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white" />)}
                </div>
                {(() => {
                    const sorted = [...players].sort((a, b) => b.progress - a.progress);
                    return sorted.map((player, idx) => {
                        const isMe = player.id === currentUserId;
                        let rankIcon = <span className="font-mono text-text-dim/60 font-bold text-lg w-8 text-center">{idx + 1}</span>;
                        if (idx === 0) rankIcon = <Medal className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] w-7 h-7" strokeWidth={2.5} />;
                        else if (idx === 1) rankIcon = <Medal className="text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)] w-7 h-7" strokeWidth={2.5} />;
                        else if (idx === 2) rankIcon = <Medal className="text-amber-600 drop-shadow-[0_0_15px_rgba(217,119,6,0.4)] w-7 h-7" strokeWidth={2.5} />;
                        return (
                            <motion.div layout="position" key={player.id}
                                className={`w-full flex items-center gap-4 group p-4 sm:p-5 rounded-2xl transition-all relative z-10 ${isMe ? "glass glow-accent border border-accent/30 shadow-lg scale-[1.01]" : "glass-subtle border border-white/5 opacity-80 hover:opacity-100"}`}
                            >
                                <div className="flex items-center justify-center w-8 shrink-0">{rankIcon}</div>
                                <div className="flex-1 flex flex-col gap-2.5">
                                    <div className="flex justify-between items-end text-sm">
                                        <span className={`font-bold text-base flex items-center gap-3 ${isMe ? "text-white" : "text-text-dim"}`}>
                                            {player.name}
                                            {isMe && <span className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] rounded-md border border-accent/20 uppercase font-bold tracking-widest shadow-inner">You</span>}
                                            {player.status === "finished" && <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] rounded-md uppercase font-bold tracking-widest flex items-center gap-1"><Check size={10} /> Finished</span>}
                                        </span>
                                        <span className={`font-mono text-sm font-bold ${isMe ? "text-accent" : "text-text-dim"}`}>
                                            {player.wpm} <span className="text-xs opacity-60">WPM</span>
                                        </span>
                                    </div>
                                    <div className={`w-full h-4 rounded-full overflow-hidden relative shadow-inner ${isMe ? "bg-black/60 border border-accent/20" : "bg-black/40 border border-white/5"}`}>
                                        <motion.div
                                            className={`h-full absolute left-0 top-0 bottom-0 rounded-full ${isMe ? "bg-linear-to-r from-accent to-accent-secondary shadow-[0_0_15px_rgba(99,102,241,0.8)]" : "bg-white/20"}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${player.progress}%` }}
                                            transition={{ ease: "linear", duration: 0.2 }}
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 -ml-2 transition-all duration-200" style={{ left: `${player.progress}%` }}>
                                            <div className={`w-4 h-4 rounded-full border-2 ${isMe ? "bg-white border-accent shadow-[0_0_10px_white]" : "bg-text-dim border-black"}`} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    });
                })()}
            </div>
        </motion.div>

        {/* Results Modal - Rendered outside motion.div to avoid transform issues */}
        <RaceResultsModal
            isOpen={raceState === "finished" && showResults}
            players={players}
            currentUserId={currentUserId}
            showRestart={!isRealtime}
            onClose={() => setShowResults(false)}
            onLeave={handleLeave}
            onRestart={handleRestart}
        />
        </>
    );
}

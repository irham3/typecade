import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Medal, Copy, Check } from "lucide-react";
import { generateWords } from "@/lib/words";
import { RaceResultsModal } from "./race-results-modal";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useLivePlayerSync, type LivePlayerSyncPayload } from "../hooks/use-live-player-sync";

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

type PlayerRow = {
    id: string;
    user_id: string;
    display_name: string;
    wpm: number | null;
    progress: number | null;
    status: "playing" | "finished" | "waiting";
    correct_chars: number | null;
    joined_at: string;
};

const palette = ["var(--color-accent)", "#38bdf8", "#f472b6", "#facc15", "#22c55e", "#a78bfa", "#fb923c"];

export function MultiplayerRace({ onLeave, roomCode }: { onLeave: () => void; roomCode?: string | null }) {
    const { user, supabaseReady } = useAuth();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(3);
    const [timeLeft, setTimeLeft] = useState(60);
    const [raceState, setRaceState] = useState<"waiting" | "countdown" | "racing" | "finished">("waiting");
    const [showResults, setShowResults] = useState(true);
    const [raceConfig, setRaceConfig] = useState<{ mode: "time" | "words"; value: number; language: "EN" | "ID" }>({ mode: "time", value: 60, language: "EN" });
    const [hostId, setHostId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [raceStartedAt, setRaceStartedAt] = useState<number | null>(null);

    const [players, setPlayers] = useState<Player[]>([
        { id: "p1", name: "TypingNinja (You)", wpm: 0, progress: 0, correctChars: 0, color: "var(--color-accent)", status: "waiting" },
        { id: "p2", name: "Newbie_Typer", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p3", name: "SlowPoke", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p4", name: "AverageJoe", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p5", name: "FastFingers99", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p6", name: "Keyboard_Slayer", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
        { id: "p7", name: "TypeGod_T800", wpm: 0, progress: 0, correctChars: 0, color: "#555", status: "waiting" },
    ]);
    const [typedChars, setTypedChars] = useState("");
    const typedCharsRef = useRef(typedChars);
    const playersRef = useRef(players);
    useEffect(() => {
        playersRef.current = players;
    }, [players]);
    useEffect(() => {
        typedCharsRef.current = typedChars;
    }, [typedChars]);

    // Dummy typing engine
    const [targetText, setTargetText] = useState<string>("");
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const startTimeRef = useRef<number | null>(null);
    const [translateY, setTranslateY] = useState(0);
    const [mounted, setMounted] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const livePlayersRef = useRef<Record<string, LivePlayerSyncPayload>>({});
    const savedRef = useRef(false);
    const finishSyncedRef = useRef(false);
    const pendingResultRef = useRef<{ wpm: number; acc: number; timeTaken: number } | null>(null);

    const isRealtime = useMemo(() => Boolean(roomId && user && supabaseReady), [roomId, user, supabaseReady]);
    const currentUserId = useMemo(() => (isRealtime && user ? user.id : "p1"), [isRealtime, user]);
    const { syncLive } = useLivePlayerSync({
        isRealtime,
        roomId,
        userId: user?.id ?? null,
        channelRef,
        dbIntervalMs: 50,
        broadcastIntervalMs: 16,
    });

    const calculateLiveStats = useCallback((value: string) => {
        const elapsedMs = startTimeRef.current ? Math.max(1, Date.now() - startTimeRef.current) : 1;
        const correctChars = value.split("").filter((char, i) => char === targetText[i]).length;
        const wpmRaw = (correctChars / 5) / (elapsedMs / 60000);
        const wpm = Math.max(0, Math.round(wpmRaw * 10) / 10);
        const accuracy = value.length > 0 ? Math.max(0, Math.round((correctChars / value.length) * 100)) : 100;

        let totalChars = 600;
        if (raceConfig.mode === "words") {
            totalChars = raceConfig.value * 5;
        } else {
            totalChars = (100 * 5) * (raceConfig.value / 60);
        }

        const progress = Math.min(100, (correctChars / totalChars) * 100);
        return { wpm, accuracy, progress, correctChars, elapsedMs };
    }, [raceConfig.mode, raceConfig.value, targetText]);

    const copyLink = () => {
        const url = `${window.location.origin}/race?code=${roomCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resolveDisplayName = useCallback(async () => {
        const client = getSupabaseClient();
        if (!client || !user) return "Player";
        const { data } = await client
            .from("profiles")
            .select("display_name, username")
            .eq("user_id", user.id)
            .maybeSingle();
        const profile = (data ?? null) as { display_name?: string; username?: string } | null;
        if (profile?.display_name) return profile.display_name;
        if (profile?.username) return profile.username;
        return user.email?.split("@")[0] ?? "Player";
    }, [user]);

    const loadPlayers = useCallback(async () => {
        if (!roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
        const { data } = await client
            .from("multiplayer_room_players")
            .select("id, user_id, display_name, wpm, progress, status, correct_chars, joined_at")
            .eq("room_id", roomId)
            .order("joined_at", { ascending: true });

        if (!data) return;

        const now = Date.now();
        const mapped = (data as PlayerRow[]).map((row, index) => {
            const live = livePlayersRef.current[row.user_id] ?? null;
            const hasLive = Boolean(live && now - live.sentAt < 10000);
            return {
                id: row.user_id,
                name: row.display_name,
                wpm: hasLive && live ? live.wpm : (row.wpm ?? 0),
                progress: hasLive && live ? live.progress : (row.progress ?? 0),
                color: palette[index % palette.length],
                status: hasLive && live ? live.status : row.status,
                correctChars: hasLive && live ? live.correctChars : (row.correct_chars ?? 0),
            };
        });

        setPlayers(prev => {
            // Merge strategy: Update all players, but preserve local player's stats 
            // if we are currently racing to prevent UI jitter/rollback from server latency.
            // Only overwrite local player if the server says they are finished (or if we are not racing).
            
            // Note: If mapped is empty, it means something is wrong or room is empty.
            if (mapped.length === 0) return prev;

            // We want to keep existing players if they are not in the new list? 
            // No, the server list is authoritative for who is in the room.
            
            return mapped.map(serverPlayer => {
                // If it's me
                if (serverPlayer.id === currentUserId) {
                    const localPlayer = prev.find(p => p.id === currentUserId);
                    // If I am racing locally (or finished), trust my local stats over the server
                    if (localPlayer && (raceState === "racing" || raceState === "finished")) {
                        return {
                            ...serverPlayer,
                            wpm: localPlayer.wpm,
                            progress: localPlayer.progress,
                            correctChars: localPlayer.correctChars,
                            status: localPlayer.status // Trust local status too
                        };
                    }
                }
                return serverPlayer;
            });
        });
    }, [roomId, currentUserId, raceState]);

    const applyLiveUpdate = useCallback((payload: LivePlayerSyncPayload) => {
        if (payload.userId === currentUserId) return;
        const existing = livePlayersRef.current[payload.userId];
        if (existing && payload.sentAt <= existing.sentAt) return;
        livePlayersRef.current[payload.userId] = payload;
        setPlayers(prev => prev.map(player => {
            if (player.id !== payload.userId) return player;
            return {
                ...player,
                wpm: payload.wpm,
                progress: payload.progress,
                correctChars: payload.correctChars,
                status: payload.status,
            };
        }));
    }, [currentUserId]);

    const applyRaceStart = useCallback((startedAt: string | null | undefined) => {
        const duration = raceConfig.mode === "time" ? raceConfig.value : 300;
        const startedMs = startedAt ? new Date(startedAt).getTime() : null;
        if (!startedMs) {
            setCountdown(3);
            setRaceState("countdown");
            setTimeLeft(duration);
            setShowResults(false);
            startTimeRef.current = null;
            return;
        }

        const now = Date.now();
        const raceStartMs = startedMs + 3000;
        setRaceStartedAt(startedMs);
        startTimeRef.current = raceStartMs;

        if (now < raceStartMs) {
            const secs = Math.max(1, Math.ceil((raceStartMs - now) / 1000));
            setCountdown(secs);
            setRaceState("countdown");
            setTimeLeft(duration);
            setShowResults(false);
            return;
        }

        const elapsed = Math.floor((now - raceStartMs) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0) {
            setRaceState("finished");
            setShowResults(true);
        } else {
            setRaceState("racing");
            setShowResults(false);
        }
    }, [raceConfig.mode, raceConfig.value]);

    useEffect(() => {
        const setup = async () => {
            // Offline fallback
            if (!supabaseReady || !user || !roomCode) {
                setTargetText(generateWords("EN", 50, false, false));
                setRaceState("countdown");
                setMounted(true);
                return;
            }

            const client = getSupabaseClient();
            if (!client) return;

            // Fetch room by code
            const { data } = await client
                .from("multiplayer_rooms")
                .select("id, code, mode, mode_value, language, status, host_user_id, updated_at")
                .eq("code", roomCode)
                .single();
            
            if (data) {
                const roomData = data as { id: string; code: string; mode: string; mode_value: number; language: string; status: string; host_user_id: string; updated_at?: string | null };
                setRoomId(roomData.id); // Set resolved ID
                
                const mode = roomData.mode as "time" | "words";
                const value = roomData.mode_value;
                const lang = roomData.language as "EN" | "ID";
                setRaceConfig({ mode, value, language: lang });
                setTimeLeft(mode === "time" ? value : 300);
                setHostId(roomData.host_user_id);

                if (roomData.status === "racing") {
                    applyRaceStart(roomData.updated_at ?? null);
                } else if (roomData.status === "finished") {
                    setRaceState("finished");
                    setShowResults(true);
                } else {
                    setRaceState("waiting");
                    setShowResults(false);
                    setRaceStartedAt(null);
                }

                const count = mode === "words" ? value : 300;
                // Use room code as seed for deterministic text generation
                const text = generateWords(lang, count, false, false, roomData.code);
                setTargetText(text);
                setPlayers([]); // Clear bots to avoid flash
                setMounted(true);
            } else {
                // Room not found fallback
                setTargetText(generateWords("EN", 50, false, false));
                setMounted(true);
            }
        };
        void setup();
    }, [supabaseReady, user, roomCode, applyRaceStart]);

    useEffect(() => {
        if (!isRealtime || !roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
        const setup = async () => {
            const displayName = await resolveDisplayName();
            await client
                .from("multiplayer_room_players")
                .upsert({
                    room_id: roomId,
                    user_id: user!.id,
                    display_name: displayName,
                    status: "waiting",
                    progress: 0,
                    wpm: 0,
                    correct_chars: 0,
                } as unknown as never, { onConflict: "room_id,user_id" });
            await loadPlayers();
        };
        void setup();
        const channel = client
            .channel(`room-${roomId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => void loadPlayers()
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => void loadPlayers()
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "multiplayer_rooms", filter: `id=eq.${roomId}` },
                (payload) => {
                    const newStatus = payload.new.status;
                    if (newStatus === "racing") {
                        const seedSuffix = payload.new.updated_at || Date.now().toString();
                        const code = payload.new.code || roomCode;
                        const count = raceConfig.mode === "words" ? raceConfig.value : 300;
                        const newText = generateWords(raceConfig.language, count, false, false, code + seedSuffix);
                        setTargetText(newText);
                        
                        setTypedChars("");
                        setTranslateY(0);
                        applyRaceStart(payload.new.updated_at ?? null);
                        finishSyncedRef.current = false;
                        
                        // Reset local player stats visually
                        setPlayers(prev => prev.map(p => ({
                            ...p,
                            status: "playing",
                            progress: 0,
                            wpm: 0,
                            correctChars: 0
                        })));
                    } else if (newStatus === "waiting") {
                         setRaceState("waiting");
                         setShowResults(false);
                         setRaceStartedAt(null);
                         finishSyncedRef.current = false;
                         setTypedChars("");
                         setTranslateY(0);
                         setPlayers(prev => prev.map(p => ({
                            ...p,
                            status: "waiting",
                            progress: 0,
                            wpm: 0,
                            correctChars: 0
                        })));
                    } else if (newStatus === "finished") {
                        setRaceState("finished");
                        setShowResults(true);
                        setRaceStartedAt(null);
                        finishSyncedRef.current = true;
                    }
                }
            )
            .on(
                "broadcast",
                { event: "player_update" },
                (message) => {
                    const payload = message.payload as LivePlayerSyncPayload | null;
                    if (!payload || !payload.userId) return;
                    applyLiveUpdate(payload);
                }
            )
            .subscribe();
        channelRef.current = channel;
        return () => {
            void client
                .from("multiplayer_room_players")
                .delete()
                .eq("room_id", roomId)
                .eq("user_id", user!.id);
            channelRef.current = null;
            void client.removeChannel(channel);
        };
    }, [isRealtime, roomId, user, resolveDisplayName, loadPlayers, raceConfig, roomCode, applyRaceStart, applyLiveUpdate]);

    useEffect(() => {
        if (raceState === "countdown" && countdown !== null) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else if (countdown === 0) {
                const timer = setTimeout(() => {
                    setRaceState("racing");
                    startTimeRef.current = startTimeRef.current ?? (raceStartedAt ? raceStartedAt + 3000 : Date.now());
                    setPlayers(p => p.map(player => ({ ...player, status: "playing" })));
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [countdown, raceState, raceStartedAt]);

    useEffect(() => {
        if (!isRealtime || !user || !roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
        const status = raceState === "racing" ? "playing" : raceState === "finished" ? "finished" : "waiting";
        
        const updateData: Record<string, unknown> = { status };
        
        if (status === "finished") {
            const stats = calculateLiveStats(typedCharsRef.current);
            updateData.wpm = stats.wpm;
            updateData.progress = stats.progress;
            updateData.correct_chars = Math.floor(stats.correctChars);
        }

        void client
            .from("multiplayer_room_players")
            .update(updateData as unknown as never)
            .eq("room_id", roomId)
            .eq("user_id", user.id);
    }, [raceState, isRealtime, user, roomId, calculateLiveStats]);

    useEffect(() => {
        if (raceState === "racing") {
            const timer = setInterval(() => {
                if (startTimeRef.current) {
                    const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
                    const duration = raceConfig.mode === "time" ? raceConfig.value : 300;
                    const remaining = Math.max(0, Math.ceil(duration - elapsedSec));
                    setTimeLeft(remaining);

                    if (remaining <= 0) {
                        setRaceState("finished");
                        clearInterval(timer);
                        return;
                    }
                }

                if (!isRealtime) {
                    setPlayers(p => {
                        const elapsedMin = startTimeRef.current ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60) : 0.01;

                        return p.map(player => {
                            if (player.status === "finished") return player;

                            if (player.id === "p1") {
                                const newWpm = Math.max(0, Math.floor((player.correctChars / 5) / elapsedMin));
                                let totalChars = 600;
                                if (raceConfig.mode === "words") {
                                    totalChars = raceConfig.value * 5;
                                } else {
                                     totalChars = (100 * 5) * (raceConfig.value / 60); 
                                }
                                const newProgress = Math.min(100, (player.correctChars / totalChars) * 100);
                                return { ...player, wpm: newWpm, progress: newProgress };
                            }

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
                            const charsAdded = (currentWpm * 5) / 120; // 500ms segment
                            const newCorrectChars = player.correctChars + charsAdded;
                            
                            let totalChars = 600;
                            if (raceConfig.mode === "words") {
                                totalChars = raceConfig.value * 5;
                            } else {
                                totalChars = (100 * 5) * (raceConfig.value / 60); 
                            }
                            
                            const newProgress = Math.min(100, (newCorrectChars / totalChars) * 100);

                            return { ...player, correctChars: newCorrectChars, progress: newProgress, wpm: Math.floor(currentWpm), status: newProgress >= 100 ? "finished" : "playing" };
                        });
                    });
                }
            }, 500);
            return () => clearInterval(timer);
        }
    }, [raceState, isRealtime, raceConfig]);

    useEffect(() => {
        if (!isRealtime || !user || !roomId) return;
        if (raceState !== "finished") return;
        const stats = calculateLiveStats(typedCharsRef.current);
        syncLive({
            progress: stats.progress,
            wpm: stats.wpm,
            correctChars: Math.floor(stats.correctChars),
            status: "finished",
        });
    }, [isRealtime, raceState, roomId, user, syncLive, calculateLiveStats]);

    useEffect(() => {
        if (!isRealtime || !user || !roomId) return;
        if (raceState !== "finished") return;
        if (hostId !== user.id) return;
        if (finishSyncedRef.current) return;
        finishSyncedRef.current = true;
        const client = getSupabaseClient();
        if (!client) return;
        void client
            .from("multiplayer_rooms")
            .update({ status: "finished" } as unknown as never)
            .eq("id", roomId);
    }, [isRealtime, raceState, roomId, user, hostId]);

    const saveResult = useCallback(async (finalWpm: number, finalAcc: number, timeTaken: number) => {
        if (!supabaseReady || !user) return false;
        const client = getSupabaseClient();
        if (!client) return false;
        
        const { error } = await client.from("typing_tests").insert({
            user_id: user.id,
            mode: raceConfig.mode,
            mode_value: raceConfig.value,
            language: raceConfig.language,
            wpm: finalWpm,
            accuracy: finalAcc,
            duration_seconds: timeTaken,
        } as unknown as never);
        if (error) return false;

        const rpc = (client as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> }).rpc;
        const { error: rpcError } = await rpc("update_user_stats", { p_user_id: user.id });
        if (rpcError) return false;
        return true;
    }, [supabaseReady, user, raceConfig]);

    useEffect(() => {
        if (raceState === "racing") {
            savedRef.current = false;
        } else if (raceState === "finished" && !savedRef.current) {
            savedRef.current = true;
            const stats = calculateLiveStats(typedCharsRef.current);
            const timeTaken = Math.max(0, Math.floor(stats.elapsedMs / 1000));
            setPlayers(p => p.map(player => {
                if (player.id !== currentUserId) return player;
                return { ...player, wpm: stats.wpm, progress: stats.progress, correctChars: stats.correctChars, status: "finished" };
            }));
            if (isRealtime && user && roomId) {
                syncLive({
                    progress: stats.progress,
                    wpm: stats.wpm,
                    correctChars: Math.floor(stats.correctChars),
                    status: "finished",
                });
            }
            pendingResultRef.current = { wpm: stats.wpm, acc: stats.accuracy, timeTaken };
            void saveResult(stats.wpm, stats.accuracy, timeTaken).then((ok) => {
                if (ok) pendingResultRef.current = null;
            });
        }
    }, [raceState, saveResult, calculateLiveStats, currentUserId, isRealtime, roomId, syncLive, user]);

    useEffect(() => {
        const pending = pendingResultRef.current;
        if (!pending) return;
        void saveResult(pending.wpm, pending.acc, pending.timeTaken).then((ok) => {
            if (ok) pendingResultRef.current = null;
        });
    }, [saveResult, supabaseReady, user]);

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

        if (!isRealtime && targetText.length - val.length < 150) {
            setTargetText((prev: string) => prev + " " + generateWords(raceConfig.language, 30, false, false));
        }

        const stats = calculateLiveStats(val);
        const isFinished = raceConfig.mode === "words" && stats.progress >= 100;

        if (isFinished) {
            setRaceState("finished");
        }

        setPlayers(p => p.map(player => {
            if (player.id === currentUserId) {
                return { ...player, progress: stats.progress, wpm: stats.wpm, correctChars: stats.correctChars, status: isFinished ? "finished" : "playing" };
            }
            return player;
        }));

        if (isRealtime && user && roomId) {
            syncLive({
                progress: stats.progress,
                wpm: stats.wpm,
                correctChars: Math.floor(stats.correctChars),
                status: isFinished ? "finished" : "playing",
            });
        }
    };

    useEffect(() => {
        if (raceState !== "racing") return;
        const timer = window.setInterval(() => {
            const stats = calculateLiveStats(typedCharsRef.current);
            setPlayers(p => p.map(player => {
                if (player.id !== currentUserId) return player;
                if (player.status === "finished") return player;
                return { ...player, wpm: stats.wpm, progress: stats.progress, correctChars: stats.correctChars };
            }));
            if (isRealtime && user && roomId) {
                syncLive({
                    progress: stats.progress,
                    wpm: stats.wpm,
                    correctChars: Math.floor(stats.correctChars),
                    status: "playing",
                });
            }
        }, 50);
        return () => window.clearInterval(timer);
    }, [raceState, calculateLiveStats, currentUserId, isRealtime, roomId, syncLive, user]);

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
                            <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
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
                                <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                            )}
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    const handleRestart = async () => {
        if (!isRealtime) {
            setTypedChars("");
            setTargetText(generateWords(raceConfig.language, 50, false, false));
            setPlayers(p => p.map(player => ({ ...player, status: "waiting", progress: 0, wpm: 0, correctChars: 0 })));
            setCountdown(3);
            setRaceState("countdown");
            setShowResults(false);
            return;
        }
        return;
    };

    const handleStartRace = async () => {
        if (!user || !roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
        await client
            .from("multiplayer_rooms")
            .update({ status: "racing", updated_at: new Date().toISOString() } as unknown as never)
            .eq("id", roomId);
    };

    if (!mounted) return null;

    if (raceState === "waiting") {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background p-4">
                 <h2 className="text-3xl font-display font-bold mb-8">Waiting for players...</h2>
                 
                 {roomCode && (
                     <div className="mb-8 flex flex-col items-center gap-2">
                        <div className="text-sm text-text-dim uppercase tracking-wider font-semibold">Room Code</div>
                        <div className="flex items-center gap-2 bg-[#1A1A1A] p-2 pr-4 rounded-xl border border-white/10">
                            <span className="text-2xl font-mono font-bold px-4 py-2 bg-black/30 rounded-lg tracking-widest text-accent">
                                {roomCode}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={copyLink}
                                className="hover:bg-white/10"
                                title="Copy Invite Link"
                            >
                                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                            </Button>
                        </div>
                        <div className="text-xs text-text-dim/50">Share this code or link to invite friends</div>
                     </div>
                 )}

                 <div className="w-full max-w-md space-y-4 mb-8">
                     {players.map(p => (
                         <div key={p.id} className="flex items-center gap-4 p-4 bg-[#141414] rounded-xl border border-white/5">
                             <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                                 {p.name.charAt(0).toUpperCase()}
                             </div>
                             <span className="font-medium flex-1">{p.name}</span>
                             <span className="text-xs text-text-dim px-2 py-1 bg-white/5 rounded uppercase tracking-wider">Ready</span>
                         </div>
                     ))}
                 </div>
                 {user && hostId === user.id ? (
                     <Button onClick={handleStartRace} className="w-full max-w-md py-6 text-lg font-bold">
                         Start Race
                     </Button>
                 ) : (
                     <div className="text-text-dim animate-pulse">Waiting for host to start...</div>
                 )}
            </div>
        );
    }

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
            <div className={`relative bg-[#0F0F0F] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-xl overflow-hidden mb-6 mt-2 shrink-0 ${raceState === "racing" ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
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
                    const p1Index = sortedPlayers.findIndex(p => p.id === currentUserId);
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
                                <motion.div layout="position" className={`w-full flex items-center gap-4 group p-3 sm:p-4 rounded-xl transition-colors ${player.id === currentUserId ? "bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "bg-[#141414] border border-white/5"}`}>
                                    <div className="flex items-center justify-center w-6 shrink-0">
                                        {rankIcon}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1.5 relative">
                                        <div className="flex justify-between items-end text-sm">
                                            <span className={`font-medium flex items-center gap-2 ${player.id === currentUserId ? "text-white" : "text-text-dim"}`}>
                                                {player.name}
                                                {player.id === currentUserId && <span className="ml-2 px-1.5 py-0.5 bg-accent/20 text-accent text-[8px] rounded-full uppercase font-bold tracking-widest">You</span>}
                                                {player.status === "finished" && <span className="px-1.5 py-0.5 bg-white/10 text-white/80 text-[8px] rounded-full uppercase font-bold tracking-widest">Finished</span>}
                                            </span>
                                            <span className="font-mono text-xs text-text-dim/70">
                                                {player.wpm} WPM
                                            </span>
                                        </div>
                                        <div className="w-full h-3.5 bg-[#0F0F0F] rounded-full overflow-hidden relative border border-white/5">
                                            <motion.div
                                                className={`h-full absolute left-0 top-0 bottom-0 ${player.id === currentUserId ? "bg-accent shadow-[0_0_10px_rgba(99,102,241,0.8)]" : "bg-text-dim/30"}`}
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
                currentUserId={currentUserId}
                showRestart={!isRealtime}
                onClose={() => setShowResults(false)}
                onLeave={onLeave}
                onRestart={handleRestart}
            />

        </motion.div>
    );
}

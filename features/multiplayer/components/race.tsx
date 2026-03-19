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
    const [roomNotFound, setRoomNotFound] = useState(false);
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
        dbIntervalMs: 3000,
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

    const syncPlayersFromPresence = useCallback((presences: Record<string, any[]>) => {
        const now = Date.now();
        const mapped: Player[] = Object.values(presences)
            .map(p => p[0]) // Get first presence per user
            .filter(Boolean)
            .map((presence, index) => {
                const live = livePlayersRef.current[presence.userId] ?? null;
                const isFinished = live?.status === "finished" || raceState === "finished";
                const hasLive = Boolean(live && (now - live.sentAt < 10000 || isFinished));
                return {
                    id: presence.userId,
                    name: presence.displayName || "Unknown",
                    wpm: hasLive && live ? live.wpm : 0,
                    progress: hasLive && live ? live.progress : 0,
                    color: palette[index % palette.length],
                    status: hasLive && live ? live.status : "waiting",
                    correctChars: hasLive && live ? live.correctChars : 0,
                };
            });

        setPlayers(prev => {
            if (mapped.length === 0) return prev;
            return mapped.map(serverPlayer => {
                if (serverPlayer.id === currentUserId) {
                    const localPlayer = prev.find(p => p.id === currentUserId);
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
                // Preserve finished players' final stats even if server rows fall back to 0
                const localPlayer = prev.find(p => p.id === serverPlayer.id);
                if (localPlayer && localPlayer.status === "finished") {
                    return {
                        ...serverPlayer,
                        wpm: localPlayer.wpm,
                        progress: localPlayer.progress,
                        correctChars: localPlayer.correctChars,
                        status: localPlayer.status,
                    };
                }
                return serverPlayer;
            });
        });
    }, [currentUserId, raceState, palette]);

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
                .from("arena_rooms")
                .select("id, code, mode, time, language_code, is_active, is_racing, host_user_id, updated_at, started_at")
                .eq("code", roomCode)
                .single();

            if (data) {
                const roomData = data as any;
                setRoomId(roomData.id); // Set resolved ID

                const mode = roomData.mode as "time" | "words";
                const value = roomData.time;
                const lang = roomData.language_code as "EN" | "ID";
                setRaceConfig({ mode, value, language: lang });
                setTimeLeft(mode === "time" ? value : 300);
                setHostId(roomData.host_user_id);

                if (roomData.is_racing) {
                    applyRaceStart(roomData.started_at ?? null);
                } else if (!roomData.is_active && roomData.is_racing) { // Finished? Or checking if we ended? The DB schema doesn't have a finished status, usually we assume finished if time ran out, or maybe a trigger. We'll start with waiting if not racing
                    setRaceState("waiting");
                    setShowResults(false);
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
                // Room not found — block the game entirely
                setRoomNotFound(true);
                setMounted(true);
            }
        };
        void setup();
    }, [supabaseReady, user, roomCode, applyRaceStart]);

    // Results subscription is set up AFTER fetchAndShowResults is defined (below)
    useEffect(() => {
        if (!isRealtime || !roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
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
                { event: "UPDATE", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => void loadPlayers()
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "multiplayer_rooms", filter: `id=eq.${roomId}` },
                (payload: { new: Record<string, string> }) => {
                    const newStatus = payload.new.status;
                    if (newStatus === "racing") {
                        const seedSuffix = payload.new.updated_at || Date.now().toString();
                        const code = payload.new.code || roomCode;
                        const count = raceConfig.mode === "words" ? raceConfig.value : 300;
                        const newText = generateWords(raceConfig.language, count, false, false, code + seedSuffix);
                        setTargetText(newText);

                        setTypedChars("");
                        setTranslateY(0);
                        applyRaceStart(payload.new.started_at ?? null);
                        finishSyncedRef.current = false;

                        setPlayers(prev => prev.map(p => ({
                            ...p,
                            status: "playing" as const,
                            progress: 0,
                            wpm: 0,
                            correctChars: 0
                        })));
                    } else if (isActive && !isRacing) {
                        setRaceState("waiting");
                        setShowResults(false);
                        setRaceStartedAt(null);
                        finishSyncedRef.current = false;
                        setTypedChars("");
                        setTranslateY(0);
                        // Preserve final WPM/progress; only mark status as waiting
                        setPlayers(prev => prev.map(p => ({
                            ...p,
                            status: "waiting",
                        })));
                    }
                }
            )
            .on(
                "broadcast",
                { event: "player_update" },
                (message: { payload: unknown }) => {
                    const payload = message.payload as LivePlayerSyncPayload | null;
                    if (!payload || !payload.userId) return;
                    applyLiveUpdate(payload);
                }
            )
            .on("presence", { event: "leave" }, ({ leftPresences }: { leftPresences: unknown[] }) => {
                // When a client disconnects, remove them from the room in the DB.
                // The existing postgres_changes DELETE listener will then refresh
                // the player list for everyone still connected.
                const leftUserIds = (leftPresences as unknown as { userId: string }[])
                    .map((p) => p.userId)
                    .filter(Boolean);
                if (leftUserIds.length === 0) return;
            })
            .subscribe((status: string) => {
                if (status === "SUBSCRIBED") {
                    const displayName = await resolveDisplayName();
                    void channel.track({ userId: user!.id, displayName });

                    // Each player inserts their OWN row when they join (RLS only allows self-inserts)
                    const c = getSupabaseClient();
                    if (c && user) {
                        void c
                            .from("arena_results")
                            .upsert({
                                arena_room_id: roomId,
                                user_id: user.id,
                                wpm: 0,
                                accuracy: 0,
                                rank: 0,
                                status: "waiting",
                            } as unknown as never, { onConflict: "arena_room_id,user_id" });
                    }
                }
            });
        channelRef.current = channel;

        const handleUnload = () => {
            // Call server-side RPC: atomically decrements participant_count
            // and sets is_active = false when it hits 0. Reliable even with stale presence.
            const c = getSupabaseClient();
            if (c && roomId) {
                void (c as any).rpc("player_leave_room", { p_room_id: roomId });
            }
        };
        window.addEventListener("pagehide", handleUnload);

        return () => {
            window.removeEventListener("pagehide", handleUnload);
            handleUnload();
            channelRef.current = null;
            void client.removeChannel(channel);
        };
    }, [isRealtime, roomId, user, resolveDisplayName, syncPlayersFromPresence, raceConfig, roomCode, applyRaceStart, applyLiveUpdate]);

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

    // ── Step 3: Debounced DB upsert of live progress ──────────────────────────
    const upsertDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const upsertProgress = useCallback((wpm: number, accuracy: number, _correctChars: number, status: string) => {
        if (!isRealtime || !user || !roomId) return;
        if (upsertDebounceRef.current) clearTimeout(upsertDebounceRef.current);
        upsertDebounceRef.current = setTimeout(async () => {
            const client = getSupabaseClient();
            if (!client) return;
            // Use upsert (not update) so row is created if it somehow doesn't exist
            await (client as any)
                .from("arena_results")
                .upsert(
                    { arena_room_id: roomId, user_id: user.id, wpm, accuracy, status },
                    { onConflict: "arena_room_id,user_id" }
                );
        }, 1500);
    }, [isRealtime, user, roomId]);

    // Safety-net: ensure THIS player's row exists when race starts (handles timing edge-cases)
    useEffect(() => {
        if (!isRealtime || !user || !roomId) return;
        if (raceState !== "racing") return;
        const client = getSupabaseClient();
        if (!client) return;
        const status = raceState === "racing" ? "playing" : raceState === "finished" ? "finished" : "waiting";

        const updateData: Record<string, unknown> = { status };

        if (status === "finished") {
            const stats = calculateLiveStats(typedCharsRef.current);
            updateData.wpm = Math.floor(stats.wpm);
            updateData.progress = Math.floor(stats.progress);
            updateData.correct_chars = Math.floor(stats.correctChars);
        }

        void client
            .from("multiplayer_room_players")
            .update(updateData as unknown as never)
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .then(({ error }: { error: { message: string } | null }) => {
                if (error) {
                    console.error("DB finish update error:", error.message);
                }
            });
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

                        // Force calculate WPM one last time from target duration to avoid zero WPM bug
                        if (isRealtime && user && roomId) {
                            setPlayers(p => p.map(player => {
                                if (player.id === currentUserId) {
                                    const elapsedMin = Math.max(0.01, duration / 60);
                                    const wpm = Math.max(0, Math.floor((player.correctChars / 5) / elapsedMin));
                                    syncLive({
                                        progress: player.progress,
                                        wpm,
                                        correctChars: Math.floor(player.correctChars),
                                        status: "finished",
                                    });
                                    return { ...player, wpm, status: "finished" };
                                }
                                return player;
                            }));
                        }

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
    }, [raceState, isRealtime, raceConfig, currentUserId, roomId, syncLive, user]);

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
            .from("arena_rooms")
            .update({ is_racing: false } as unknown as never)
            .eq("id", roomId);
    }, [isRealtime, raceState, roomId, user, hostId]);

    const saveResult = useCallback(async (finalWpm: number, finalAcc: number, timeTaken: number) => {
        if (!supabaseReady || !user) return false;
        const client = getSupabaseClient();
        if (!client) return false;

        const { error } = await client.from("typing_tests").insert({
            user_id: user.id,
            mode: raceConfig.mode,
            time: raceConfig.value,
            language_code: raceConfig.language,
            wpm: finalWpm,
            accuracy: finalAcc,
            duration_seconds: timeTaken,
        } as unknown as never);
        if (error) return false;

        const { error: rpcError } = await (client as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> }).rpc("update_user_stats", { p_user_id: user.id });
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

        // Update player 1 wpm internally, visually updated more rapidly by setInterval
        const elapsedMin = startTimeRef.current ? Math.max(0.01, (Date.now() - startTimeRef.current) / 1000 / 60) : 0.01;
        const correctChars = val.split("").filter((char, i) => char === targetText[i]).length;
        const wpm = Math.max(0, Math.floor((correctChars / 5) / elapsedMin));

        let totalChars = 600;
        if (raceConfig.mode === "words") {
            totalChars = raceConfig.value * 5;
        } else {
            // Time mode: Estimate based on 100 WPM
            totalChars = (100 * 5) * (raceConfig.value / 60);
        }

        const progress = Math.min(100, (correctChars / totalChars) * 100);
        const isFinished = progress >= 100;

        if (isFinished) {
            setRaceState("finished");
        }

        setPlayers(p => p.map(player => {
            if (player.id === currentUserId) {
                return { ...player, progress: progress, wpm: wpm, correctChars: correctChars, status: isFinished ? "finished" : "playing" };
            }
            return player;
        }));

        if (isRealtime && user && roomId) {
            const acc = val.length > 0 ? Math.floor((correctChars / val.length) * 100) : 100;
            syncLive({
                progress: progress,
                wpm: wpm,
                correctChars: Math.floor(correctChars),
                status: isFinished ? "finished" : "playing",
            });
            // Step 3: Debounced DB persist
            upsertProgress(wpm, acc, Math.floor(correctChars), isFinished ? "finished" : "playing");
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

        // Each player already has their own arena_results row (inserted on presence join).
        // Host only needs to flip is_racing = true. Clients' WPM rows will be updated by
        // each player individually via the debounced upsertProgress call during typing.
        const nowIso = new Date().toISOString();
        const { error } = await client
            .from("arena_rooms")
            .update({ is_racing: true, started_at: nowIso, updated_at: nowIso } as unknown as never)
            .eq("id", roomId);
        if (error) console.error("Failed to start race:", error);
    };

    if (!mounted) return null;

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
                    <Button onClick={onLeave} className="w-full py-6 font-bold text-base hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-shadow">
                        Return to Lobby
                    </Button>
                </motion.div>
            </div>
        );
    }

    if (raceState === "waiting") {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background overflow-hidden">
                {/* Background effects */}
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute top-[20%] right-[10%] w-[30vw] h-[30vw] min-w-[300px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[20%] left-[10%] w-[40vw] h-[40vw] min-w-[400px] bg-accent-secondary/5 rounded-full blur-[120px] pointer-events-none" />

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

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-5xl flex flex-col font-sans relative mx-auto"
        >
            {/* Ambient race background glow */}
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
                        <Button
                            variant="primary"
                            onClick={() => setShowResults(true)}
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

            {/* Input Area (Typing Zone) */}
            <div className={`relative glass rounded-4xl p-8 sm:p-10 border border-white/10 shadow-2xl overflow-hidden mb-10 shrink-0 transition-opacity duration-300 ${raceState === "racing" ? "opacity-100" : "opacity-50 pointer-events-none grayscale"}`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-50" />

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
                    className="h-[3.8em] overflow-hidden relative z-10 w-full rounded-xl font-mono text-3xl sm:text-[2.2rem] leading-[1.65] tracking-tight"
                    style={{
                        maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
                    }}
                >
                    <div
                        className="transition-transform duration-200 ease-out relative text-left"
                        style={{ transform: `translateY(-${translateY}px)` }}
                    >
                        {renderText()}
                    </div>
                </div>
            </div>

            {/* Racing Lanes */}
            <div className="space-y-4 mb-12 w-full flex-1 relative">
                {/* Track background lines */}
                <div className="absolute inset-0 flex flex-col justify-evenly pointer-events-none opacity-5">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-white" />)}
                </div>

                {(() => {
                    const sortedPlayers = [...players].sort((a, b) => b.progress - a.progress);
                    // Standard display logic for positioning
                    return sortedPlayers.map((player, idx) => {
                        let rankIcon = <span className="font-mono text-text-dim/60 font-bold text-lg w-8 text-center">{idx + 1}</span>;
                        if (idx === 0) rankIcon = <Medal className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)] w-7 h-7" strokeWidth={2.5} />;
                        else if (idx === 1) rankIcon = <Medal className="text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)] w-7 h-7" strokeWidth={2.5} />;
                        else if (idx === 2) rankIcon = <Medal className="text-amber-600 drop-shadow-[0_0_15px_rgba(217,119,6,0.4)] w-7 h-7" strokeWidth={2.5} />;

                        const isMe = player.id === currentUserId;

                        return (
                            <motion.div
                                layout="position"
                                key={player.id}
                                className={`w-full flex items-center gap-4 group p-4 sm:p-5 rounded-2xl transition-all relative z-10 ${isMe ? "glass glow-accent border border-accent/30 shadow-lg scale-[1.01]" : "glass-subtle border border-white/5 opacity-80 hover:opacity-100"}`}
                            >
                                <div className="flex items-center justify-center w-8 shrink-0">
                                    {rankIcon}
                                </div>

                                <div className="flex-1 flex flex-col gap-2.5 relative">
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

                                    {/* Progress Bar Track */}
                                    <div className={`w-full h-4 rounded-full overflow-hidden relative shadow-inner ${isMe ? "bg-black/60 border border-accent/20" : "bg-black/40 border border-white/5"}`}>
                                        <motion.div
                                            className={`h-full absolute left-0 top-0 bottom-0 rounded-full ${isMe ? "bg-linear-to-r from-accent to-accent-secondary shadow-[0_0_15px_rgba(99,102,241,0.8)]" : "bg-white/20"}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${player.progress}%` }}
                                            transition={{ ease: "linear", duration: 0.2 }}
                                        />
                                        {/* Car / Avatar indicator at the end of progress bar */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 -ml-2 transition-all duration-200"
                                            style={{ left: `${player.progress}%` }}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 ${isMe ? "bg-white border-accent shadow-[0_0_10px_white]" : "bg-text-dim border-black"}`} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    });
                })()}
            </div>

            {/* Results Overlay */}
            <RaceResultsModal
                isOpen={raceState === "finished" && showResults}
                players={
                    isRealtime && dbResults.length > 0
                        // Merge DB WPM values with presence-based names
                        ? dbResults.map((r, i) => {
                            const presence = players.find(p => p.id === r.user_id);
                            return {
                                id: r.user_id,
                                name: presence?.name ?? `Player ${i + 1}`,
                                wpm: r.wpm,
                                progress: r.status === "finished" ? 100 : (presence?.progress ?? 0),
                                color: presence?.color ?? palette[i % palette.length],
                                status: (r.status as "playing" | "finished" | "waiting"),
                                correctChars: presence?.correctChars ?? 0,
                            };
                        })
                        : players
                }
                currentUserId={currentUserId}
                showRestart={!isRealtime}
                onClose={() => setShowResults(false)}
                onLeave={onLeave}
                onRestart={handleRestart}
            />
        </motion.div>
    );
}

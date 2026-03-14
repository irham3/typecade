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
    const playersRef = useRef(players);
    useEffect(() => {
        playersRef.current = players;
    }, [players]);

    // Dummy typing engine
    const [typedChars, setTypedChars] = useState("");
    const [targetText, setTargetText] = useState<string>("");
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const startTimeRef = useRef<number | null>(null);
    const [translateY, setTranslateY] = useState(0);
    const [mounted, setMounted] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const livePlayersRef = useRef<Record<string, LivePlayerSyncPayload>>({});
    const savedRef = useRef(false);
    const finishSyncedRef = useRef(false);

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
                            status: localPlayer.status
                        };
                    }
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
                { event: "UPDATE", schema: "public", table: "arena_rooms", filter: `id=eq.${roomId}` },
                (payload: any) => {
                    const isRacing = payload.new.is_racing;
                    const isActive = payload.new.is_active;

                    if (isRacing) {
                        const seedSuffix = payload.new.started_at || payload.new.updated_at || Date.now().toString();
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
                        setPlayers(prev => prev.map(p => ({
                            ...p,
                            status: "waiting" as const,
                            progress: 0,
                            wpm: 0,
                            correctChars: 0
                        })));
                    }
                }
            )
            .on(
                "broadcast",
                { event: "player_update" },
                (message: any) => {
                    const payload = message.payload as LivePlayerSyncPayload | null;
                    if (!payload || !payload.userId) return;
                    applyLiveUpdate(payload);
                }
            )
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                syncPlayersFromPresence(state);

                // Host maintains participant count
                const c = getSupabaseClient();
                if (c && user?.id === hostId) {
                    const count = Object.keys(state).length;
                    void c.from("arena_rooms").update({ participant_count: count } as unknown as never).eq("id", roomId);
                }
            })
            .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
                const leftUserIds = (leftPresences as { userId: string }[])
                    .map((p) => p.userId)
                    .filter(Boolean);
                if (leftUserIds.length === 0) return;
            })
            .subscribe(async (status: any) => {
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
        void (client as any)
            .from("arena_results")
            .upsert(
                { arena_room_id: roomId, user_id: user.id, wpm: 0, accuracy: 0, rank: 0, status: "playing" },
                { onConflict: "arena_room_id,user_id" }
            );
    }, [isRealtime, user, roomId, raceState]);


    // ── Step 4: Fetch final results from DB ───────────────────────────────────
    const [dbResults, setDbResults] = useState<{ user_id: string; wpm: number; accuracy: number; rank: number; status: string }[]>([]);
    const fetchAndShowResults = useCallback(async () => {
        if (!roomId) return;
        const client = getSupabaseClient();
        if (!client) return;
        const { data } = await client
            .from("arena_results")
            .select("user_id, wpm, accuracy, rank, status")
            .eq("arena_room_id", roomId)
            .order("wpm", { ascending: false });
        if (data) {
            // Deduplicate by user_id in case of stale duplicate rows
            const seen = new Set<string>();
            const unique = (data as any[]).filter(r => {
                if (seen.has(r.user_id)) return false;
                seen.add(r.user_id);
                return true;
            });
            setDbResults(unique);
        }
    }, [roomId]);

    // Subscribe to arena_results realtime so results auto-update when other players finish
    useEffect(() => {
        if (!isRealtime || !roomId || !user) return;
        const client = getSupabaseClient();
        if (!client) return;
        const resultsChannel = client
            .channel(`results-${roomId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "arena_results", filter: `arena_room_id=eq.${roomId}` },
                () => void fetchAndShowResults()
            )
            .subscribe();
        return () => { void client.removeChannel(resultsChannel); };
    }, [isRealtime, roomId, user, fetchAndShowResults]);

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
    }, [raceState, isRealtime, raceConfig]);

    // ── Fetch DB results when race finishes ────────────────────────────────────
    useEffect(() => {
        if (raceState !== "finished") return;
        void fetchAndShowResults();
        setShowResults(true);
    }, [raceState, fetchAndShowResults]);

    // ── Final DB upsert when timer ends ────────────────────────────────────────
    useEffect(() => {
        if (!isRealtime || !user || !roomId) return;
        if (raceState !== "finished") return;
        const me = playersRef.current.find(p => p.id === user.id);
        if (!me) return;
        const client = getSupabaseClient();
        if (!client) return;
        // Flush debounce and immediately persist final values
        if (upsertDebounceRef.current) clearTimeout(upsertDebounceRef.current);
        void client
            .from("arena_results")
            .update({ wpm: me.wpm, accuracy: typedChars.length > 0 ? Math.floor((me.correctChars / typedChars.length) * 100) : 100, status: "finished" } as unknown as never)
            .eq("arena_room_id", roomId)
            .eq("user_id", user.id)
            .then(() => fetchAndShowResults());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [raceState, isRealtime, user, roomId]);

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
        if (!supabaseReady || !user) return;
        const client = getSupabaseClient();
        if (!client) return;

        await client.from("typing_tests").insert({
            user_id: user.id,
            mode: raceConfig.mode,
            time: raceConfig.value,
            language_code: raceConfig.language,
            wpm: finalWpm,
            accuracy: finalAcc,
        } as any);

        // Update stats
        await (client as any).rpc("update_user_stats", { p_user_id: user.id });
    }, [supabaseReady, user, raceConfig]);

    useEffect(() => {
        if (raceState === "racing") {
            savedRef.current = false;
        } else if (raceState === "finished" && !savedRef.current) {
            savedRef.current = true;
            const me = players.find(p => p.id === currentUserId);
            if (me) {
                const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
                // Calculate accuracy from typedChars
                const acc = typedChars.length > 0 ? Math.floor((me.correctChars / typedChars.length) * 100) : 100;
                void saveResult(me.wpm, acc, timeTaken);
            }
        }
    }, [raceState, players, currentUserId, typedChars, saveResult]);

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
                return { ...player, progress, wpm, correctChars, status: isFinished ? "finished" : "playing" };
            }
            return player;
        }));

        if (isRealtime && user && roomId) {
            const acc = val.length > 0 ? Math.floor((correctChars / val.length) * 100) : 100;
            syncLive({
                progress,
                wpm,
                correctChars: Math.floor(correctChars),
                status: isFinished ? "finished" : "playing",
            });
            // Step 3: Debounced DB persist
            upsertProgress(wpm, acc, Math.floor(correctChars), isFinished ? "finished" : "playing");
        }
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

    if (roomNotFound) {
        return (
            <div className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-background gap-6 p-4">
                <div className="text-6xl">🚫</div>
                <h2 className="text-3xl font-display font-bold">Room Not Found</h2>
                <p className="text-text-dim text-center max-w-sm">
                    The room code <span className="font-mono text-accent font-bold">{roomCode}</span> does not exist or has already ended.
                </p>
                <Button onClick={onLeave} className="mt-2">
                    Back to Multiplayer
                </Button>
            </div>
        );
    }

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

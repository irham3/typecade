import { useCallback, useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { generateWords } from "@/lib/words";
import type { Player } from "../components/race";
import type { RaceConfig } from "./use-room-data";
import type { LivePlayerSyncPayload } from "./use-live-player-sync";

const palette = ["var(--color-accent)", "#38bdf8", "#f472b6", "#facc15", "#22c55e", "#a78bfa", "#fb923c"];

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

type UseRoomChannelProps = {
    roomId: string | null;
    userId: string | null;
    roomCode?: string | null;
    raceConfig: RaceConfig;
    channelRef: React.MutableRefObject<RealtimeChannel | null>;
    livePlayersRef: React.MutableRefObject<Record<string, LivePlayerSyncPayload>>;
    currentUserId: string;
    setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
    setRaceState: React.Dispatch<React.SetStateAction<"waiting" | "countdown" | "racing" | "finished">>;
    setShowResults: React.Dispatch<React.SetStateAction<boolean>>;
    setTargetText: React.Dispatch<React.SetStateAction<string>>;
    setTypedChars: React.Dispatch<React.SetStateAction<string>>;
    setTranslateY: React.Dispatch<React.SetStateAction<number>>;
    setRaceStartedAt: React.Dispatch<React.SetStateAction<number | null>>;
    finishSyncedRef: React.MutableRefObject<boolean>;
};

/**
 * Sets up and manages the Supabase Realtime channel for a room.
 *
 * KEY DESIGN DECISIONS:
 * - Player join (upsert) happens in `use-room-data` — NOT here. This hook only
 *   manages the channel subscription.
 * - Channel is (re-)created only when `roomId` or `userId` changes — both are stable
 *   after mount, so this effectively runs once per session.
 * - Cleanup (delete from DB) is triggered by `onExplicitLeave()` — a function that
 *   should be called when the user intentionally navigates away. It is NOT called on
 *   React cleanup, which would fire on every hot-reload / tab-switch.
 * - A `pagehide` listener handles true browser-close / tab-close cleanup.
 */
export function useRoomChannel({
    roomId,
    userId,
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
}: UseRoomChannelProps) {
    // Stable ref for loadPlayers so it can be called inside channel callbacks
    // without causing the channel useEffect to re-subscribe.
    const loadPlayersRef = useRef<() => void>(() => undefined);

    const loadPlayers = useCallback(() => {
        if (!roomId) return;
        const client = getSupabaseClient();
        if (!client) return;

        void client
            .from("multiplayer_room_players")
            .select("id, user_id, display_name, wpm, progress, status, correct_chars, joined_at")
            .eq("room_id", roomId)
            .order("joined_at", { ascending: true })
            .then(({ data }) => {
                if (!data || data.length === 0) return;
                const now = Date.now();
                const mapped = (data as PlayerRow[]).map((row, index) => {
                    const live = livePlayersRef.current[row.user_id] ?? null;
                    const isFinishedInDb = row.status === "finished";
                    const hasLive = Boolean(!isFinishedInDb && live && now - live.sentAt < 10_000);
                    return {
                        id: row.user_id,
                        name: row.display_name,
                        wpm: hasLive && live ? live.wpm : (row.wpm ?? 0),
                        progress: hasLive && live ? live.progress : (row.progress ?? 0),
                        color: palette[index % palette.length],
                        status: hasLive && live ? live.status : row.status,
                        correctChars: hasLive && live ? live.correctChars : (row.correct_chars ?? 0),
                    } satisfies Player;
                });

                setPlayers(prev => {
                    if (mapped.length === 0) return prev;
                    return mapped.map(serverPlayer => {
                        // 1. If DB confirms the player is finished, strictly use DB final stats.
                        if (serverPlayer.status === "finished") {
                            return serverPlayer;
                        }

                        const localPlayer = prev.find(p => p.id === serverPlayer.id);
                        if (localPlayer) {
                            // 2. Prevent UI jumping back to "playing" if DB hasn't caught up to our finished state.
                            if (localPlayer.status === "finished") {
                                return { ...serverPlayer, wpm: localPlayer.wpm, progress: localPlayer.progress, correctChars: localPlayer.correctChars, status: "finished" };
                            }
                            // 3. Keep current player's stats completely smooth from local typing interval, bypassing DB lag.
                            if (serverPlayer.id === currentUserId) {
                                return { ...serverPlayer, wpm: localPlayer.wpm, progress: localPlayer.progress, correctChars: localPlayer.correctChars };
                            }
                        }
                        
                        return serverPlayer;
                    });
                });
            });
    }, [roomId, currentUserId, livePlayersRef, setPlayers]);

    // Keep the ref in sync with the latest stable function
    useEffect(() => {
        loadPlayersRef.current = loadPlayers;
    }, [loadPlayers]);

    const applyRaceStart = useCallback((startedAt: string | null | undefined) => {
        const duration = raceConfig.mode === "time" ? raceConfig.value : 300;
        const startedMs = startedAt ? new Date(startedAt).getTime() : null;
        const raceStartMs = startedMs ? startedMs + 3000 : null;
        const now = Date.now();

        setRaceStartedAt(startedMs);

        if (!raceStartMs) {
            setRaceState("countdown");
            return;
        }

        if (now < raceStartMs) {
            setRaceState("countdown");
        } else {
            const elapsed = Math.floor((now - raceStartMs) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            if (remaining <= 0) {
                setRaceState("finished");
                setShowResults(true);
            } else {
                setRaceState("racing");
                setShowResults(false);
            }
        }
    }, [raceConfig.mode, raceConfig.value, setRaceStartedAt, setRaceState, setShowResults]);

    const applyLiveUpdate = useCallback((payload: LivePlayerSyncPayload) => {
        if (payload.userId === currentUserId) return;
        const existing = livePlayersRef.current[payload.userId];
        if (existing && payload.sentAt <= existing.sentAt) return;
        livePlayersRef.current[payload.userId] = payload;
        setPlayers(prev => prev.map(player => {
            if (player.id !== payload.userId) return player;
            return { ...player, wpm: payload.wpm, progress: payload.progress, correctChars: payload.correctChars, status: payload.status };
        }));
    }, [currentUserId, livePlayersRef, setPlayers]);

    useEffect(() => {
        if (!roomId || !userId) return;
        const client = getSupabaseClient();
        if (!client) return;

        const channel = client
            .channel(`room-${roomId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => loadPlayersRef.current()
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => loadPlayersRef.current()
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "multiplayer_room_players", filter: `room_id=eq.${roomId}` },
                () => loadPlayersRef.current()
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "multiplayer_rooms", filter: `id=eq.${roomId}` },
                (payload: { new: Record<string, string> }) => {
                    const newStatus = payload.new.status;
                    if (newStatus === "racing") {
                        const code = payload.new.code || roomCode;
                        const count = raceConfig.mode === "words" ? raceConfig.value : 300;
                        const seedSuffix = payload.new.updated_at || Date.now().toString();
                        const newText = generateWords(raceConfig.language, count, false, false, (code ?? "") + seedSuffix);
                        setTargetText(newText);
                        setTypedChars("");
                        setTranslateY(0);
                        setShowResults(false);
                        finishSyncedRef.current = false;
                        setPlayers(prev => prev.map(p => ({ ...p, status: "playing", progress: 0, wpm: 0, correctChars: 0 })));
                        applyRaceStart(payload.new.updated_at ?? null);
                    } else if (newStatus === "waiting") {
                        setRaceState("waiting");
                        setShowResults(false);
                        setRaceStartedAt(null);
                        finishSyncedRef.current = false;
                        setTypedChars("");
                        setTranslateY(0);
                        setPlayers(prev => prev.map(p => ({ ...p, status: "waiting" })));
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
                (message: { payload: unknown }) => {
                    const payload = message.payload as LivePlayerSyncPayload | null;
                    if (!payload?.userId) return;
                    applyLiveUpdate(payload);
                }
            )
            .on("presence", { event: "leave" }, ({ leftPresences }: { leftPresences: unknown[] }) => {
                const leftUserIds = (leftPresences as { userId: string }[])
                    .map(p => p.userId)
                    .filter(Boolean);
                if (leftUserIds.length === 0) return;
                const c = getSupabaseClient();
                if (!c) return;

                void c.from("multiplayer_room_players")
                    .update({ status: "finished" } as unknown as never)
                    .eq("room_id", roomId)
                    .in("user_id", leftUserIds);

                const activePresences = channel.presenceState();
                const remainingCount = Object.keys(activePresences).length;
                
                if (remainingCount === 0) {
                     void c.from("multiplayer_rooms")
                        .update({ status: "finished" } as unknown as never)
                        .eq("id", roomId);
                }
            })
            .subscribe((status: string) => {
                if (status === "SUBSCRIBED") {
                    void channel.track({ userId });
                    // Load players once after subscription is confirmed
                    loadPlayersRef.current();
                }
            });

        channelRef.current = channel;

        // Track this user in the global room-registry for lobby presence
        const registryChannel = client.channel("room-registry");
        registryChannel.subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                await registryChannel.track({ roomId, roomCode, userId });
            }
        });

        // Cleanup: only remove channels — do NOT delete from DB here.
        // DB deletion is handled by: onExplicitLeave (user action) and pagehide (browser close).
        return () => {
            channelRef.current = null;
            void client.removeChannel(channel);
            void client.removeChannel(registryChannel);
        };
    // Only re-run if roomId or userId changes — both are stable after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, userId]);

    /**
     * Call this when the user clicks "Leave" — performs DB cleanup intentionally.
     */
    const leaveRoom = useCallback(() => {
        if (!roomId || !userId) return;
        const client = getSupabaseClient();
        if (!client) return;
        
        const channelState = channelRef.current?.presenceState() || {};
        const remainingCount = Object.keys(channelState).length;
        
        if (remainingCount <= 1) {
             void client.from("multiplayer_rooms")
                .update({ status: "finished" } as unknown as never)
                .eq("id", roomId);
        }

        void client.from("multiplayer_room_players")
            .update({ status: "finished" } as unknown as never)
            .eq("room_id", roomId)
            .eq("user_id", userId);
    }, [roomId, userId, channelRef]);

    return { loadPlayers, leaveRoom };
}

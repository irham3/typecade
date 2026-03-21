import { useCallback, useRef } from "react";
import type { MutableRefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

export type LivePlayerSyncStatus = "waiting" | "playing" | "finished";

export type LivePlayerSyncPayload = {
    userId: string;
    wpm: number;
    progress: number;
    correctChars: number;
    status: LivePlayerSyncStatus;
    sentAt: number;
};

type UseLivePlayerSyncProps = {
    isRealtime: boolean;
    roomId: string | null;
    userId: string | null;
    channelRef: MutableRefObject<RealtimeChannel | null>;
    /** Minimum ms between DB writes. Default 2000ms to avoid hammering the DB. */
    dbIntervalMs?: number;
    /** Minimum ms between broadcast sends. Default 16ms (~60fps). */
    broadcastIntervalMs?: number;
};

type LivePlayerSyncInput = Omit<LivePlayerSyncPayload, "userId" | "sentAt">;

export function useLivePlayerSync({
    isRealtime,
    roomId,
    userId,
    channelRef,
    dbIntervalMs = 2000,
    broadcastIntervalMs = 16,
}: UseLivePlayerSyncProps) {
    const lastDbSyncRef = useRef(0);
    const lastBroadcastRef = useRef(0);
    const isDbSyncingRef = useRef(false);

    const syncLive = useCallback((input: LivePlayerSyncInput) => {
        if (!isRealtime || !roomId || !userId) return;
        // Never sync "waiting" status — it means player hasn't started, no data to push
        if (input.status === "waiting") return;

        const now = Date.now();
        const payload: LivePlayerSyncPayload = {
            userId,
            wpm: input.wpm,
            progress: input.progress,
            correctChars: input.correctChars,
            status: input.status,
            sentAt: now,
        };

        // Throttled broadcast (~60fps cap)
        if (channelRef.current && now - lastBroadcastRef.current >= broadcastIntervalMs) {
            lastBroadcastRef.current = now;
            void channelRef.current.send({
                type: "broadcast",
                event: "player_update",
                payload,
            });
        }

        // Throttled DB write — or always on "finished" to ensure final state is persisted. Use inflight lock.
        if ((now - lastDbSyncRef.current >= dbIntervalMs && !isDbSyncingRef.current) || input.status === "finished") {
            lastDbSyncRef.current = now;
            isDbSyncingRef.current = true;
            const client = getSupabaseClient();
            if (!client) {
                isDbSyncingRef.current = false;
                return;
            }
            void client
                .from("multiplayer_room_players")
                .update({
                    progress: Math.floor(input.progress),
                    wpm: Math.floor(input.wpm),
                    correct_chars: Math.floor(input.correctChars),
                    status: input.status,
                } as unknown as never)
                .eq("room_id", roomId)
                .eq("user_id", userId)
                .then(
                    ({ error }) => {
                        isDbSyncingRef.current = false;
                        if (error && !error.message?.includes("LockManager")) {
                            console.error("DB sync error (multiplayer_room_players):", error.message);
                        }
                    },
                    () => {
                        isDbSyncingRef.current = false;
                    }
                );
        }
    }, [broadcastIntervalMs, channelRef, dbIntervalMs, isRealtime, roomId, userId]);

    return { syncLive };
}

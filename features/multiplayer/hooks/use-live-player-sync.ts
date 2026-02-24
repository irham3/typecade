import { useCallback, useRef, type MutableRefObject } from "react";
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
    dbIntervalMs?: number;
    broadcastIntervalMs?: number;
};

type LivePlayerSyncInput = Omit<LivePlayerSyncPayload, "userId" | "sentAt">;

export function useLivePlayerSync({
    isRealtime,
    roomId,
    userId,
    channelRef,
    dbIntervalMs = 50,
    broadcastIntervalMs = 16,
}: UseLivePlayerSyncProps) {
    const lastDbSyncRef = useRef(0);
    const lastBroadcastRef = useRef(0);

    const syncLive = useCallback((input: LivePlayerSyncInput) => {
        if (!isRealtime || !roomId || !userId) return;
        const now = Date.now();
        const payload: LivePlayerSyncPayload = {
            userId,
            wpm: input.wpm,
            progress: input.progress,
            correctChars: input.correctChars,
            status: input.status,
            sentAt: now,
        };

        if (channelRef.current && now - lastBroadcastRef.current >= broadcastIntervalMs) {
            lastBroadcastRef.current = now;
            void channelRef.current.send({
                type: "broadcast",
                event: "player_update",
                payload,
            });
        }

        if (now - lastDbSyncRef.current >= dbIntervalMs || input.status === "finished") {
            lastDbSyncRef.current = now;
            const client = getSupabaseClient();
            if (!client) return;
            void client
                .from("multiplayer_room_players")
                .update({
                    progress: input.progress,
                    wpm: input.wpm,
                    correct_chars: input.correctChars,
                    status: input.status,
                } as unknown as never)
                .eq("room_id", roomId)
                .eq("user_id", userId)
                .then(({ error }) => {
                    if (error) {
                        console.error("DB sync error (multiplayer_room_players):", error.message);
                    }
                });
        }
    }, [broadcastIntervalMs, channelRef, dbIntervalMs, isRealtime, roomId, userId]);

    return { syncLive };
}

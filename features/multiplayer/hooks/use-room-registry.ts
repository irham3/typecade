import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useRoomRegistry() {
    const [activeRoomIds, setActiveRoomIds] = useState<Set<string>>(new Set());
    const [roomPlayerCounts, setRoomPlayerCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const client = getSupabaseClient();
        if (!client) return;

        const channel = client.channel("room-registry");

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const activeIds = new Set<string>();
                const roomUserSets: Record<string, Set<string>> = {};
                
                Object.values(state).forEach((presences) => {
                    (presences as Array<{
                        roomId?: string;
                        roomCode?: string;
                        userId?: string;
                    }>).forEach((p) => {
                        if (p.roomId) {
                            activeIds.add(p.roomId);
                            if (!roomUserSets[p.roomId]) roomUserSets[p.roomId] = new Set();
                            if (p.userId) roomUserSets[p.roomId].add(p.userId);
                        }
                        if (p.roomCode) {
                            activeIds.add(p.roomCode); // Cadangan
                            if (!roomUserSets[p.roomCode]) roomUserSets[p.roomCode] = new Set();
                            if (p.userId) roomUserSets[p.roomCode].add(p.userId);
                        }
                    });
                });

                const counts: Record<string, number> = {};
                Object.entries(roomUserSets).forEach(([key, set]) => {
                    counts[key] = set.size;
                });
                
                // Track newly empty rooms and mark them finished
                setActiveRoomIds((prevActive) => {
                    const emptyRooms = [...prevActive].filter(id => !activeIds.has(id));
                    if (emptyRooms.length > 0) {
                        const c = getSupabaseClient();
                        if (c) {
                            emptyRooms.forEach(roomId => {
                                // Only UUID format or length > 6 to avoid trying to update by code
                                if (roomId.length > 10) {
                                    void c.from("multiplayer_rooms")
                                        .update({ status: "finished" } as unknown as never)
                                        .eq("id", roomId);
                                }
                            });
                        }
                    }
                    return activeIds;
                });

                setRoomPlayerCounts(counts);
            })
            .subscribe();

        return () => {
            void client.removeChannel(channel);
        };
    }, []);

    return { activeRoomIds, roomPlayerCounts };
}

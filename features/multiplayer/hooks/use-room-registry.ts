import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useRoomRegistry() {
    const [activeRoomIds, setActiveRoomIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const client = getSupabaseClient();
        if (!client) return;

        const channel = client.channel("room-registry");

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const activeIds = new Set<string>();
                
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.roomId) activeIds.add(p.roomId);
                        if (p.roomCode) activeIds.add(p.roomCode); // Cadangan
                    });
                });
                
                setActiveRoomIds(activeIds);
            })
            .subscribe();

        return () => {
            void client.removeChannel(channel);
        };
    }, []);

    return { activeRoomIds };
}

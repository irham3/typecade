import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";
import { generateWords } from "@/lib/words";

export type RaceConfig = {
    mode: "time" | "words";
    value: number;
    language: "EN" | "ID";
};

type RoomDataResult = {
    roomId: string | null;
    roomNotFound: boolean;
    raceConfig: RaceConfig;
    hostId: string | null;
    targetText: string;
    initialStatus: "waiting" | "racing" | "finished";
    raceStartedAt: number | null;
    mounted: boolean;
};

const DEFAULT_CONFIG: RaceConfig = { mode: "time", value: 60, language: "EN" };

/**
 * Fetches room data ONCE on mount and resolves the room ID, config, and initial
 * text. Uses a guard ref to prevent re-fetching on re-renders.
 */
export function useRoomData({
    roomCode,
    user,
    supabaseReady,
}: {
    roomCode?: string | null;
    user: User | null;
    supabaseReady: boolean;
}) {
    const fetchedRef = useRef(false);

    const [result, setResult] = useState<RoomDataResult>({
        roomId: null,
        roomNotFound: false,
        raceConfig: DEFAULT_CONFIG,
        hostId: null,
        targetText: "",
        initialStatus: "waiting",
        raceStartedAt: null,
        mounted: false,
    });

    const resolveDisplayName = useCallback(async (uid: string): Promise<string> => {
        const client = getSupabaseClient();
        if (!client) return "Player";
        const { data } = await client
            .from("profiles")
            .select("display_name, username")
            .eq("user_id", uid)
            .maybeSingle();
        const profile = (data ?? null) as { display_name?: string; username?: string } | null;
        if (profile?.display_name) return profile.display_name;
        if (profile?.username) return profile.username;
        const u = user;
        return u?.email?.split("@")[0] ?? "Player";
    }, [user]);

    useEffect(() => {
        // Guard: only fetch once ever, even if deps change
        if (fetchedRef.current) return;

        // Offline / no-auth fallback: start a solo practice round
        if (!supabaseReady || !user || !roomCode) {
            fetchedRef.current = true;
            setResult({
                roomId: null,
                roomNotFound: false,
                raceConfig: DEFAULT_CONFIG,
                hostId: null,
                targetText: generateWords("EN", 50, false, false),
                initialStatus: "waiting",
                raceStartedAt: null,
                mounted: true,
            });
            return;
        }

        fetchedRef.current = true;

        const run = async () => {
            const client = getSupabaseClient();
            if (!client) return;

            const { data } = await client
                .from("multiplayer_rooms")
                .select("id, code, mode, mode_value, language, status, host_user_id, updated_at")
                .eq("code", roomCode)
                .single();

            if (!data) {
                setResult(prev => ({ ...prev, roomNotFound: true, mounted: true }));
                return;
            }

            const room = data as {
                id: string;
                code: string;
                mode: string;
                mode_value: number;
                language: string;
                status: string;
                host_user_id: string;
                updated_at?: string | null;
            };

            const mode = room.mode as "time" | "words";
            const value = room.mode_value;
            const language = room.language as "EN" | "ID";
            const raceConfig: RaceConfig = { mode, value, language };

            const wordCount = mode === "words" ? value : 300;
            const targetText = generateWords(language, wordCount, false, false, room.code);

            let initialStatus: "waiting" | "racing" | "finished" = "waiting";
            let raceStartedAt: number | null = null;

            if (room.status === "racing") {
                initialStatus = "racing";
                raceStartedAt = room.updated_at ? new Date(room.updated_at).getTime() : null;
            } else if (room.status === "finished") {
                initialStatus = "finished";
            }

            // Upsert current user into the room's player list
            const displayName = await resolveDisplayName(user.id);
            await client
                .from("multiplayer_room_players")
                .upsert(
                    {
                        room_id: room.id,
                        user_id: user.id,
                        display_name: displayName,
                        status: "waiting",
                        progress: 0,
                        wpm: 0,
                        correct_chars: 0,
                    } as unknown as never,
                    { onConflict: "room_id,user_id" }
                );

            setResult({
                roomId: room.id,
                roomNotFound: false,
                raceConfig,
                hostId: room.host_user_id,
                targetText,
                initialStatus,
                raceStartedAt,
                mounted: true,
            });
        };

        void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — fetch once on mount only

    return { ...result, resolveDisplayName };
}

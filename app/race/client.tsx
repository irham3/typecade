"use client";

import { MultiplayerRace } from "@/features/multiplayer/components/race";
import { useRouter, useSearchParams } from "next/navigation";

export function RaceClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomCode = searchParams.get("code") || searchParams.get("room"); // Fallback to 'room' if someone uses old link

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
            <div className="w-full flex justify-center mt-6">
                <MultiplayerRace roomCode={roomCode} onLeave={() => router.push("/multiplayer")} />
            </div>
        </main>
    );
}

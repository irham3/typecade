"use client";

import { MultiplayerLobby } from "@/features/multiplayer/components/lobby";
import { useRouter } from "next/navigation";

export function MultiplayerClient() {
    const router = useRouter();

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start relative">
            <MultiplayerLobby onJoin={(roomId) => router.push(`/race?room=${roomId}`)} />
        </main>
    );
}

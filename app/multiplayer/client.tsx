"use client";

import { MultiplayerLobby } from "@/features/multiplayer/components/lobby";
import { useRouter } from "next/navigation";

export function MultiplayerClient() {
    const router = useRouter();

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
            <div className="w-full flex justify-center mt-6">
                <MultiplayerLobby onJoin={(roomId) => router.push(`/race?room=${roomId}`)} />
            </div>
        </main>
    );
}

"use client";

import { MultiplayerRace } from "@/features/multiplayer/components/race";
import { useRouter } from "next/navigation";

export function RaceClient() {
    const router = useRouter();

    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-start pb-20 relative pt-8">
            <div className="w-full flex justify-center mt-6">
                <MultiplayerRace onLeave={() => router.push("/multiplayer")} />
            </div>
        </main>
    );
}

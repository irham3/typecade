"use client";

import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";

export function LeaderboardClient() {
    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start relative">
            <LeaderboardView />
        </main>
    );
}

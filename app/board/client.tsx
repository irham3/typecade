"use client";

import { BoardView } from "@/features/board/components/board-view";

export function BoardClient() {
    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start relative">
            <BoardView />
        </main>
    );
}

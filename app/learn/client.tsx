"use client";

import { LearnModule } from "@/features/learn/components/learn-module";

export function LearnClient() {
    return (
        <main className="w-full max-w-6xl px-6 lg:px-8 mt-6 relative">
            <div className="w-full">
                <LearnModule />
            </div>
        </main>
    );
}

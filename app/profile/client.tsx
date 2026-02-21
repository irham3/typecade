"use client";

import { ProfileView } from "@/features/profile/components/profile-view";

export function ProfileClient() {
    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-start pb-20 relative pt-8">
            <div className="w-full flex justify-center mt-6">
                <ProfileView />
            </div>
        </main>
    );
}

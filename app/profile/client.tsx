"use client";

import Link from "next/link";
import { ProfileView } from "@/features/profile/components/profile-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

export function ProfileClient() {
    const { user, isLoading, supabaseReady } = useAuth();

    if (!supabaseReady) {
        return (
            <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
                <div className="w-full max-w-xl border border-red-500/30 bg-red-500/10 text-red-200 rounded-2xl px-6 py-5 text-sm">
                    Supabase is not ready. Make sure the environment variables are set.
                </div>
            </main>
        );
    }

    if (isLoading) {
        return (
            <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
                <div className="w-full max-w-xl border border-white/10 bg-white/5 text-text-dim rounded-2xl px-6 py-5 text-sm">
                    Loading account session...
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
                <div className="w-full max-w-xl border border-white/10 bg-white/5 text-text-dim rounded-2xl px-6 py-6 text-sm flex flex-col gap-4">
                    <span>Please sign in to view your profile and stats.</span>
                    <Button asChild variant="primary" className="w-full">
                        <Link href="/auth">Sign in</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-4 sm:pt-8">
            <div className="w-full flex justify-center mt-6">
                <ProfileView />
            </div>
        </main>
    );
}

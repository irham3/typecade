"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export function OnboardingClient() {
    const router = useRouter();
    const { user, isLoading, supabaseReady } = useAuth();
    
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Redirect if not logged in, or if already has a username
    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push("/auth");
            } else if (user.user_metadata?.username) {
                router.push("/profile");
            }
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!username.trim()) {
            const t = setTimeout(() => setUsernameError(""), 0);
            return () => clearTimeout(t);
        }

        const checkUsername = async () => {
            const val = username.trim();
            if (!/^[a-zA-Z0-9_-]{3,16}$/.test(val)) {
                setUsernameError("3-16 chars, alphanumeric, _, - only.");
                return;
            }
            
            setIsCheckingUsername(true);
            const client = getSupabaseClient();
            if (client) {
                const { data } = await client
                    .from('profiles')
                    .select('username')
                    .eq('username', val)
                    .maybeSingle();
                
                if (data) {
                    setUsernameError("Username is already taken.");
                } else {
                    setUsernameError("");
                }
            }
            setIsCheckingUsername(false);
        };

        const timeout = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeout);
    }, [username]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!supabaseReady || !user) return;
        
        if (!username.trim()) {
            setError("Username cannot be empty.");
            return;
        }
        if (usernameError) {
            setError(usernameError);
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            setError("Supabase is not configured yet.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const finalUsername = username.trim();
            
            // Try to update auth metadata
            const { error: authError } = await client.auth.updateUser({
                data: { username: finalUsername, display_name: finalUsername }
            });

            if (authError) throw authError;

            // Update profiles table
            const { error: profileError } = await client.from("profiles")
                .update({
                    username: finalUsername,
                    display_name: finalUsername,
                    updated_at: new Date().toISOString()
                })
                .eq("user_id", user.id);

            if (profileError) throw profileError;


            
            // Redirect to profile
            router.push("/profile");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to set username. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (isLoading || !user) {
        return (
            <main className="flex-1 w-full max-w-5xl px-4 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-text-dim border-t-foreground rounded-full animate-spin" />
            </main>
        );
    }

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-6 sm:pt-12">
            <div className="w-full max-w-xl bg-panel-bg border border-foreground/10 rounded-2xl p-5 sm:p-8 shadow-2xl font-sans glass">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-semibold text-foreground">Complete Profile</h1>
                        <p className="text-sm text-text-dim">Choose a unique username to get started.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Username</label>
                            {usernameError && <span className="text-xs text-red-400">{usernameError}</span>}
                            {!usernameError && username && !isCheckingUsername && <span className="text-xs text-emerald-400">Available</span>}
                        </div>
                        <div className={`flex items-center gap-2 bg-foreground/5 border rounded-xl px-4 py-3 ${usernameError ? 'border-red-500/50' : 'border-foreground/5'}`}>
                            <span className="text-text-dim text-sm font-semibold">@</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="cyberninja"
                                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim font-sans"
                            />
                            {isCheckingUsername && <div className="w-4 h-4 border-2 border-text-dim border-t-foreground rounded-full animate-spin" />}
                        </div>
                        <p className="text-xs text-text-dim mt-1">This will be your public identity on leaderboards.</p>
                    </div>

                    {error && (
                        <div className="rounded-xl px-4 py-3 text-sm border border-red-500/30 bg-red-500/10 text-red-200">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={!supabaseReady || isSubmitting || !!usernameError || !username}
                    >
                        {isSubmitting ? "Saving..." : "Save and Continue"}
                    </Button>
                </form>
            </div>
        </main>
    );
}

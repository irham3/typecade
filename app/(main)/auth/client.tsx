"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { track } from "@/lib/analytics";

type StatusState = {
    tone: "idle" | "success" | "error";
    message: string;
};

export function AuthClient() {
    const router = useRouter();
    const { user, isLoading, supabaseReady } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "" });

    useEffect(() => {
        if (mode !== "sign-up" || !username.trim()) {
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
    }, [username, mode]);

    const statusStyles = useMemo(() => {
        if (status.tone === "success") {
            return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
        }
        if (status.tone === "error") {
            return "border-red-500/30 bg-red-500/10 text-red-200";
        }
        return "border-foreground/10 bg-foreground/5 text-text-dim";
    }, [status.tone]);

    const handleGoogle = async () => {
        const client = getSupabaseClient();
        if (!client) {
            setStatus({ tone: "error", message: "Supabase is not configured yet." });
            return;
        }

        track("auth_started", { method: "google", surface: "auth_page" });

        // Force redirect to production if not on localhost to avoid Supabase default behavior
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        const redirectUrl = isLocal
            ? "http://localhost:3000/profile"
            : "https://typecade.com/profile";

        await client.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectUrl
            }
        });
    };

    const handleEmailAuth = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!supabaseReady) return;
        if (cooldownSeconds > 0) {
            setStatus({ tone: "error", message: `Please wait ${cooldownSeconds}s before trying again.` });
            return;
        }
        if (!email.trim()) {
            setStatus({ tone: "error", message: "Email cannot be empty." });
            return;
        }
        if (!password.trim()) {
            setStatus({ tone: "error", message: "Password cannot be empty." });
            return;
        }
        if (mode === "sign-up") {
            if (!username.trim()) {
                setStatus({ tone: "error", message: "Username cannot be empty." });
                return;
            }
            if (usernameError) {
                setStatus({ tone: "error", message: usernameError });
                return;
            }
            if (password.trim().length < 8) {
                setStatus({ tone: "error", message: "Password must be at least 8 characters." });
                return;
            }
            if (password.trim() !== confirmPassword.trim()) {
                setStatus({ tone: "error", message: "Passwords do not match." });
                return;
            }
        }

        const client = getSupabaseClient();
        if (!client) {
            setStatus({ tone: "error", message: "Supabase is not configured yet." });
            return;
        }

        setIsSubmitting(true);
        setStatus({ tone: "idle", message: "" });
        track("auth_started", { method: "email", mode, surface: "auth_page" });

        const result = mode === "sign-in"
            ? await client.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            })
            : await client.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
                    data: {
                        username: username.trim(),
                        display_name: username.trim(),
                    },
                    emailRedirectTo: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
                        ? "http://localhost:3000/profile"
                        : "https://typecade.com/profile"
                }
            });

        const { error, data } = result;
        setIsSubmitting(false);

        if (error) {
            const errorCode = (error as { code?: string }).code;
            if (errorCode === "over_email_send_rate_limit") {
                setCooldownSeconds(60);
                setStatus({ tone: "error", message: "Email rate limit exceeded. Please wait 60s before retrying." });
                return;
            }
            setStatus({ tone: "error", message: error.message });
            return;
        }

        if (mode === "sign-in") {
            setStatus({ tone: "success", message: "Signed in successfully." });
            router.push("/profile");
            return;
        }

        if (data.session) {
            setStatus({ tone: "success", message: "Account created. Redirecting..." });
            router.push("/profile");
            return;
        }

        setStatus({ tone: "success", message: "Account created. Check your email to confirm access." });
    };

    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setCooldownSeconds((current) => Math.max(0, current - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldownSeconds]);

    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-start pb-12 sm:pb-20 relative pt-6 sm:pt-12">
            <div className="w-full max-w-xl bg-panel-bg border border-foreground/10 rounded-2xl p-5 sm:p-8 shadow-2xl font-sans glass">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-display font-semibold text-foreground">Access Typecade</h1>
                        <p className="text-sm text-text-dim">Choose your preferred sign-in method.</p>
                    </div>
                </div>

                {!supabaseReady && (
                    <div className="border border-red-500/30 bg-red-500/10 text-red-200 rounded-xl px-4 py-3 text-sm mb-6">
                        Supabase is not ready. Make sure the environment variables are set.
                    </div>
                )}

                {user && (
                    <div className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-4 text-sm mb-6 flex flex-col gap-3">
                        <span>You are signed in as {user.email ?? "active account"}.</span>
                        <Button variant="primary" onClick={() => router.push("/profile")} className="w-full">
                            Continue to Profile
                        </Button>
                    </div>
                )}

                {!user && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-foreground/10 bg-background/40 p-1">
                            <Button
                                type="button"
                                variant={mode === "sign-in" ? "active" : "ghost"}
                                className="rounded-lg"
                                onClick={() => setMode("sign-in")}
                                disabled={isSubmitting}
                            >
                                Sign in
                            </Button>
                            <Button
                                type="button"
                                variant={mode === "sign-up" ? "active" : "ghost"}
                                className="rounded-lg"
                                onClick={() => setMode("sign-up")}
                                disabled={isSubmitting}
                            >
                                Create account
                            </Button>
                        </div>

                        <Button variant="primary" onClick={handleGoogle} className="w-full" disabled={!supabaseReady || isLoading || isSubmitting || cooldownSeconds > 0}>
                            Continue with Google
                        </Button>

                        <div className="flex items-center gap-3 text-xs text-text-dim">
                            <span className="h-px flex-1 bg-foreground/10" />
                            or
                            <span className="h-px flex-1 bg-foreground/10" />
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Email</label>
                                <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/5 rounded-xl px-4 py-3">
                                    <Mail size={16} className="text-text-dim" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="name@email.com"
                                        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim font-sans"
                                    />
                                </div>
                            </div>

                            {mode === "sign-up" && (
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
                                            placeholder="johndoe"
                                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim font-sans"
                                        />
                                        {isCheckingUsername && <div className="w-4 h-4 border-2 border-text-dim border-t-foreground rounded-full animate-spin" />}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Password</label>
                                <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/5 rounded-xl px-4 py-3">
                                    <Lock size={16} className="text-text-dim" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="Enter your password"
                                        className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim font-sans"
                                    />
                                </div>
                            </div>

                            {mode === "sign-up" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-text-dim uppercase tracking-wider">Confirm password</label>
                                    <div className="flex items-center gap-2 bg-foreground/5 border border-foreground/5 rounded-xl px-4 py-3">
                                        <Lock size={16} className="text-text-dim" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder="Re-enter your password"
                                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim font-sans"
                                        />
                                    </div>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full"
                                disabled={!supabaseReady || isLoading || isSubmitting || cooldownSeconds > 0}
                            >
                                {mode === "sign-in" ? "Sign in with email" : "Create account with email"}
                            </Button>
                        </form>
                    </div>
                )}

                {status.message && (
                    <div className={`mt-6 rounded-xl px-4 py-3 text-sm border ${statusStyles}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </main>
    );
}

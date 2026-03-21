"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type StatusState = {
    tone: "idle" | "success" | "error";
    message: string;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const { user, isLoading, supabaseReady } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(0);
    const [status, setStatus] = useState<StatusState>({ tone: "idle", message: "" });

    // Reset state when opened
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (isOpen && !prevIsOpen) {
        setPrevIsOpen(isOpen);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setStatus({ tone: "idle", message: "" });
        setMode("sign-in");
    } else if (!isOpen && prevIsOpen) {
        setPrevIsOpen(isOpen);
    }

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
        if (!supabaseReady) return;
        const client = getSupabaseClient();
        if (!client) {
            setStatus({ tone: "error", message: "Supabase is not configured yet." });
            return;
        }

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
        if (!email.trim() || !password.trim()) {
            setStatus({ tone: "error", message: "Email and password are required." });
            return;
        }
        if (mode === "sign-up" && password.trim().length < 8) {
            setStatus({ tone: "error", message: "Password must be at least 8 characters." });
            return;
        }
        if (mode === "sign-up" && password.trim() !== confirmPassword.trim()) {
            setStatus({ tone: "error", message: "Passwords do not match." });
            return;
        }

        const client = getSupabaseClient();
        if (!client) return;

        setIsSubmitting(true);
        setStatus({ tone: "idle", message: "" });

        const result = mode === "sign-in"
            ? await client.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim(),
            })
            : await client.auth.signUp({
                email: email.trim(),
                password: password.trim(),
                options: {
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
                setStatus({ tone: "error", message: "Rate limit exceeded. Try again in a minute." });
                return;
            }
            setStatus({ tone: "error", message: error.message });
            return;
        }

        if (mode === "sign-in" || data.session) {
            setStatus({ tone: "success", message: "Signed in successfully." });
            onClose();
            router.push("/profile");
            return;
        }

        setStatus({ tone: "success", message: "Account created! Check your email." });
    };

    useEffect(() => {
        if (cooldownSeconds <= 0) return;
        const timer = window.setInterval(() => {
            setCooldownSeconds((current) => Math.max(0, current - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [cooldownSeconds]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                        className="w-full max-w-md bg-panel-bg border border-foreground/10 rounded-3xl p-8 shadow-2xl relative z-10 glass glow-accent"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-foreground/10 transition-colors text-text-dim hover:text-foreground"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent border border-accent/20">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold text-foreground tracking-tight">Access Typecade</h2>
                                <p className="text-sm text-text-dim">Authenticate to continue.</p>
                            </div>
                        </div>

                        {user ? (
                            <div className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 rounded-xl px-4 py-4 text-sm mb-2 flex flex-col gap-3">
                                <span>Currently signed in as {user.email ?? "active account"}.</span>
                                <Button variant="primary" onClick={() => { onClose(); router.push("/profile"); }} className="w-full font-bold">
                                    Continue to Profile
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6 relative">
                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-foreground/10 bg-black/40 p-1">
                                    <Button
                                        type="button"
                                        variant={mode === "sign-in" ? "active" : "ghost"}
                                        className="rounded-lg font-semibold"
                                        onClick={() => setMode("sign-in")}
                                        disabled={isSubmitting}
                                    >
                                        Sign in
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={mode === "sign-up" ? "active" : "ghost"}
                                        className="rounded-lg font-semibold"
                                        onClick={() => setMode("sign-up")}
                                        disabled={isSubmitting}
                                    >
                                        Register
                                    </Button>
                                </div>

                                <Button variant="outline" onClick={handleGoogle} className="w-full h-12 rounded-xl flex gap-3 bg-panel-bg hover:bg-panel-elevated" disabled={!supabaseReady || isLoading || isSubmitting || cooldownSeconds > 0}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" /><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" /><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" /><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" /></svg>
                                    Continue with Google
                                </Button>

                                <div className="flex items-center gap-3 text-xs text-text-dim">
                                    <span className="h-px flex-1 bg-foreground/10" />
                                    <span className="uppercase tracking-widest text-[10px] font-bold">Or Email</span>
                                    <span className="h-px flex-1 bg-foreground/10" />
                                </div>

                                <form onSubmit={handleEmailAuth} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-dim uppercase tracking-wider pl-1">Email</label>
                                        <div className="flex items-center gap-3 bg-panel-bg border border-foreground/5 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 rounded-xl px-4 py-3.5 transition-all">
                                            <Mail size={16} className="text-text-dim" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                placeholder="player@email.com"
                                                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim/60 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-text-dim uppercase tracking-wider pl-1">Password</label>
                                        <div className="flex items-center gap-3 bg-panel-bg border border-foreground/5 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 rounded-xl px-4 py-3.5 transition-all">
                                            <Lock size={16} className="text-text-dim" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                placeholder="Enter your password"
                                                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim/60 font-medium"
                                            />
                                        </div>
                                    </div>

                                    {mode === "sign-up" && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2 overflow-hidden">
                                            <label className="text-xs font-bold text-text-dim uppercase tracking-wider pl-1">Confirm password</label>
                                            <div className="flex items-center gap-3 bg-panel-bg border border-foreground/5 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 rounded-xl px-4 py-3.5 transition-all">
                                                <Lock size={16} className="text-text-dim" />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                                    placeholder="Re-enter your password"
                                                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-text-dim/60 font-medium"
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full h-12 rounded-xl font-bold mt-2 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                        disabled={!supabaseReady || isLoading || isSubmitting || cooldownSeconds > 0}
                                    >
                                        {isSubmitting ? "Authenticating..." : (mode === "sign-in" ? "Sign In" : "Create Account")}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {status.message && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 rounded-xl px-4 py-3.5 text-sm font-medium border text-center ${statusStyles}`}>
                                {status.message}
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

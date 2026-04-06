"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthContextValue = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    supabaseReady: boolean;
    signOut: () => Promise<void>;
};

const fallbackValue: AuthContextValue = {
    user: null,
    session: null,
    isLoading: true,
    supabaseReady: false,
    signOut: async () => { }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const initialClient = getSupabaseClient();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(!!initialClient);
    const [supabaseReady] = useState(!!initialClient);

    useEffect(() => {
        const client = getSupabaseClient();
        if (!client) {
            console.warn("Supabase configuration missing: restart your dev server if you just added `.env`.");
            return;
        }

        let active = true;

        client.auth.getSession().then(({ data }) => {
            if (!active) return;
            setSession(data.session ?? null);
            setUser(data.session?.user ?? null);
            setIsLoading(false);
        });

        const { data } = client.auth.onAuthStateChange(async (_event, nextSession) => {
            if (!active) return;
            setSession(nextSession ?? null);
            setUser(nextSession?.user ?? null);

            // Ensure every user has a default username (only on sign-in, not token refresh)
            if (_event === "SIGNED_IN") {
                const u = nextSession?.user;
                if (u && !u.user_metadata?.username) {
                    const emailPrefix = (u.email?.split("@")[0] || "user");
                    const sanitized = emailPrefix.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16);
                    const defaultUsername = sanitized + "_" + Math.floor(1000 + Math.random() * 9000);
                    const defaultDisplayName = u.user_metadata?.full_name || u.user_metadata?.name || (sanitized.charAt(0).toUpperCase() + sanitized.slice(1));

                    // Update profiles table (primary — always works with RLS)
                    await client.from("profiles")
                        .update({
                            username: defaultUsername,
                            display_name: defaultDisplayName,
                            updated_at: new Date().toISOString()
                        })
                        .eq("user_id", u.id);

                    // Try to update auth metadata (best-effort)
                    try {
                        await client.auth.updateUser({
                            data: { username: defaultUsername, display_name: defaultDisplayName }
                        });
                    } catch {
                        // Silently ignore — profiles table is already updated
                    }
                }
            }
        });

        return () => {
            active = false;
            data.subscription.unsubscribe();
        };
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        session,
        isLoading,
        supabaseReady,
        signOut: async () => {
            const client = getSupabaseClient();
            if (!client) return;
            await client.auth.signOut();
            window.location.href = "/";
        }
    }), [user, session, isLoading, supabaseReady]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext) ?? fallbackValue;
}

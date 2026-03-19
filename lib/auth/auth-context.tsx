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

        const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
            if (!active) return;
            setSession(nextSession ?? null);
            setUser(nextSession?.user ?? null);
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

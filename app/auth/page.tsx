import type { Metadata } from "next";
import { AuthClient } from "./client";

export const metadata: Metadata = {
    title: "Sign In | Typecade",
    description: "Sign in to Typecade with Google or email.",
    keywords: ["sign in", "login", "supabase", "typecade"],
    openGraph: {
        title: "Sign In | Typecade",
        description: "Sign in to Typecade with Google or email.",
        type: "website",
    },
};

export default function AuthPage() {
    return <AuthClient />;
}

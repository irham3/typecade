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
        images: [
            {
                url: "/opengraph-image.png",
                width: 1200,
                height: 630,
                alt: "Sign In | Typecade",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Sign In | Typecade",
        description: "Sign in to Typecade with Google or email.",
        images: ["/opengraph-image.png"],
    },
};

export default function AuthPage() {
    return <AuthClient />;
}

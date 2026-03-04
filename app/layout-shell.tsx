"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Aurora } from "@/components/ui/aurora";
import dynamic from "next/dynamic";

const SplashCursor = dynamic(
    () => import("@/components/ui/splash-cursor").then((mod) => mod.SplashCursor),
    { ssr: false }
);

export function LayoutShell({ children }: { children: React.ReactNode }) {
    return (
        <Aurora className="min-h-screen flex flex-col items-center justify-between w-full">
            <SplashCursor />
            <Navbar />
            <div className="relative z-10 w-full flex-1 flex flex-col items-center">
                {children}
            </div>
            <Footer />
        </Aurora>
    );
}

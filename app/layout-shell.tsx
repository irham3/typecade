"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DarkVeil } from "@/components/ui/dark-veil";
import { LightRays } from "@/components/ui/light-rays";
import { ClickSpark } from "@/components/ui/click-spark";
import { useStore } from "@/lib/store";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const theme = useStore((state) => state.theme);

    // Sync theme to document element
    useEffect(() => {
        if (typeof window === "undefined") return;
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "light") {
            document.documentElement.classList.remove("dark");
        } else {
            document.documentElement.classList.add("dark");
        }
    }, [theme]);

    // Full-screen immersive mode for lesson practice pages (e.g. /learn/home-row/intro-f-and-j)
    const isLessonPage = /^\/learn\/[^/]+\/[^/]+$/.test(pathname);

    if (isLessonPage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center w-full relative z-0">
                <DarkVeil />
                <LightRays />
                <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-between w-full relative z-0">
            <DarkVeil />
            <LightRays />
            <ClickSpark />

            <Navbar />
            <div className="relative z-10 w-full flex-1 flex flex-col items-center">
                {children}
            </div>
            <Footer />
        </div>
    );
}

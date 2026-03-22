"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DarkVeil } from "@/components/ui/dark-veil";
import { LightRays } from "@/components/ui/light-rays";
import { ClickSpark } from "@/components/ui/click-spark";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { ThemeModal } from "@/components/theme-modal";
import { AudioController } from "@/components/audio-controller";

export function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const theme = useStore(state => state.theme);
    const showAnimations = useStore(state => state.showAnimations);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // Full-screen immersive mode for lesson practice pages (e.g. /learn/home-row/intro-f-and-j)
    const isLessonPage = /^\/learn\/[^/]+\/[^/]+$/.test(pathname);

    if (isLessonPage) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center w-full relative z-0">
                {showAnimations && (
                    <>
                        <DarkVeil />
                        <LightRays />
                    </>
                )}
                <div className="relative w-full flex-1 flex flex-col items-center justify-center">
                    {children}
                </div>
                <ThemeModal />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-between w-full relative z-0">
            <AudioController />
            {showAnimations && (
                <>
                    <DarkVeil />
                    <LightRays />
                </>
            )}
            
            {/* Subtle Edge Scanlines & Vignette */}
            <div 
                className="pointer-events-none fixed inset-0 z-40 opacity-30 select-none"
                style={{
                    background: "linear-gradient(rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.2) 50%)",
                    backgroundSize: "100% 4px",
                    maskImage: "radial-gradient(circle at center, transparent 30%, black 100%)",
                    WebkitMaskImage: "radial-gradient(circle at center, transparent 30%, black 100%)",
                }}
            />
            <div 
                className="pointer-events-none fixed inset-0 z-40 select-none"
                style={{
                    boxShadow: "inset 0 0 120px rgba(0,0,0,0.6)",
                }}
            />

            <ClickSpark />

            <Navbar />
            <div className="w-full flex-1 flex flex-col items-center relative">
                {children}
            </div>
            <Footer />
            <ThemeModal />
        </div>
    );
}

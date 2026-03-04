"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { DarkVeil } from "@/components/ui/dark-veil";
import { LightRays } from "@/components/ui/light-rays";
import { ClickSpark } from "@/components/ui/click-spark";

export function LayoutShell({ children }: { children: React.ReactNode }) {
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

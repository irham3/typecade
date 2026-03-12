"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function LightRays({ className }: { className?: string }) {
    // Custom Light Rays modeled after the React Bits vibe, built using highly performant CSS transformations,
    // avoiding heavy WebGL loops for better laptop battery life during typing.
    // Specially tuned with Typecade's --accent and --accent-secondary

    const theme = useStore(state => state.theme);
    const isLightTheme = theme === 'light';

    return (
        <div className={cn("fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center", className)}>
            {/* The grand container for the rays, fading out softly via mask-image */}
            <div
                className={cn(
                    "absolute top-[-10%] w-[150%] h-[150%] flex justify-center opacity-60",
                    isLightTheme ? "mix-blend-multiply" : "mix-blend-screen"
                )}
                style={{
                    maskImage: 'linear-gradient(to bottom, black 10%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 60%)'
                }}
            >
                {/* Ray 1 - Left angled */}
                <div className="absolute top-0 origin-top h-full w-[40vw] min-w-[300px] blur-3xl -rotate-20 animate-ray-1"
                    style={{ background: 'linear-gradient(to bottom, rgba(var(--accent-rgb), 0.4), transparent)' }} />

                {/* Ray 2 - Right angled (teal/secondary) */}
                <div className="absolute top-0 origin-top h-full w-[35vw] min-w-[250px] blur-3xl rotate-15 animate-ray-2"
                    style={{ background: 'linear-gradient(to bottom, rgba(var(--accent-secondary-rgb), 0.25), transparent)' }} />

                {/* Ray 3 - Center wide soft ray */}
                <div className="absolute top-0 origin-top h-full w-[60vw] min-w-[500px] blur-[80px] rotate-2 animate-ray-3"
                    style={{ background: 'linear-gradient(to bottom, rgba(var(--accent-rgb), 0.3), transparent)' }} />
            </div>
        </div>
    );
}

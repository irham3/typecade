"use client";

import { cn } from "@/lib/utils";

export function LightRays({ className }: { className?: string }) {
    // Custom Light Rays modeled after the React Bits vibe, built using highly performant CSS transformations,
    // avoiding heavy WebGL loops for better laptop battery life during typing.
    // Specially tuned with Typecade's --accent and --accent-secondary

    return (
        <div className={cn("fixed inset-0 pointer-events-none z-0 overflow-hidden flex justify-center", className)}>
            {/* The grand container for the rays, fading out softly via mask-image */}
            <div
                className="absolute top-[-10%] w-[150%] h-[150%] flex justify-center mix-blend-screen opacity-60"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 10%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 60%)'
                }}
            >
                {/* Ray 1 - Left angled */}
                <div className="absolute top-0 origin-top h-full w-[40vw] min-w-[300px] bg-linear-to-b from-accent/40 to-transparent blur-3xl -rotate-20 animate-ray-1" />

                {/* Ray 2 - Right angled (teal/secondary) */}
                <div className="absolute top-0 origin-top h-full w-[35vw] min-w-[250px] bg-linear-to-b from-accent-secondary/25 to-transparent blur-3xl rotate-15 animate-ray-2" />

                {/* Ray 3 - Center wide soft ray */}
                <div className="absolute top-0 origin-top h-full w-[60vw] min-w-[500px] bg-linear-to-b from-accent/30 to-transparent blur-[80px] rotate-2 animate-ray-3" />
            </div>
        </div>
    );
}

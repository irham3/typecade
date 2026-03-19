"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function DarkVeil({ className }: { className?: string }) {
    const theme = useStore(state => state.theme);
    const isLightTheme = theme === 'light';

    return (
        <div className={cn("fixed inset-0 pointer-events-none z-[-1] overflow-hidden", className)}>

            {/* Base void color */}
            <div className="absolute inset-0 bg-background" />

            {/* Animating gradient veils that slowly drift */}
            <div className={cn("absolute inset-[-50%] opacity-50 animate-veil-drift", isLightTheme ? "mix-blend-multiply" : "mix-blend-screen")}
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(var(--accent-rgb), 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 0%, rgba(var(--accent-secondary-rgb), 0.05) 0%, transparent 40%)',
                    filter: 'blur(60px)'
                }}
            />

            <div className={cn("absolute inset-[-50%] opacity-30 animate-veil-drift-reverse", isLightTheme ? "mix-blend-multiply" : "mix-blend-screen")}
                style={{
                    backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(var(--accent-rgb), 0.08) 0%, transparent 40%)',
                    filter: 'blur(80px)'
                }}
            />

            {/* Grain/Noise overlay to simulate the dense 'Veil' texturing */}
            <div
                className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
                style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '128px 128px'
                }}
            />
        </div>
    );
}

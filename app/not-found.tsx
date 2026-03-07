"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Unused imports from lucide-react removed
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    const router = useRouter();
    const [typedSub, setTypedSub] = useState("");

    useEffect(() => {
        let i = 0;
        const targetSub = "Page_Not_Found";
        let loopWait = 0;

        const typeInterval = setInterval(() => {
            if (loopWait < 0) {
                loopWait++;
                return;
            }

            if (i < targetSub.length) {
                setTypedSub(targetSub.slice(0, i + 1));
                i++;
            } else {
                loopWait++;
                // Wait 12 ticks (~2.4 seconds) after finishing before restarting
                if (loopWait > 12) {
                    setTypedSub("");
                    i = 0; // reset index to start of sub text
                    loopWait = -3; // Wait 3 ticks (~600ms) empty before re-typing
                }
            }
        }, 200); // Slower, more readable typing pace

        return () => clearInterval(typeInterval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") router.push("/");
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router]);

    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-center pb-20 relative pt-8 min-h-[65vh]">
            <div className="flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center relative"
                >
                    {/* Glowing effect behind */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-accent/20 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex items-center justify-center gap-3 mb-4 relative z-10 min-w-[180px] md:min-w-[220px]">
                        <span className="text-7xl md:text-8xl font-display font-semibold text-white tracking-tight drop-shadow-md w-[3ch] text-right">
                            404
                        </span>
                        <div className="w-[4px] h-[60px] md:h-[75px] bg-accent rounded-full animate-caret-blink drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    </div>

                    <h2 className="text-sm md:text-base font-mono text-text-dim mb-10 tracking-widest uppercase h-[24px]">
                        {typedSub}
                    </h2>

                    <Button asChild variant="primary" className="px-8 py-5 rounded-xl font-medium text-white hover:bg-accent/90 transition-all hover:scale-105">
                        <Link href="/">
                            Return to Practice
                        </Link>
                    </Button>

                    <p className="text-text-dim/40 text-[11px] font-mono mt-12 flex items-center gap-2">
                        <span>Press</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40">
                            Esc
                        </kbd>
                        <span>to go back</span>
                    </p>
                </motion.div>
            </div>
        </main>
    );
}


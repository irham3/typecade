"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    const router = useRouter();

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

                {/* Glowing 404 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-8"
                >
                    <span className="text-[10rem] font-display font-bold text-white/3 leading-none select-none">404</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-mono text-text-dim tracking-widest uppercase">Page not found</span>
                    </div>
                </motion.div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-text-dim text-base max-w-md leading-relaxed"
                >
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Check the URL or head back and start typing.
                </motion.p>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex items-center gap-3 mt-10"
                >
                    <Button asChild variant="primary" className="gap-2 px-6 py-3">
                        <Link href="/">
                            <Home size={16} />
                            Back to Home
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className="gap-2 px-5 py-3 text-text-dim">
                        <Link href="/leaderboard">
                            Rankings
                            <ArrowRight size={14} />
                        </Link>
                    </Button>
                </motion.div>

                {/* Shortcut hint */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-text-dim/30 text-xs font-mono mt-8 flex items-center gap-1.5"
                >
                    press
                    <kbd className="px-1.5 py-0.5 rounded border border-white/8 bg-white/3 text-text-dim/40 text-[11px] font-mono">
                        Esc
                    </kbd>
                    to return
                </motion.p>

            </div>
        </main>
    );
}


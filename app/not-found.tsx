"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, ArrowRight } from "lucide-react";
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

                {/* Error code */}
                <p className="font-mono text-sm text-text-dim tracking-widest uppercase mb-8">
                    Error 404
                </p>

                {/* Title */}
                <h1 className="text-5xl lg:text-7xl font-display font-bold text-foreground mb-5 tracking-tight">
                    Page not found
                </h1>

                {/* Description */}
                <p className="text-text-dim text-base max-w-md leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    Check the URL or head back and start typing.
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-10">
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
                </div>

                {/* Shortcut hint */}
                <p className="text-text-dim/40 text-xs font-mono mt-8 flex items-center gap-1.5">
                    press
                    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/3 text-text-dim/50 text-[11px] font-mono">
                        Esc
                    </kbd>
                    to return
                </p>

            </div>
        </main>
    );
}

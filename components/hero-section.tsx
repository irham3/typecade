"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Keyboard, Users, Trophy, GraduationCap, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typewriter } from "@/components/ui/typewriter";
import { CountUp } from "@/components/ui/count-up";

interface HeroSectionProps {
    onDismiss: () => void;
}

/* ── Animated WPM Display ── */
function AnimatedWpmCounter() {
    const [wpm, setWpm] = useState(0);
    const targetWpm = 127;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Simulate typing WPM climbing up
        let current = 0;
        const step = () => {
            current += Math.floor(Math.random() * 8) + 3;
            if (current >= targetWpm) {
                current = targetWpm;
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
            setWpm(current);
        };
        intervalRef.current = setInterval(step, 60);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <div className="flex flex-col items-center">
            <motion.div
                className="text-[6rem] sm:text-[8rem] md:text-[10rem] font-mono font-bold leading-none tracking-tighter tabular-nums"
                style={{
                    background: "linear-gradient(135deg, var(--foreground) 30%, var(--accent) 70%, var(--accent-secondary) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                {wpm}
            </motion.div>
            <motion.span
                className="text-xs sm:text-sm font-mono text-accent uppercase tracking-[0.3em] font-semibold -mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >
                words per minute
            </motion.span>
        </div>
    );
}

/* ── Feature pill ── */
function FeaturePill({
    icon: Icon, label, delay,
}: { icon: React.ElementType; label: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass border border-white/5 text-sm text-text-dim hover:text-foreground hover:border-accent/20 transition-all duration-300 group cursor-default"
        >
            <Icon size={15} className="text-accent group-hover:scale-110 transition-transform" />
            <span className="font-medium">{label}</span>
        </motion.div>
    );
}

export function HeroSection({ onDismiss }: HeroSectionProps) {
    return (
        <main className="flex-1 w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-center relative py-8 sm:py-12 min-h-[70vh]">
            {/* Decorative glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/8 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[200px] bg-accent-secondary/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10 gap-6 sm:gap-8">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-xs font-mono text-accent tracking-wider uppercase"
                >
                    <Zap size={12} className="fill-accent" />
                    Free &amp; Open Source
                </motion.div>

                {/* Animated WPM hero */}
                <AnimatedWpmCounter />

                {/* Tagline with typewriter */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex flex-col items-center gap-3"
                >
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight tracking-tight">
                        Type faster.{" "}
                        <span className="text-accent">Think clearer.</span>
                    </h1>
                    <p className="text-base sm:text-lg text-text-dim max-w-md leading-relaxed">
                        The modern typing platform to{" "}
                        <Typewriter
                            words={["boost your speed", "sharpen accuracy", "compete with friends", "track your progress", "master touch typing"]}
                            typingSpeed={60}
                            deletingSpeed={35}
                            pauseDuration={1800}
                            className="text-foreground font-medium"
                        />
                    </p>
                </motion.div>

                {/* Live community stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-3 sm:gap-6 text-text-dim text-xs sm:text-sm font-mono"
                >
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-foreground font-bold tabular-nums">
                            <CountUp end={12847} duration={2000} delay={700} />
                        </span>
                        <span className="opacity-60">tests taken</span>
                    </div>
                    <span className="opacity-20">•</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-foreground font-bold tabular-nums">
                            <CountUp end={68} duration={1500} delay={900} />
                        </span>
                        <span className="opacity-60">avg WPM</span>
                    </div>
                    <span className="opacity-20">•</span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-foreground font-bold tabular-nums">
                            <CountUp end={2} duration={1000} delay={1100} />
                        </span>
                        <span className="opacity-60">languages</span>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="flex flex-col items-center gap-4 mt-2"
                >
                    <Button
                        variant="primary"
                        onClick={onDismiss}
                        className="px-8 sm:px-10 py-6 sm:py-7 text-base sm:text-lg font-bold rounded-2xl gap-3 group shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all"
                    >
                        Start Typing
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <span className="text-text-dim/50 text-[11px] font-mono flex items-center gap-2">
                        Press{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 text-[10px]">
                            Space
                        </kbd>{" "}
                        to start
                    </span>
                </motion.div>

                {/* Feature pills */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6"
                >
                    <FeaturePill icon={Keyboard} label="Multiple Modes" delay={1.2} />
                    <FeaturePill icon={Users} label="Multiplayer Racing" delay={1.3} />
                    <FeaturePill icon={GraduationCap} label="Guided Lessons" delay={1.4} />
                    <FeaturePill icon={Trophy} label="Global Leaderboard" delay={1.5} />
                </motion.div>
            </div>
        </main>
    );
}

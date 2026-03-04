"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Typewriter } from "@/components/ui/typewriter";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const TypingView = dynamic(
    () => import("@/features/typing/components/typing-area").then((mod) => mod.TypingView),
    { ssr: false }
);

const modeOptions = ["Words", "Quote", "Time", "Custom"] as const;
type ModeOption = (typeof modeOptions)[number];

const subOptions: Record<string, string[]> = {
    Words: ["10", "25", "50", "100"],
    Time: ["15s", "30s", "60s", "120s"],
    Quote: ["Easy", "Medium", "Hard"],
    Custom: ["Easy", "Medium", "Hard"],
};

export function HomeClient() {
    const [activeTab, setActiveTab] = useState<ModeOption>("Time");
    const [subOption, setSubOption] = useState("60s");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const language = useStore(state => state.language);
    const setLanguage = useStore(state => state.setLanguage);
    const punctuation = useStore(state => state.punctuation);
    const setPunctuation = useStore(state => state.setPunctuation);
    const numbers = useStore(state => state.numbers);
    const setNumbers = useStore(state => state.setNumbers);

    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-start pb-20 relative pt-6">

            {/* ── Hero tagline ── */}
            <div className="text-center mb-8">
                <h1 className="text-sm font-mono text-text-dim tracking-widest uppercase mb-2">
                    Type faster. Think clearer.
                </h1>
                <div className="text-lg sm:text-xl font-display font-semibold text-foreground/60">
                    Master your{" "}
                    <Typewriter
                        words={["speed", "accuracy", "rhythm", "flow", "consistency"]}
                        typingSpeed={90}
                        deletingSpeed={60}
                        pauseDuration={2500}
                        className="text-accent"
                    />
                </div>
            </div>

            {/* ── Settings Row ── */}
            <div className="w-full flex flex-wrap items-center justify-center gap-3 mb-4">
                {/* Mode selector using SegmentedControl */}
                <SegmentedControl
                    options={[...modeOptions]}
                    value={activeTab}
                    onChange={(val) => {
                        setActiveTab(val as ModeOption);
                        setSubOption(
                            val === "Words" ? "50"
                                : val === "Time" ? "60s"
                                    : "Medium"
                        );
                    }}
                />

                <span className="text-white/6 mx-0.5 select-none hidden sm:block">|</span>

                {/* Sub-options using SegmentedControl with gradient variant */}
                <SegmentedControl
                    options={subOptions[activeTab]}
                    value={subOption}
                    onChange={setSubOption}
                    variant="gradient"
                    size="sm"
                />

                <span className="text-white/6 mx-0.5 select-none hidden sm:block">|</span>

                {/* Toggles */}
                <div className="flex items-center gap-1.5 text-sm font-sans">
                    <Button
                        variant={punctuation ? "activeGradient" : "ghost"}
                        className="px-3 py-1.5 text-xs"
                        onClick={() => setPunctuation(!punctuation)}
                    >
                        @ punctuation
                    </Button>
                    <Button
                        variant={numbers ? "activeGradient" : "ghost"}
                        className="px-3 py-1.5 text-xs"
                        onClick={() => setNumbers(!numbers)}
                    >
                        # numbers
                    </Button>
                </div>

                <span className="text-white/6 mx-0.5 select-none hidden sm:block">|</span>

                {/* Language */}
                <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
                        >
                            <Globe size={13} className="opacity-50" />
                            <span>{language}</span>
                            <ChevronDown size={11} className={`opacity-30 transition-transform duration-300 ${langDropdownOpen ? "rotate-180" : ""}`} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {[
                            { code: "EN", label: "English" },
                            { code: "ID", label: "Indonesia" }
                        ].map(lang => (
                            <DropdownMenuItem
                                key={lang.code}
                                active={language === lang.code}
                                onClick={() => setLanguage(lang.code as "EN" | "ID")}
                                className="justify-between min-w-30"
                            >
                                {lang.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* ── Typing Area ── */}
            <AnimatePresence>
                <div className="w-full flex justify-center mt-2 z-0">
                    <TypingView activeTab={activeTab} subOption={subOption} />
                </div>
            </AnimatePresence>
        </main>
    );
}

"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// Features dynamically imported to prevent hydration errors from random text generation
const TypingView = dynamic(
    () => import("@/features/typing/components/typing-area").then((mod) => mod.TypingView),
    { ssr: false }
);

export function HomeClient() {
    const [activeTab, setActiveTab] = useState("Time");
    const [subOption, setSubOption] = useState("60s");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const language = useStore(state => state.language);
    const setLanguage = useStore(state => state.setLanguage);
    const punctuation = useStore(state => state.punctuation);
    const setPunctuation = useStore(state => state.setPunctuation);
    const numbers = useStore(state => state.numbers);
    const setNumbers = useStore(state => state.setNumbers);

    const modeOptions = ["Words", "Quote", "Time", "Custom"];

    const subOptions: Record<string, string[]> = {
        Words: ["10", "25", "50", "100"],
        Time: ["15s", "30s", "60s", "120s"],
        Quote: ["Easy", "Medium", "Hard"],
        Custom: ["Easy", "Medium", "Hard"],
    };

    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-start pb-20 relative pt-10">
            {/* ── Settings Row ── */}
            <div className="w-full flex flex-wrap items-center justify-center gap-x-1 gap-y-2 mb-2">
                {/* Mode selector */}
                <div className="flex items-center gap-1 text-sm font-sans">
                    {modeOptions.map(tab => (
                        <Button
                            key={tab}
                            variant={activeTab === tab ? "active" : "ghost"}
                            className="px-3.5 py-1.5 text-sm"
                            onClick={() => {
                                setActiveTab(tab);
                                setSubOption(
                                    tab === "Words" ? "50"
                                        : tab === "Time" ? "60s"
                                            : "Medium"
                                );
                            }}
                        >
                            {tab}
                        </Button>
                    ))}
                </div>

                <span className="text-white/10 mx-1.5 select-none">|</span>

                {/* Sub-options */}
                <div className="flex items-center gap-1 text-sm font-sans">
                    {subOptions[activeTab]?.map(opt => (
                        <Button
                            key={opt}
                            variant={subOption === opt ? "activeGradient" : "ghost"}
                            className="px-3 py-1.5 text-sm"
                            onClick={() => setSubOption(opt)}
                        >
                            {opt}
                        </Button>
                    ))}
                </div>

                <span className="text-white/10 mx-1.5 select-none">|</span>

                {/* Toggles */}
                <div className="flex items-center gap-1 text-sm font-sans">
                    <Button
                        variant={punctuation ? "activeGradient" : "ghost"}
                        className="px-3 py-1.5 text-sm"
                        onClick={() => setPunctuation(!punctuation)}
                    >
                        @ punctuation
                    </Button>
                    <Button
                        variant={numbers ? "activeGradient" : "ghost"}
                        className="px-3 py-1.5 text-sm"
                        onClick={() => setNumbers(!numbers)}
                    >
                        # numbers
                    </Button>
                </div>

                <span className="text-white/10 mx-1.5 select-none">|</span>

                {/* Language */}
                <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
                        >
                            <Globe size={14} className="opacity-60" />
                            <span>{language}</span>
                            <ChevronDown size={12} className={`opacity-40 transition-transform duration-300 ${langDropdownOpen ? "rotate-180" : ""}`} />
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

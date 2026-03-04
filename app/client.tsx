"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
        <main className="flex-1 w-full max-w-6xl px-6 lg:px-8 flex flex-col items-center justify-center pb-16 relative">

            {/* ── Settings toolbar — compact, secondary to navbar ── */}
            <motion.div layout className="flex items-center justify-center gap-2 mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <motion.div layout>
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
                        className="bg-transparent border-transparent p-0"
                    />
                </motion.div>

                <motion.div layout className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />

                <motion.div layout>
                    <SegmentedControl
                        options={subOptions[activeTab]}
                        value={subOption}
                        onChange={setSubOption}
                        variant="gradient"
                        className="bg-transparent border-transparent p-0"
                    />
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {(activeTab === "Words" || activeTab === "Time") && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                        >
                            <div className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />

                            <div className="flex items-center gap-1 shrink-0">
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
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div layout className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />

                <motion.div layout>
                    <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm shrink-0"
                            >
                                <Globe size={14} className="opacity-50" />
                                <span>{language}</span>
                                <ChevronDown size={12} className={`opacity-30 transition-transform duration-300 ${langDropdownOpen ? "rotate-180" : ""}`} />
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
                </motion.div>
            </motion.div>

            {/* ── Typing Area — contained with accent indicator ── */}
            <div className="typing-panel w-full px-6 sm:px-8 py-6">
                <AnimatePresence>
                    <TypingView activeTab={activeTab} subOption={subOption} />
                </AnimatePresence>
            </div>

        </main>
    );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

    return (
        <main className="flex-1 w-full max-w-6xl px-8 flex flex-col items-center justify-start pb-20 relative pt-12">
            {/* Settings Panel */}
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-wrap items-center bg-panel-bg/60 backdrop-blur-xl border border-border-dim rounded-2xl p-2 mt-4 text-sm font-sans text-text-dim shadow-2xl relative z-10"
                >
                    <div className="flex px-3 space-x-2 border-r border-white/5 pr-4 border-dashed">
                        {["Words", "Quote", "Time", "Custom"].map(tab => (
                            <Button
                                key={tab}
                                variant={activeTab === tab ? "active" : "ghost"}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSubOption(tab === "Words" ? "50" : tab === "Time" ? "60s" : "Medium");
                                }}
                            >
                                {tab}
                            </Button>
                        ))}
                    </div>

                    <div className="flex px-4 space-x-2 border-r border-white/5 pr-4 border-dashed">
                        {activeTab === "Time" && ["15s", "30s", "60s", "120s"].map(opt => (
                            <Button
                                key={opt}
                                variant={subOption === opt ? "activeGradient" : "ghost"}
                                onClick={() => setSubOption(opt)}
                            >
                                {opt}
                            </Button>
                        ))}
                        {activeTab === "Words" && ["10", "25", "50", "100"].map(opt => (
                            <Button
                                key={opt}
                                variant={subOption === opt ? "activeGradient" : "ghost"}
                                onClick={() => setSubOption(opt)}
                            >
                                {opt}
                            </Button>
                        ))}
                        {(activeTab === "Quote" || activeTab === "Custom") && ["Easy", "Medium", "Hard"].map(opt => (
                            <Button
                                key={opt}
                                variant={subOption === opt ? "activeGradient" : "ghost"}
                                onClick={() => setSubOption(opt)}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>

                    <div className="relative flex px-3 space-x-2 border-l border-white/5 pl-4 border-dashed">
                        <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2"
                                >
                                    <Globe size={16} className="opacity-70" />
                                    <span>{language}</span>
                                    <ChevronDown size={14} className={`opacity-50 transition-transform duration-300 ${langDropdownOpen ? "rotate-180" : ""}`} />
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
                                        className="justify-between min-w-[120px]"
                                    >
                                        {lang.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex px-3 space-x-2 border-l border-white/5 pl-4 border-dashed">
                        <Button
                            variant={punctuation ? "activeGradient" : "ghost"}
                            onClick={() => setPunctuation(!punctuation)}
                        >
                            @ Punctuation
                        </Button>
                        <Button
                            variant={numbers ? "activeGradient" : "ghost"}
                            onClick={() => setNumbers(!numbers)}
                        >
                            # Numbers
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="w-full flex justify-center mt-2 z-0">
                <TypingView activeTab={activeTab} subOption={subOption} />
            </div>
        </main>
    );
}

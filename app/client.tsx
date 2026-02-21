"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { Globe, ChevronDown } from "lucide-react";

// Features dynamically imported to prevent hydration errors from random text generation
const TypingView = dynamic(
    () => import("@/features/typing/components/typing-area").then((mod) => mod.TypingView),
    { ssr: false }
);

export function HomeClient() {
    const [activeTab, setActiveTab] = useState("Time");
    const [subOption, setSubOption] = useState("60s");
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSubOption(tab === "Words" ? "50" : tab === "Time" ? "60s" : "Medium");
                                }}
                                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${activeTab === tab
                                    ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                    : "hover:text-white hover:bg-white/5 hover:scale-105"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex px-4 space-x-2 border-r border-white/5 pr-4 border-dashed">
                        {activeTab === "Time" && ["15s", "30s", "60s", "120s"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSubOption(opt)}
                                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${subOption === opt ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                        {activeTab === "Words" && ["10", "25", "50", "100"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSubOption(opt)}
                                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${subOption === opt ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                        {(activeTab === "Quote" || activeTab === "Custom") && ["Easy", "Medium", "Hard"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setSubOption(opt)}
                                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${subOption === opt ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex px-3 space-x-2 border-l border-white/5 pl-4 border-dashed" ref={dropdownRef}>
                        <button
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 font-medium hover:bg-white/5 hover:text-white"
                        >
                            <Globe size={16} className="opacity-70" />
                            <span>{language}</span>
                            <ChevronDown size={14} className={`opacity-50 transition-transform duration-300 ${langDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                            {langDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-4 mt-2 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 min-w-[120px]"
                                >
                                    {[
                                        { code: "EN", label: "English" },
                                        { code: "ID", label: "Indonesia" }
                                    ].map(lang => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code as "EN" | "ID");
                                                setLangDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${language === lang.code ? "bg-accent/10 text-accent font-bold" : "hover:bg-white/5 text-text-dim hover:text-white"}`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex px-3 space-x-2 border-l border-white/5 pl-4 border-dashed">
                        <button
                            onClick={() => setPunctuation(!punctuation)}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${punctuation ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "hover:text-white hover:bg-white/5"}`}
                        >
                            @ Punctuation
                        </button>
                        <button
                            onClick={() => setNumbers(!numbers)}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${numbers ? "text-accent bg-accent/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "hover:text-white hover:bg-white/5"}`}
                        >
                            # Numbers
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="w-full flex justify-center mt-2 z-0">
                <TypingView activeTab={activeTab} subOption={subOption} />
            </div>
        </main>
    );
}

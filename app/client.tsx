"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";

// Features dynamically imported to prevent hydration errors from random text generation
const TypingView = dynamic(
    () => import("@/features/typing/components/typing-area").then((mod) => mod.TypingView),
    { ssr: false }
);

export function HomeClient() {
    const [activeTab, setActiveTab] = useState("Time");
    const [subOption, setSubOption] = useState("60s");

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

                    <div className="flex px-3 space-x-2 border-l border-white/5 pl-4 border-dashed">
                        <button
                            onClick={() => setLanguage("ID")}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${language === "ID" ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" : "hover:text-white hover:bg-white/5"}`}
                        >
                            ID
                        </button>
                        <button
                            onClick={() => setLanguage("EN")}
                            className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium ${language === "EN" ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" : "hover:text-white hover:bg-white/5"}`}
                        >
                            EN
                        </button>
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

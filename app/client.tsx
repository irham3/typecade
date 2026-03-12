"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore, ModeOption } from "@/lib/store";
import { Globe, ChevronDown, PenLine, Settings, X, ChevronRight, Keyboard } from "lucide-react";
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

const ClassicTypingView = dynamic(
    () => import("@/features/typing/components/classic-typing-area").then((mod) => mod.ClassicTypingView),
    { ssr: false }
);

const modeOptions = ["Quote", "Words", "Time", "Custom"] as const;

const subOptions: Record<string, string[]> = {
    Quote: ["Easy", "Medium", "Hard"],
    Words: ["10", "25", "50", "100", "Custom"],
    Time: ["15s", "30s", "60s", "120s", "Custom"],
    Custom: [],
};

export function HomeClient() {
    const activeTab = useStore(state => state.activeTab);
    const setActiveTab = useStore(state => state.setActiveTab);
    const subOption = useStore(state => state.subOption);
    const setSubOption = useStore(state => state.setSubOption);
    const customWordLimit = useStore(state => state.customWordLimit);
    const setCustomWordLimit = useStore(state => state.setCustomWordLimit);
    const customTimeLimit = useStore(state => state.customTimeLimit);
    const setCustomTimeLimit = useStore(state => state.setCustomTimeLimit);
    const customText = useStore(state => state.customText);
    const setCustomText = useStore(state => state.setCustomText);
    const customShuffle = useStore(state => state.customShuffle);
    const setCustomShuffle = useStore(state => state.setCustomShuffle);

    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const [styleDesktopOpen, setStyleDesktopOpen] = useState(false);
    const [styleMobileOpen, setStyleMobileOpen] = useState(false);

    // Custom limit states
    const [isCustomLimitModalOpen, setIsCustomLimitModalOpen] = useState(false);
    const [customLimitDraft, setCustomLimitDraft] = useState("");

    // Custom Text state
    // Modal states
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customTextDraft, setCustomTextDraft] = useState("");

    const language = useStore(state => state.language);
    const setLanguage = useStore(state => state.setLanguage);
    const punctuation = useStore(state => state.punctuation);
    const setPunctuation = useStore(state => state.setPunctuation);
    const numbers = useStore(state => state.numbers);
    const setNumbers = useStore(state => state.setNumbers);
    const typingStyle = useStore(state => state.typingStyle);
    const setTypingStyle = useStore(state => state.setTypingStyle);

    return (
        <main className="flex-1 w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center pb-8 lg:pb-16 relative">

            {/* ── Settings Trigger Button (Mobile & Tablet) ── */}
            <div className="flex lg:hidden items-center justify-center mb-6 w-full z-10 relative">
                <Button
                    variant="ghost"
                    className="flex items-center gap-3 rounded-2xl px-5 py-6 shadow-lg shadow-black/20 hover:shadow-accent/10 transition-all border border-white/5 glass group text-base"
                    onClick={() => setIsSettingsModalOpen(true)}
                >
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex items-center gap-2 font-mono tracking-tight font-semibold">
                        <span className="text-foreground">{activeTab}</span>
                        {activeTab !== "Custom" && (
                            <>
                                <span className="text-text-dim/40">•</span>
                                <span className="text-foreground/80">{
                                    subOption === "Custom"
                                        ? (activeTab === "Words" ? customWordLimit : customTimeLimit + "s")
                                        : subOption
                                }</span>
                            </>
                        )}
                        {(punctuation || numbers) && activeTab !== "Custom" && (
                            <>
                                <span className="text-text-dim/40">•</span>
                                <span className="text-accent flex gap-1 text-[11px] tracking-widest bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                                    {punctuation && <span>@</span>}
                                    {numbers && <span>#</span>}
                                </span>
                            </>
                        )}
                        {activeTab !== "Custom" && (
                            <>
                                <span className="text-text-dim/40">•</span>
                                <span className="text-text-dim uppercase text-[11px] flex items-center gap-1">
                                    <Globe size={10} className="opacity-50" />
                                    {language}
                                </span>
                            </>
                        )}
                    </div>
                </Button>
            </div>

            {/* ── Settings Bar (Desktop only) ── */}
            <motion.div layout className="hidden lg:flex items-center justify-center gap-2 mb-10 overflow-x-auto px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full z-10 relative">
                <motion.div layout>
                    <SegmentedControl
                        options={[...modeOptions]}
                        value={activeTab}
                        onChange={(val) => {
                            setActiveTab(val as ModeOption);
                            setSubOption(
                                val === "Words" ? "50"
                                    : val === "Time" ? "60s"
                                        : val === "Custom" ? ""
                                            : "Medium"
                            );
                        }}
                        className="bg-transparent border-transparent p-0"
                    />
                </motion.div>

                <AnimatePresence mode="popLayout">
                    {activeTab !== "Custom" && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                        >
                            <div className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />
                            <SegmentedControl
                                options={subOptions[activeTab]}
                                value={subOption}
                                onChange={(val) => {
                                    setSubOption(val);
                                    if (val === "Custom" && (activeTab === "Words" || activeTab === "Time")) {
                                        setCustomLimitDraft(activeTab === "Words" ? customWordLimit : customTimeLimit);
                                        setIsCustomLimitModalOpen(true);
                                    }
                                }}
                                formatOption={(val) => {
                                    if (val === "Custom") {
                                        if (activeTab === "Words") return `🔧 ${customWordLimit}`;
                                        if (activeTab === "Time") return `🔧 ${customTimeLimit}s`;
                                    }
                                    return val;
                                }}
                                variant="gradient"
                                className="bg-transparent border-transparent p-0"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                    {activeTab === "Custom" && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                        >
                            <div className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />
                            <Button
                                variant={customShuffle ? "activeGradient" : "ghost"}
                                className="px-3 py-1.5 text-sm"
                                onClick={() => setCustomShuffle(!customShuffle)}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
                                Shuffle
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

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

                    {activeTab === "Custom" && (
                        <motion.div
                            layout
                            initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                            exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                        >
                            <div className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />
                            <Button
                                variant="outline"
                                className="px-3 py-1.5 text-sm gap-2"
                                onClick={() => {
                                    setCustomTextDraft(customText);
                                    setIsCustomModalOpen(true);
                                }}
                            >
                                <PenLine size={14} />
                                Edit Text
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                    {activeTab !== "Custom" && (
                        <>
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
                                    <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                        {[
                                            { code: "EN", label: "English" },
                                            { code: "ID", label: "Indonesia" }
                                        ].map(lang => (
                                            <DropdownMenuItem
                                                key={lang.code}
                                                onClick={() => setLanguage(lang.code as "EN" | "ID")}
                                                className={`justify-between min-w-30 ${language === lang.code ? "bg-accent/15 text-accent font-semibold" : ""}`}
                                            >
                                                {lang.label}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                    <motion.div
                        layout
                        initial={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                        animate={{ opacity: 1, width: "auto", filter: "blur(0px)" }}
                        exit={{ opacity: 0, width: 0, filter: "blur(4px)" }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
                    >
                        <div className="w-px h-4 bg-white/6 hidden sm:block shrink-0" />
                        <DropdownMenu open={styleDesktopOpen} onOpenChange={setStyleDesktopOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm shrink-0"
                                >
                                    <Keyboard size={14} className="opacity-50" />
                                    <span>{typingStyle === "modern" ? "Modern" : "Classic"}</span>
                                    <ChevronDown size={12} className={`opacity-30 transition-transform duration-300 ${styleDesktopOpen ? "rotate-180" : ""}`} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                                {[
                                    { code: "modern", label: "Modern" },
                                    { code: "classic", label: "Classic" }
                                ].map(style => (
                                    <DropdownMenuItem
                                        key={style.code}
                                        onClick={() => setTypingStyle(style.code as "modern" | "classic")}
                                        className={`justify-between min-w-36 ${typingStyle === style.code ? "bg-accent/15 text-accent font-semibold" : ""}`}
                                    >
                                        {style.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* ── Typing Area — contained with accent indicator ── */}
            <div className="typing-panel w-full px-2 sm:px-6 md:px-8 py-4 sm:py-6">
                <AnimatePresence mode="wait">
                    {typingStyle === "classic" ? (
                        <ClassicTypingView
                            key="classic-view"
                            activeTab={activeTab}
                            subOption={subOption === "Custom" ? (activeTab === "Words" ? customWordLimit : customTimeLimit + "s") : subOption}
                            customText={customText}
                            customShuffle={customShuffle}
                        />
                    ) : (
                        <TypingView
                            key="modern-view"
                            activeTab={activeTab}
                            subOption={subOption === "Custom" ? (activeTab === "Words" ? customWordLimit : customTimeLimit + "s") : subOption}
                            customText={customText}
                            customShuffle={customShuffle}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                        onClick={() => setIsSettingsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-panel-elevated/90 border border-white/10 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 sm:gap-8 glass relative overflow-hidden"
                        >
                            {/* Decorative blur */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />

                            <div className="flex items-center justify-between relative z-10">
                                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Configure Training</h2>
                                <Button variant="ghost" size="icon" onClick={() => setIsSettingsModalOpen(false)} className="rounded-full">
                                    <X className="w-5 h-5 opacity-70" />
                                </Button>
                            </div>

                            <div className="space-y-6 sm:space-y-8 relative z-10">
                                {/* Mode Selection */}
                                <div className="space-y-3">
                                    <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Mode</label>
                                    <SegmentedControl
                                        options={[...modeOptions]}
                                        value={activeTab}
                                        onChange={(val) => {
                                            setActiveTab(val as ModeOption);
                                            setSubOption(
                                                val === "Words" ? "50"
                                                    : val === "Time" ? "60s"
                                                        : val === "Custom" ? ""
                                                            : "Medium"
                                            );
                                        }}
                                        className="w-full h-12 text-base"
                                    />
                                </div>

                                {/* Variants */}
                                {activeTab !== "Custom" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Variant</label>
                                        <SegmentedControl
                                            options={subOptions[activeTab]}
                                            value={subOption}
                                            onChange={(val) => {
                                                setSubOption(val);
                                                if (val === "Custom" && (activeTab === "Words" || activeTab === "Time")) {
                                                    setIsSettingsModalOpen(false);
                                                    setCustomLimitDraft(activeTab === "Words" ? customWordLimit : customTimeLimit);
                                                    setTimeout(() => setIsCustomLimitModalOpen(true), 100);
                                                }
                                            }}
                                            formatOption={(val) => {
                                                if (val === "Custom") {
                                                    if (activeTab === "Words") return `🔧 ${customWordLimit}`;
                                                    if (activeTab === "Time") return `🔧 ${customTimeLimit}s`;
                                                }
                                                return val;
                                            }}
                                            variant="gradient"
                                            className="w-full h-12 text-base"
                                        />
                                    </motion.div>
                                )}

                                {/* Typing Style Selection */}
                                <div className="space-y-3 pt-6 sm:pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-base font-medium text-foreground">Typing Style</label>
                                            <span className="text-xs text-text-dim">Choose your preferred typing flow</span>
                                        </div>
                                        <DropdownMenu open={styleMobileOpen} onOpenChange={setStyleMobileOpen}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="flex items-center gap-2 rounded-xl py-5 border-white/10 hover:border-white/20">
                                                    <Keyboard size={16} className="text-accent" />
                                                    <span className="font-semibold">{typingStyle === "modern" ? "Modern" : "Classic"}</span>
                                                    <ChevronDown size={14} className={`opacity-50 ml-2 transition-transform duration-300 ${styleMobileOpen ? "rotate-180" : ""}`} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44 border-white/10 rounded-xl p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                {[
                                                    { code: "modern", label: "Modern" },
                                                    { code: "classic", label: "Classic" }
                                                ].map(style => (
                                                    <DropdownMenuItem
                                                        key={style.code}
                                                        onClick={() => setTypingStyle(style.code as "modern" | "classic")}
                                                        className={`justify-between rounded-lg py-2.5 px-3 cursor-pointer ${typingStyle === style.code ? "bg-accent/15 text-accent font-semibold" : "text-foreground hover:bg-white/5"}`}
                                                    >
                                                        {style.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Extra Modifiers */}
                                {(activeTab === "Words" || activeTab === "Time") && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3"
                                    >
                                        <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Modifiers</label>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant={punctuation ? "activeGradient" : "outline"}
                                                className="flex-1 py-6 text-base font-semibold"
                                                onClick={() => setPunctuation(!punctuation)}
                                            >
                                                @ Punctuation
                                            </Button>
                                            <Button
                                                variant={numbers ? "activeGradient" : "outline"}
                                                className="flex-1 py-6 text-base font-semibold"
                                                onClick={() => setNumbers(!numbers)}
                                            >
                                                # Numbers
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Custom Text Input */}
                                {activeTab === "Custom" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-3 border border-white/5 p-4 sm:p-5 rounded-2xl bg-black/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Custom Text</label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant={customShuffle ? "activeGradient" : "outline"}
                                                    size="sm"
                                                    className="h-8 text-xs gap-1.5"
                                                    onClick={() => setCustomShuffle(!customShuffle)}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
                                                    Shuffle
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1.5 text-accent hover:text-accent group"
                                                    onClick={() => {
                                                        setCustomTextDraft(customText);
                                                        setIsSettingsModalOpen(false);
                                                        setTimeout(() => setIsCustomModalOpen(true), 100);
                                                    }}
                                                >
                                                    <PenLine size={12} /> Full Editor <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={customText}
                                                onChange={(e) => setCustomText(e.target.value)}
                                                className="w-full h-24 bg-transparent resize-none outline-none text-sm text-foreground/80 placeholder:text-text-dim/50 font-mono leading-relaxed"
                                                placeholder="Type or paste something..."
                                            />
                                            <div className="absolute bottom-0 inset-x-0 h-8 bg-linear-to-t from-panel-bg to-transparent pointer-events-none" />
                                        </div>
                                    </motion.div>
                                )}

                                {/* Language */}
                                {activeTab !== "Custom" && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-3 pt-6 sm:pt-4 border-t border-white/5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-base font-medium text-foreground">Language</label>
                                                <span className="text-xs text-text-dim">Choose the training language</span>
                                            </div>
                                            <DropdownMenu open={langDropdownOpen} onOpenChange={setLangDropdownOpen}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="flex items-center gap-2 rounded-xl py-5 border-white/10 hover:border-white/20">
                                                        <Globe size={16} className="text-accent" />
                                                        <span className="font-semibold">{language === "EN" ? "English" : "Indonesia"}</span>
                                                        <ChevronDown size={14} className="opacity-50 ml-2" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 border-white/10 rounded-xl p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                    {[
                                                        { code: "EN", label: "English" },
                                                        { code: "ID", label: "Indonesia" }
                                                    ].map(lang => (
                                                        <DropdownMenuItem
                                                            key={lang.code}
                                                            onClick={() => setLanguage(lang.code as "EN" | "ID")}
                                                            className={`justify-between rounded-lg py-2.5 px-3 cursor-pointer ${language === lang.code ? "bg-accent/15 text-accent font-semibold" : "text-foreground hover:bg-white/5"}`}
                                                        >
                                                            {lang.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                className="w-full mt-2 py-6 sm:py-7 text-lg font-bold rounded-xl sm:rounded-2xl"
                                onClick={() => setIsSettingsModalOpen(false)}
                            >
                                Apply Changes
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Text Modal */}
            <AnimatePresence>
                {isCustomModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setIsCustomModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-panel-elevated border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-4"
                        >
                            <h2 className="text-xl font-bold text-foreground">Edit Custom Text</h2>
                            <textarea
                                autoFocus
                                value={customTextDraft}
                                onChange={(e) => setCustomTextDraft(e.target.value)}
                                className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-text-dim text-lg leading-relaxed font-mono"
                                placeholder="Paste or type your custom text here..."
                            />
                            <div className="flex justify-end gap-3 mt-2">
                                <Button variant="ghost" onClick={() => setIsCustomModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="activeGradient"
                                    onClick={() => {
                                        const formattedText = customTextDraft.trim().replace(/\s+/g, ' ');
                                        if (formattedText) {
                                            setCustomText(formattedText);
                                            setIsCustomModalOpen(false);
                                        }
                                    }}
                                >
                                    Apply Text
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Time/Word Limit Modal */}
            <AnimatePresence>
                {isCustomLimitModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        onClick={() => setIsCustomLimitModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-panel-elevated border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden glass"
                        >
                            <h2 className="text-xl font-bold text-foreground">Custom {activeTab} Limit</h2>
                            <div className="flex items-center gap-3">
                                <input
                                    autoFocus
                                    type="text"
                                    inputMode="numeric"
                                    value={customLimitDraft}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/[^0-9]/g, '');
                                        setCustomLimitDraft(v);
                                    }}
                                    className="w-full h-14 bg-black/20 border border-white/10 rounded-xl px-4 text-foreground focus:outline-none focus:ring-1 focus:ring-accent text-2xl font-bold tabular-nums"
                                    placeholder={activeTab === "Words" ? "1-1000" : "1-3600"}
                                />
                                <span className="text-text-dim font-medium uppercase tracking-widest text-sm shrink-0">
                                    {activeTab === "Words" ? "Words" : "Secs"}
                                </span>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <Button variant="ghost" onClick={() => setIsCustomLimitModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="activeGradient"
                                    onClick={() => {
                                        if (activeTab === "Words") {
                                            const w = parseInt(customLimitDraft);
                                            if (!w || w < 1 || w > 1000) setCustomWordLimit("50");
                                            else setCustomWordLimit(w.toString());
                                        } else {
                                            const t = parseInt(customLimitDraft);
                                            if (!t || t < 1 || t > 3600) setCustomTimeLimit("60");
                                            else setCustomTimeLimit(t.toString());
                                        }
                                        setIsCustomLimitModalOpen(false);
                                    }}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </main>
    );
}

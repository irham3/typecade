"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GlobalSettingsModal() {
    const isGlobalSettingsOpen = useStore(state => state.isGlobalSettingsOpen);
    const setGlobalSettingsOpen = useStore(state => state.setGlobalSettingsOpen);

    const showAnimations = useStore(state => state.showAnimations);
    const setShowAnimations = useStore(state => state.setShowAnimations);
    
    const sound = useStore(state => state.sound);
    const setSound = useStore(state => state.setSound);
    const bgm = useStore(state => state.bgm);
    const setBgm = useStore(state => state.setBgm);

    const [soundDropdownOpen, setSoundDropdownOpen] = useState(false);

    return (
        <AnimatePresence>
            {isGlobalSettingsOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                        onClick={() => setGlobalSettingsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                        >
                        <div className="bg-background/90 glass border border-foreground/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
                                        System Config
                                    </h2>
                                    <p className="text-sm text-text-dim mt-1">Configure global audio and visuals.</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:bg-foreground/5 hover:text-foreground h-10 w-10 shrink-0"
                                    onClick={() => setGlobalSettingsOpen(false)}
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 -mr-2">
                                {/* Sound Settings */}
                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Audio</label>
                                    
                                    <div className="flex flex-col gap-3">
                                        {/* Typing Sound */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-base font-medium text-foreground">Typing Sound</label>
                                                <span className="text-xs text-text-dim">Effect played on each keystroke</span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="flex items-center gap-2 rounded-xl py-5 border-foreground/10 hover:border-foreground/20 w-full sm:w-44 justify-center">
                                                        <span className="font-semibold">{
                                                            [
                                                                { code: "off", label: "Off" },
                                                                { code: "soft", label: "Soft" },
                                                                { code: "mechanical", label: "Mechanical" },
                                                                { code: "arcade", label: "Arcade 👾" }
                                                            ].find(o => o.code === sound)?.label || sound
                                                        }</span>
                                                        <ChevronDown size={14} className="opacity-50 ml-2" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44 border-foreground/10 rounded-xl p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                    {[
                                                        { code: "off", label: "Off" },
                                                        { code: "soft", label: "Soft" },
                                                        { code: "mechanical", label: "Mechanical" },
                                                        { code: "arcade", label: "Arcade 👾" }
                                                    ].map(s => (
                                                        <DropdownMenuItem
                                                            key={s.code}
                                                            onClick={() => setSound(s.code as "off" | "soft" | "mechanical" | "arcade")}
                                                            className={`justify-between rounded-lg py-2.5 px-3 cursor-pointer ${sound === s.code ? "bg-accent/15 text-accent font-semibold" : "text-foreground hover:bg-foreground/5"}`}
                                                        >
                                                            {s.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Background Music */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-base font-medium text-foreground">Background Music</label>
                                                <span className="text-xs text-text-dim">Looping ambient tracks</span>
                                            </div>
                                            <DropdownMenu open={soundDropdownOpen} onOpenChange={setSoundDropdownOpen}>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="flex items-center gap-2 rounded-xl py-5 border-foreground/10 hover:border-foreground/20 w-full sm:w-48 justify-center">
                                                        <span className="font-semibold">{
                                                            [
                                                                { code: "off", label: "Off 🔇" },
                                                                { code: "arcade", label: "8-Bit Retro 👾" },
                                                                { code: "lofi", label: "Lofi Chords ☕" },
                                                                { code: "synthwave", label: "Synthwave 🌃" },
                                                                { code: "ambient", label: "Deep Space 🌌" }
                                                            ].find(o => o.code === bgm)?.label || bgm
                                                        }</span>
                                                        <ChevronDown size={14} className={`opacity-50 ml-2 transition-transform duration-300 ${soundDropdownOpen ? "rotate-180" : ""}`} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 border-foreground/10 rounded-xl p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
                                                    {[
                                                        { code: "off", label: "Off 🔇" },
                                                        { code: "arcade", label: "8-Bit Retro 👾" },
                                                        { code: "lofi", label: "Lofi Chords ☕" },
                                                        { code: "synthwave", label: "Synthwave 🌃" },
                                                        { code: "ambient", label: "Deep Space 🌌" }
                                                    ].map(s => (
                                                        <DropdownMenuItem
                                                            key={s.code}
                                                            onClick={() => setBgm(s.code as "off" | "arcade" | "lofi" | "synthwave" | "ambient")}
                                                            className={`justify-between rounded-lg py-2.5 px-3 cursor-pointer ${bgm === s.code ? "bg-accent/15 text-accent font-semibold" : "text-foreground hover:bg-foreground/5"}`}
                                                        >
                                                            {s.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>

                                {/* Appearance Settings */}
                                <div className="space-y-3 pt-6 sm:pt-4 border-t border-foreground/5">
                                    <label className="text-[10px] sm:text-xs font-bold text-text-dim uppercase tracking-widest pl-1">Appearance</label>
                                    <div className="flex items-center justify-between p-4 sm:p-3 rounded-xl bg-foreground/5 border border-foreground/5 overflow-hidden">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium text-foreground">Background Animations</span>
                                            <span className="text-[10px] text-text-dim">Show aurora and veil effects</span>
                                        </div>
                                        <button
                                            onClick={() => setShowAnimations(!showAnimations)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showAnimations ? 'bg-accent' : 'bg-foreground/10'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAnimations ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </>
            )}
        </AnimatePresence>
    );
}

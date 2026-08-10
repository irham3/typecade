"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Palette, X } from "@/components/icons";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const themes = [
    { id: "dark", label: "Default", bg: "#0c0d14", accent: "#6366f1" },
    { id: "light", label: "Light", bg: "#ffffff", accent: "#4f46e5" },
    { id: "forest", label: "Forest", bg: "#111a15", accent: "#22c55e" },
    { id: "sunset", label: "Sunset", bg: "#1c1817", accent: "#f97316" },
    { id: "retro", label: "Retro", bg: "#150024", accent: "#ff007f" },
    { id: "nord", label: "Nord", bg: "#2e3440", accent: "#88c0d0" },
    { id: "serika", label: "Serika", bg: "#2c2e31", accent: "#e2b714" },
    { id: "dracula", label: "Dracula", bg: "#282a36", accent: "#bd93f9" },
] as const;

export function ThemeModal() {
    const theme = useStore(state => state.theme);
    const setTheme = useStore(state => state.setTheme);
    const isThemeModalOpen = useStore(state => state.isThemeModalOpen);
    const setThemeModalOpen = useStore(state => state.setThemeModalOpen);
    const showAnimations = useStore(state => state.showAnimations);
    const setShowAnimations = useStore(state => state.setShowAnimations);

    return (
        <AnimatePresence>
            {isThemeModalOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        onClick={() => setThemeModalOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="appearance-title"
                        className="w-full max-w-lg glass p-6 sm:p-8 rounded-4xl sm:rounded-5xl shadow-2xl relative overflow-hidden z-10 glow-accent max-h-[85vh] overflow-y-auto hide-scrollbar"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 sm:mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center ring-1 ring-accent/20">
                                    <Palette size={20} className="text-accent" />
                                </div>
                                <div>
                                    <h2 id="appearance-title" className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">Appearance</h2>
                                    <p className="text-xs text-text-dim font-medium">Customize your visual atmosphere</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-xl w-10 h-10 hover:bg-foreground/10"
                                aria-label="Close appearance settings"
                                onClick={() => setThemeModalOpen(false)}
                            >
                                <X size={20} className="text-text-dim" />
                            </Button>
                        </div>

                        {/* Theme Grid */}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest pl-1">Themes</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {themes.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            aria-pressed={theme === t.id}
                                            aria-label={`Use ${t.label} theme`}
                                            className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${theme === t.id
                                                ? 'border-accent bg-accent/10 ring-2 ring-accent/20 -translate-y-0.5'
                                                : 'border-foreground/10 bg-foreground/5 hover:border-foreground/20 hover:bg-foreground/8'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between relative z-10 w-full">
                                                <div
                                                    className="w-6 h-6 rounded-full shadow-lg"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                                                        border: `2px solid ${theme === t.id ? t.accent : 'rgba(var(--foreground-rgb),0.1)'}`
                                                    }}
                                                />
                                                {theme === t.id && (
                                                    <motion.div layoutId="active-theme" className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                )}
                                            </div>
                                            <span className={`text-xs font-bold relative z-10 ${theme === t.id ? 'text-foreground' : 'text-text-dim group-hover:text-foreground/80'}`}>
                                                {t.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Animation Toggle in Theme Modal too */}
                            <div className="pt-6 border-t border-foreground/10">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-foreground/5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-foreground">Immersive Effects</span>
                                        <span className="text-[10px] text-text-dim">Aurora and Veil atmospheric animations</span>
                                    </div>
                                    <button
                                        onClick={() => setShowAnimations(!showAnimations)}
                                        aria-label="Toggle immersive effects"
                                        aria-pressed={showAnimations}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${showAnimations ? 'bg-accent' : 'bg-white/10'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showAnimations ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            className="w-full mt-8 py-6 text-lg font-bold rounded-2xl"
                            onClick={() => setThemeModalOpen(false)}
                        >
                            Done
                        </Button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Trees, Sunset, Gamepad2, Volume2, VolumeX, Keyboard as KeyboardIcon, Baseline, RemoveFormatting, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const themeOptions = [
    { id: "dark", label: "Midnight", icon: Moon, color: "#6366f1" },
    { id: "light", label: "Daylight", icon: Sun, color: "#3b82f6" },
    { id: "forest", label: "Pine", icon: Trees, color: "#4ade80" },
    { id: "sunset", label: "Sunset", icon: Sunset, color: "#f97316" },
    { id: "retro", label: "Arcade", icon: Gamepad2, color: "#d946ef" },
];

const soundOptions = [
    { id: "off", label: "Off", icon: VolumeX },
    { id: "soft", label: "Soft click", icon: Volume2 },
    { id: "mechanical", label: "Mechanical", icon: KeyboardIcon },
];

const caretOptions = [
    { id: "line", label: "Line", icon: RemoveFormatting }, // just placeholder icons
    { id: "block", label: "Block", icon: Baseline },
    { id: "underscore", label: "Underscore", icon: Type },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const theme = useStore((state) => state.theme);
    const setTheme = useStore((state) => state.setTheme);
    const sound = useStore((state) => state.sound);
    const setSound = useStore((state) => state.setSound);
    const caretStyle = useStore((state) => state.caretStyle);
    const setCaretStyle = useStore((state) => state.setCaretStyle);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm"
                    />
                    <div className="fixed inset-0 z-101 pointer-events-none flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="pointer-events-auto w-full max-w-2xl bg-panel-elevated/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
                                <div>
                                    <h2 className="text-xl font-bold text-foreground font-display">Settings</h2>
                                    <p className="text-sm text-text-dim">Customize your typing experience</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                                    <X size={20} />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">

                                {/* Theme Section */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Themes</h3>
                                        <p className="text-xs text-text-dim">Choose from 5 beautiful aesthetics</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {themeOptions.map((opt) => {
                                            const isActive = theme === opt.id;
                                            return (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setTheme(opt.id as "dark" | "light" | "forest" | "sunset" | "retro")}
                                                    className={`relative flex flex-col items-center justify-center p-4 gap-3 rounded-2xl border transition-all duration-200 overflow-hidden ${isActive
                                                        ? "bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.2)]"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                                        }`}
                                                >
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? "bg-accent text-white" : "bg-black/20 text-white/50"}`}
                                                        style={isActive ? { backgroundColor: opt.color } : {}}
                                                    >
                                                        <opt.icon size={20} />
                                                    </div>
                                                    <span className={`text-sm font-medium ${isActive ? "text-foreground font-bold" : "text-text-dim"}`}>
                                                        {opt.label}
                                                    </span>
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="theme-active"
                                                            className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
                                                            style={{ borderColor: opt.color }}
                                                        />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Sound Section */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Typing Sounds</h3>
                                        <p className="text-xs text-text-dim">Audio feedback for every keystroke</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {soundOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSound(opt.id as "off" | "soft" | "mechanical")}
                                                className={`flex-1 min-w-[120px] flex items-center gap-3 p-3 px-4 rounded-xl border transition-all duration-200 ${sound === opt.id
                                                    ? "bg-accent/10 border-accent/30 text-accent font-semibold"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-text-dim"
                                                    }`}
                                            >
                                                <opt.icon size={18} />
                                                <span className="text-sm">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Caret Section */}
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Caret Style</h3>
                                        <p className="text-xs text-text-dim">How you want to track your typing position</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {caretOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setCaretStyle(opt.id as "line" | "block" | "underscore")}
                                                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${caretStyle === opt.id
                                                    ? "bg-accent/10 border-accent/30 text-accent font-semibold"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-text-dim"
                                                    }`}
                                            >
                                                <span className="text-sm">{opt.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

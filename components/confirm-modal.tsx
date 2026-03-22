"use client";

import { AlertTriangle, X } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        onClick={onCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                        className="w-full max-w-sm bg-panel-bg border border-foreground/10 rounded-3xl p-6 shadow-2xl relative z-10 glass glow-accent max-h-[85vh] overflow-y-auto hide-scrollbar"
                    >
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 transition-colors text-text-dim hover:text-foreground"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col items-center text-center gap-4 mt-2 mb-6">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-display font-bold text-foreground tracking-tight mb-2">{title}</h2>
                            <p className="text-sm text-text-dim">{message}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="ghost" onClick={onCancel} className="font-semibold">
                            {cancelText}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onConfirm}
                            className="font-semibold bg-red-500/80 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] border-red-500/50"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}

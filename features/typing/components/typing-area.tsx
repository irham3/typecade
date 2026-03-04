import { useEffect, useState, useCallback, useRef } from "react";
import { useTypingEngine } from "../hooks/use-typing-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { RotateCcw, Share2, ArrowRight, RefreshCw, Target, Clock, Type } from "lucide-react";
import { generateQuote, generateWords } from "@/lib/words";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export function TypingView({ activeTab, subOption }: { activeTab: string; subOption: string }) {
    const { user, supabaseReady } = useAuth();
    const language = useStore(state => state.language);
    const usePunctuation = useStore(state => state.punctuation);
    const useNumbers = useStore(state => state.numbers);

    const mode = activeTab.toLowerCase() as "time" | "words" | "quote";
    const limit = parseInt(subOption.replace("s", ""));

    const getNewText = useCallback(() => {
        if (mode === "quote") {
            return generateQuote(language, subOption as "Easy" | "Medium" | "Hard");
        }
        return generateWords(language, mode === "words" ? limit : 50, usePunctuation, useNumbers);
    }, [language, mode, limit, subOption, usePunctuation, useNumbers]);

    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return "";
        return getNewText();
    });

    const duration = mode === "time" ? limit : 60;
    const addTestResult = useStore(state => state.addTestResult);

    const activeCharRef = useRef<HTMLSpanElement>(null);
    const [translateY, setTranslateY] = useState(0);
    const pendingResultRef = useRef<{ wpm: number; acc: number; timeTaken: number } | null>(null);
    const [isFocused, setIsFocused] = useState(() =>
        typeof document !== "undefined" && document.activeElement === document.querySelector("input[autofocus]")
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const [resultKey, setResultKey] = useState(0);

    const saveResult = useCallback(async (finalWpm: number, finalAcc: number, timeTaken: number) => {
        if (!supabaseReady || !user) return false;
        const client = getSupabaseClient();
        if (!client) return false;
        const modeValue = mode === "words" ? limit : duration;
        const { error } = await client.from("typing_tests").insert({
            user_id: user.id,
            mode,
            mode_value: modeValue,
            language,
            wpm: finalWpm,
            accuracy: finalAcc,
            duration_seconds: timeTaken,
        } as unknown as never);
        if (error) return false;
        const { error: rpcError } = await (client as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> }).rpc("update_user_stats", { p_user_id: user.id });
        if (rpcError) return false;
        return true;
    }, [supabaseReady, user, mode, limit, duration, language]);

    const {
        status,
        timeLeft,
        typedChars,
        wpm,
        accuracy,
        inputRef,
        handleInput,
        restartText,
    } = useTypingEngine({
        text,
        duration,
        mode,
        isFocused,
        onFinish: (finalWpm, finalAcc, timeTaken) => {
            addTestResult({ wpm: finalWpm, accuracy: finalAcc, duration: timeTaken, mode: `${activeTab} ${subOption} ` });
            pendingResultRef.current = { wpm: finalWpm, acc: finalAcc, timeTaken };
            setResultKey(prev => prev + 1);
            void saveResult(finalWpm, finalAcc, timeTaken).then((ok) => {
                if (ok) pendingResultRef.current = null;
            });
        }
    });

    // Auto-append words for infinite typing (Time mode)
    useEffect(() => {
        if (mode === "time" && typeof window !== 'undefined') {
            if (text.length > 0 && (text.length - typedChars.length) < 150) {
                const timer = setTimeout(() => {
                    setText(prev => prev + " " + generateWords(language, 30, usePunctuation, useNumbers));
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [typedChars.length, text.length, mode, language, usePunctuation, useNumbers]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const timer = setTimeout(() => {
                setText(getNewText());
                restartText();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [getNewText, restartText]);

    const focusInput = useCallback(() => {
        if (inputRef.current && status !== "finished") {
            inputRef.current.focus();
        }
    }, [inputRef, status]);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;

        const onFocus = () => setIsFocused(true);
        const onBlur = () => setIsFocused(false);

        input.addEventListener("focus", onFocus);
        input.addEventListener("blur", onBlur);

        return () => {
            input.removeEventListener("focus", onFocus);
            input.removeEventListener("blur", onBlur);
        };
    }, [inputRef]);

    useEffect(() => {
        if (status === "idle") {
            const timer = setTimeout(() => setTranslateY(0), 0);
            return () => clearTimeout(timer);
        }

        if (!activeCharRef.current) return;
        const charTop = activeCharRef.current.offsetTop;

        const parentElem = activeCharRef.current.parentElement?.parentElement;
        if (!parentElem) return;

        const computedLineHeight = window.getComputedStyle(parentElem).lineHeight;
        const lineHeight = parseFloat(computedLineHeight) || activeCharRef.current.offsetHeight;

        if (lineHeight === 0) return;

        const lineIndex = Math.floor((charTop + 2) / lineHeight);
        const newTranslate = lineIndex > 1 ? (lineIndex - 1) * lineHeight : 0;
        const timer = setTimeout(() => setTranslateY(newTranslate), 0);
        return () => clearTimeout(timer);
    }, [typedChars, status]);

    useEffect(() => {
        focusInput();
    }, [activeTab, subOption, focusInput]);

    useEffect(() => {
        const pending = pendingResultRef.current;
        if (!pending) return;
        void saveResult(pending.wpm, pending.acc, pending.timeTaken).then((ok) => {
            if (ok) pendingResultRef.current = null;
        });
    }, [saveResult, supabaseReady, user]);

    const progress = mode !== "time"
        ? Math.min(100, Math.floor((typedChars.length / (text.length || 1)) * 100))
        : null;

    const renderText = () => {
        const words = text.split(" ");
        let globalIndex = 0;

        return words.map((word, wIdx) => {
            const wordLen = word.length;
            const wordChars = word.split("");
            const isLastWord = wIdx === words.length - 1;

            const wordNodes = wordChars.map((char, cIdx) => {
                const index = globalIndex + cIdx;
                const typedChar = typedChars[index];

                let charStatusClass = "text-text-dim/40";
                if (typedChar != null) {
                    if (typedChar === char) {
                        charStatusClass = "text-foreground";
                    } else {
                        charStatusClass = "text-error-text bg-error-bg/50 rounded-sm";
                    }
                }

                const isCurrent = index === typedChars.length;

                return (
                    <span
                        key={cIdx}
                        ref={isCurrent ? activeCharRef : null}
                        className={`relative transition-colors duration-75 ${charStatusClass}`}
                    >
                        {isCurrent && status !== "finished" && (
                            <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                        )}
                        {char}
                    </span>
                );
            });

            const spaceIndex = globalIndex + wordLen;
            const spaceTyped = typedChars[spaceIndex];
            const isSpaceCurrent = spaceIndex === typedChars.length;

            let spaceStatusClass = "text-text-dim/40";
            if (spaceTyped != null) {
                if (spaceTyped === " ") {
                    spaceStatusClass = "text-foreground";
                } else {
                    spaceStatusClass = "text-error-text bg-error-bg/50 rounded-sm";
                }
            }

            globalIndex += wordLen + (isLastWord ? 0 : 1);

            return (
                <span key={wIdx} className="inline-block">
                    {wordNodes}
                    {!isLastWord && (
                        <span
                            ref={isSpaceCurrent ? activeCharRef : null}
                            className={`relative transition-colors duration-75 ${spaceStatusClass}`}
                        >
                            {isSpaceCurrent && status !== "finished" && (
                                <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                            )}
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    const showBlurOverlay = !isFocused && status !== "finished";

    return (
        <div className="w-full max-w-5xl flex flex-col items-center relative" ref={containerRef} onClick={focusInput}>

            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute -top-2499.75"
                value={typedChars}
                onChange={handleInput}
                autoFocus
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
            />

            <AnimatePresence mode="wait">
                {status !== "finished" ? (
                    <motion.div
                        key="typing-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full relative"
                    >
                        {/* Live stats bar — collapses when not playing */}
                        <div
                            className={`flex items-center justify-between font-mono overflow-hidden transition-all duration-300 ease-out ${status === "playing"
                                ? "opacity-100 h-10 mb-3"
                                : "opacity-0 h-0 mb-0"
                                }`}
                        >
                            <div className="flex items-center gap-5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold text-accent tabular-nums text-glow-accent">{wpm}</span>
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest">wpm</span>
                                </div>
                                <div className="w-px h-4 bg-white/6" />
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-bold text-foreground/80 tabular-nums">{accuracy}</span>
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest">%</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-foreground/80 tabular-nums">
                                    {mode === "time" ? timeLeft : `${progress}%`}
                                </span>
                                <span className="text-[10px] text-text-dim uppercase tracking-widest">
                                    {mode === "time" ? "sec" : "done"}
                                </span>
                            </div>
                        </div>

                        {/* Typing Area */}
                        <div className="w-full relative">
                            <div
                                className="w-full font-mono text-2xl sm:text-[1.75rem] leading-[1.8] tracking-tight text-left py-4 relative cursor-text select-none"
                            >
                                <div
                                    className="h-[5.4em] overflow-hidden relative w-full"
                                    style={{
                                        maskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 3%, black 92%, transparent 100%)",
                                    }}
                                >
                                    <div
                                        className="transition-transform duration-300 ease-out relative text-left"
                                        style={{ transform: `translateY(-${translateY}px)` }}
                                    >
                                        {renderText()}
                                    </div>
                                </div>
                            </div>

                            {/* Blur / focus overlay */}
                            <AnimatePresence>
                                {showBlurOverlay && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer backdrop-blur-[6px]"
                                        onClick={focusInput}
                                    >
                                        <span className="text-text-dim text-sm font-sans font-medium tracking-wide">
                                            Click here or press any key to focus
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Progress line */}
                        {status === "playing" && (
                            <div className="w-full h-0.5 bg-white/4 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, rgba(99,102,241,0.8), rgba(94,234,212,0.6))",
                                    }}
                                    animate={{
                                        width: mode === "time"
                                            ? `${(timeLeft / duration) * 100}%`
                                            : `${progress}%`,
                                    }}
                                    transition={{
                                        duration: mode === "time" ? 0.5 : 0.3,
                                        ease: "linear",
                                    }}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="w-full flex justify-center gap-3 mt-8 items-center">
                            <Button
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); restartText(); }}
                                className="group flex items-center gap-2 text-text-dim"
                                aria-label="Restart Test (Esc)"
                                title="Restart identical test"
                            >
                                <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500 ease-in-out" />
                                <span className="text-sm">Restart</span>
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setText(getNewText());
                                    restartText();
                                }}
                                className="group flex items-center gap-2 text-text-dim"
                                aria-label="Shuffle Words"
                                title="Generate new words"
                            >
                                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
                                <span className="text-sm">Shuffle</span>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Results Screen — redesigned with CountUp ── */
                    <motion.div
                        key={`typing-finished-${resultKey}`}
                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full flex flex-col mt-8"
                    >
                        {/* Primary stat with CountUp */}
                        <div className="flex flex-col items-center text-center mb-10">
                            <div className="text-[7rem] sm:text-[9rem] font-mono font-bold text-foreground leading-none tracking-tighter text-glow-accent">
                                <CountUp
                                    end={wpm}
                                    duration={1500}
                                    className="tabular-nums"
                                />
                            </div>
                            <span className="text-sm font-mono text-accent uppercase tracking-[0.25em] font-semibold mt-1">
                                words per minute
                            </span>
                        </div>

                        {/* Secondary stats grid — premium cards */}
                        <div className="grid grid-cols-3 gap-3 mx-auto w-full max-w-lg">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="glass rounded-2xl flex flex-col items-center py-5 px-4 group hover:glow-accent transition-shadow duration-300"
                            >
                                <Target size={16} className="text-accent-secondary mb-2 opacity-60" />
                                <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Accuracy</span>
                                <span className="text-2xl font-mono font-bold text-foreground">
                                    <CountUp end={accuracy} duration={1200} delay={200} suffix="%" />
                                </span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="glass rounded-2xl flex flex-col items-center py-5 px-4"
                            >
                                <Clock size={16} className="text-accent mb-2 opacity-60" />
                                <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Time</span>
                                <span className="text-2xl font-mono font-bold text-foreground">{mode === "time" ? `${limit}s` : `${Math.ceil(typedChars.length / 5)}s`}</span>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="glass rounded-2xl flex flex-col items-center py-5 px-4"
                            >
                                <Type size={16} className="text-accent mb-2 opacity-60" />
                                <span className="text-[10px] text-text-dim uppercase tracking-widest font-mono mb-1">Characters</span>
                                <span className="text-2xl font-mono font-bold text-foreground">
                                    <CountUp end={typedChars.length} duration={1000} delay={300} />
                                </span>
                            </motion.div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 justify-center mt-10">
                            <Button
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); restartText(); }}
                                className="gap-2 px-6"
                            >
                                <RotateCcw size={16} /> Retry
                            </Button>
                            <Button
                                variant="ghost"
                                className="gap-2 px-6"
                            >
                                <Share2 size={16} /> Share
                            </Button>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setText(getNewText());
                                    restartText();
                                }}
                                className="gap-2 px-6"
                            >
                                Next Test <ArrowRight size={16} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

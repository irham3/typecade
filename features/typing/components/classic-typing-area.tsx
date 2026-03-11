import { useEffect, useState, useCallback, useRef } from "react";
import { useClassicTypingEngine } from "../hooks/use-classic-typing-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { RotateCcw, TrendingUp } from "lucide-react";
import { generateQuote, generateWords } from "@/lib/words";
import { Button } from "@/components/ui/button";
import { TypingResults } from "./typing-results";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

export function ClassicTypingView({ activeTab, subOption, customText, customShuffle }: { activeTab: string; subOption: string; customText?: string; customShuffle?: boolean }) {
    const { user, supabaseReady } = useAuth();
    const language = useStore(state => state.language);
    const usePunctuation = useStore(state => state.punctuation);
    const useNumbers = useStore(state => state.numbers);

    const mode = activeTab.toLowerCase() as "time" | "words" | "quote" | "custom";
    const limit = parseInt(subOption.replace("s", ""));

    const getNewText = useCallback(() => {
        if (mode === "custom" && customText) {
            if (customShuffle) {
                const words = customText.split(/\s+/).filter(Boolean);
                for (let i = words.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [words[i], words[j]] = [words[j], words[i]];
                }
                return words.join(" ");
            }
            return customText;
        }
        if (mode === "quote") {
            return generateQuote(language, subOption as "Easy" | "Medium" | "Hard");
        }
        return generateWords(language, mode === "words" ? limit : 50, usePunctuation, useNumbers);
    }, [language, mode, limit, subOption, usePunctuation, useNumbers, customText, customShuffle]);

    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return "";
        return getNewText();
    });

    const duration = mode === "time" ? limit : 60;
    const addTestResult = useStore(state => state.addTestResult);

    const pendingResultRef = useRef<{ wpm: number; acc: number; timeTaken: number } | null>(null);
    const [isFocused, setIsFocused] = useState(() =>
        typeof document !== "undefined" && document.activeElement === document.querySelector("input[autofocus]")
    );
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
        words,
        currentWordIndex,
        currentInput,
        wordHistory,
        wpm,
        accuracy,
        inputRef,
        handleInput,
        restartText,
    } = useClassicTypingEngine({
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
            if (words.length > 0 && (words.length - currentWordIndex) < 20) {
                const timer = setTimeout(() => {
                    setText(prev => prev + " " + generateWords(language, 30, usePunctuation, useNumbers));
                }, 0);
                return () => clearTimeout(timer);
            }
        }
    }, [currentWordIndex, words.length, mode, language, usePunctuation, useNumbers]);

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
        // Aggressive on-mount focus cascade to fight browser autofill stealing
        const t1 = setTimeout(focusInput, 10);
        const t2 = setTimeout(focusInput, 100);
        const t3 = setTimeout(focusInput, 300);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [focusInput]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const activeTag = document.activeElement?.tagName.toLowerCase();
            if (activeTag === "textarea" || activeTag === "input") {
                if (document.activeElement === inputRef.current) return;
                return;
            }
            if (e.key === "Escape" || e.key === "Tab" || e.key === "Enter") return;

            if (e.key.length === 1 || e.key === "Backspace") {
                focusInput();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [focusInput, inputRef]);

    useEffect(() => {
        const timer = setTimeout(focusInput, 150);
        return () => clearTimeout(timer);
    }, [text, focusInput]);

    useEffect(() => {
        const pending = pendingResultRef.current;
        if (!pending) return;
        void saveResult(pending.wpm, pending.acc, pending.timeTaken).then((ok) => {
            if (ok) pendingResultRef.current = null;
        });
    }, [saveResult, supabaseReady, user]);

    // Calculate progress limit for display logic based on "mode"
    const totalWords = words.length || 1;
    const progress = mode !== "time"
        ? Math.min(100, Math.floor((currentWordIndex / totalWords) * 100))
        : null;

    // Scrolling logic
    const [translateY, setTranslateY] = useState(0);
    const activeWordRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (status === "idle") {
            const timer = setTimeout(() => setTranslateY(0), 0);
            return () => clearTimeout(timer);
        }

        if (!activeWordRef.current) return;
        const charTop = activeWordRef.current.offsetTop;

        const parentElem = activeWordRef.current.parentElement?.parentElement;
        if (!parentElem) return;

        const computedLineHeight = window.getComputedStyle(parentElem).lineHeight;
        const lineHeight = parseFloat(computedLineHeight) || activeWordRef.current.offsetHeight;

        if (lineHeight === 0) return;

        const lineIndex = Math.floor((charTop + 2) / lineHeight);
        const newTranslate = Math.floor(lineIndex / 2) * 2 * lineHeight;
        const timer = setTimeout(() => setTranslateY(newTranslate), 0);
        return () => clearTimeout(timer);
    }, [currentWordIndex, status]);


    const renderText = () => {
        return words.map((targetWord, wIdx) => {
            let className = "px-1 rounded bg-transparent transition-colors ";

            if (wIdx < currentWordIndex) {
                // Past words
                const history = wordHistory[wIdx];
                if (history?.isCorrect) {
                    className += "text-accent bg-accent/10";
                } else {
                    className += "text-error-text bg-error-bg/30 line-through decoration-error-text/50";
                }
            } else if (wIdx === currentWordIndex) {
                // Current word
                const isTypo = currentInput.length > 0 && !targetWord.startsWith(currentInput);
                if (isTypo) {
                    className += "bg-error-bg/30 text-error-text ring-1 ring-error-text/50";
                } else {
                    className += "bg-white/10 text-foreground ring-1 ring-white/20";
                }
            } else {
                // Future words
                className += "text-text-dim";
            }

            return (
                <span
                    key={wIdx}
                    ref={wIdx === currentWordIndex ? activeWordRef : null}
                    className={`inline-block mx-1 leading-tight ${className}`}
                >
                    {targetWord}
                </span>
            );
        });
    };

    const showBlurOverlay = !isFocused && status !== "finished";

    return (
        <div className="w-full flex flex-col items-center relative" onClick={focusInput}>

            <AnimatePresence mode="wait">
                {status !== "finished" ? (
                    <motion.div
                        key="typing-active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full relative"
                    >
                        {/* Live stats bar */}
                        <div
                            className={`flex items-center justify-between font-mono overflow-hidden transition-all duration-300 ease-out ${status === "playing"
                                ? "opacity-100 h-8 sm:h-10 mb-2 sm:mb-3 px-2"
                                : "opacity-0 h-0 mb-0"
                                }`}
                        >
                            <div className="flex items-center gap-3 sm:gap-5">
                                <div className="flex items-baseline gap-1 sm:gap-1.5">
                                    <span className="text-lg sm:text-2xl font-bold text-accent tabular-nums text-glow-accent">{wpm}</span>
                                    <span className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-widest">wpm</span>
                                </div>
                                <div className="w-px h-3 sm:h-4 bg-white/6" />
                                <div className="flex items-baseline gap-1 sm:gap-1.5">
                                    <span className="text-lg sm:text-2xl font-bold text-foreground/80 tabular-nums">{accuracy}</span>
                                    <span className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-widest">%</span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1 sm:gap-1.5">
                                <span className="text-lg sm:text-2xl font-bold text-foreground/80 tabular-nums">
                                    {mode === "time" ? timeLeft : `${progress}%`}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-widest">
                                    {mode === "time" ? "sec" : "done"}
                                </span>
                            </div>
                        </div>

                        {/* Classic Typing Area containing Words */}
                        <div className="w-full relative glass border border-white/5 rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
                            <div
                                className="w-full font-mono text-xl sm:text-2xl tracking-tight text-left relative select-none"
                                style={{ lineHeight: 1.8 }}
                            >
                                <div
                                    className="overflow-hidden relative w-full"
                                    style={{ height: "3.6em" }} // Exactly 2 lines (2 * 1.8em)
                                >
                                    <div
                                        className="transition-transform duration-300 ease-out relative text-left"
                                        style={{ transform: `translateY(-${translateY}px)` }}
                                    >
                                        <div className="-mx-1">
                                            {renderText()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Classic Input Area */}
                        <div className="flex justify-center w-full mb-6 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                className={`w-full bg-black/20 border-2 transition-colors rounded-xl font-mono text-2xl text-center py-4 px-6 outline-none shadow-inner ${currentInput && currentInput !== words[currentWordIndex]?.substring(0, currentInput.length)
                                    ? "border-error-text/50 text-error-text bg-error-bg/10"
                                    : "border-white/10 hover:border-white/20 focus:border-accent/50 text-foreground"
                                    }`}
                                value={currentInput}
                                onChange={handleInput}
                                autoFocus
                                autoComplete="off"
                                spellCheck="false"
                                autoCorrect="off"
                                placeholder={status === "idle" ? "Type the words here..." : ""}
                            />

                            {/* Blur overlay on input only */}
                            <AnimatePresence>
                                {showBlurOverlay && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer backdrop-blur-md rounded-xl"
                                        onClick={focusInput}
                                    >
                                        <div className="bg-panel-bg/80 border border-white/10 px-6 py-3 rounded-full flex gap-3 items-center shadow-xl">
                                            <span className="text-foreground text-sm font-sans font-medium tracking-wide">
                                                Click here or press any key to focus
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>


                        {/* Progress line */}
                        {status === "playing" && (
                            <div className="w-full h-0.5 bg-white/4 rounded-full mt-4 overflow-hidden max-w-2xl mx-auto">
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
                        <div className="w-full flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 items-center flex-wrap">
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
                                <TrendingUp size={16} className="group-hover:rotate-12 transition-transform duration-300 ease-in-out opacity-0 w-0" />
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100 transition-opacity"><path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></svg>
                                <span className="text-sm">Shuffle Text</span>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Results Screen — Redesigned with TypingResults component ── */
                    <TypingResults
                        wpm={wpm}
                        accuracy={accuracy}
                        mode={mode}
                        limit={limit}
                        typedCharsLength={words.join(' ').length}
                        resultKey={resultKey}
                        onRetry={() => {
                            restartText();
                        }}
                        onNext={() => {
                            setText(getNewText());
                            restartText();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

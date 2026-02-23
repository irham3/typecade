import { useEffect, useState, useCallback, useRef } from "react";
import { useTypingEngine } from "../hooks/use-typing-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { RotateCcw, Share2, ArrowRight, RefreshCw } from "lucide-react";
import { generateQuote, generateWords } from "@/lib/words";
import { Button } from "@/components/ui/button";
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
            return generateQuote(language);
        }
        return generateWords(language, mode === "words" ? limit : 50, usePunctuation, useNumbers);
    }, [language, mode, limit, usePunctuation, useNumbers]);

    const [text, setText] = useState(() => {
        if (typeof window === 'undefined') return "";
        return getNewText();
    });

    const duration = mode === "time" ? limit : 60;
    const addTestResult = useStore(state => state.addTestResult);

    const activeCharRef = useRef<HTMLSpanElement>(null);
    const [translateY, setTranslateY] = useState(0);



    const saveResult = useCallback(async (finalWpm: number, finalAcc: number, timeTaken: number) => {
        if (!supabaseReady || !user) return;
        const client = getSupabaseClient();
        if (!client) return;
        const modeValue = mode === "words" ? limit : duration;
        await client.from("typing_tests").insert({
            user_id: user.id,
            mode,
            mode_value: modeValue,
            language,
            wpm: finalWpm,
            accuracy: finalAcc,
            duration_seconds: timeTaken,
        } as unknown as never);
        const rpc = (client as unknown as { rpc: (fn: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> }).rpc;
        await rpc("update_user_stats", { p_user_id: user.id });
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
        onFinish: (finalWpm, finalAcc, timeTaken) => {
            addTestResult({ wpm: finalWpm, accuracy: finalAcc, duration: timeTaken, mode: `${activeTab} ${subOption} ` });
            void saveResult(finalWpm, finalAcc, timeTaken);
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

    // Line tracking for scroll
    useEffect(() => {
        if (status === "idle") {
            const timer = setTimeout(() => setTranslateY(0), 0);
            return () => clearTimeout(timer);
        }

        if (!activeCharRef.current) return;
        const charTop = activeCharRef.current.offsetTop;

        // Use the container's actual computed line-height to ensure we scroll the correct amount
        const parentElem = activeCharRef.current.parentElement?.parentElement;
        if (!parentElem) return;

        const computedLineHeight = window.getComputedStyle(parentElem).lineHeight;
        const lineHeight = parseFloat(computedLineHeight) || activeCharRef.current.offsetHeight;

        if (lineHeight === 0) return;

        // Add a tiny buffer (2px) to charTop to avoid subpixel rounding issues that might place it on the previous line index
        const lineIndex = Math.floor((charTop + 2) / lineHeight);
        // Keep 3 lines visible: scroll up if line index exceeds 1
        const newTranslate = lineIndex > 1 ? (lineIndex - 1) * lineHeight : 0;
        const timer = setTimeout(() => setTranslateY(newTranslate), 0);
        return () => clearTimeout(timer);
    }, [typedChars, status]);

    useEffect(() => {
        focusInput();
    }, [activeTab, subOption, focusInput]);

    // Format text for rendering
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

                let charStatusClass = "text-text-dim";
                if (typedChar != null) {
                    if (typedChar === char) {
                        charStatusClass = "text-accent drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]";
                    } else {
                        charStatusClass = "text-error-text bg-error-bg/60 rounded-sm";
                    }
                }

                const isCurrent = index === typedChars.length;

                return (
                    <span
                        key={cIdx}
                        ref={isCurrent ? activeCharRef : null}
                        className={`relative transition-colors duration-100 ${charStatusClass}`}
                    >
                        {isCurrent && status !== "finished" && (
                            <span className="absolute -left-px top-[10%] w-0.75 h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                        )}
                        {char}
                    </span>
                );
            });

            // Space character
            const spaceIndex = globalIndex + wordLen;
            const spaceTyped = typedChars[spaceIndex];
            const isSpaceCurrent = spaceIndex === typedChars.length;

            let spaceStatusClass = "text-text-dim";
            if (spaceTyped != null) {
                if (spaceTyped === " ") {
                    spaceStatusClass = "text-accent";
                } else {
                    spaceStatusClass = "text-error-text bg-error-bg/60 rounded-sm";
                }
            }

            globalIndex += wordLen + (isLastWord ? 0 : 1);

            return (
                <span key={wIdx} className="inline-block">
                    {wordNodes}
                    {!isLastWord && (
                        <span
                            ref={isSpaceCurrent ? activeCharRef : null}
                            className={`relative transition-colors duration-100 ${spaceStatusClass}`}
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

    return (
        <div className="w-full max-w-5xl flex flex-col items-center relative" onClick={focusInput}>



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
                        className="w-full relative mt-8 mb-4"
                    >
                        {/* Status Bar */}
                        <div className={`w - full flex items - center justify - between font - mono text - accent mb - 6 transition - all duration - 300 ${status === "playing" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"} `}>
                            <div className="flex gap-6 items-center bg-panel-bg/50 backdrop-blur-sm border border-border-dim px-6 py-2 rounded-2xl shadow-xl">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest">WPM</span>
                                    <span className="text-xl font-bold">{wpm}</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest">ACC</span>
                                    <span className="text-xl font-bold">{accuracy}%</span>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center bg-panel-bg/50 backdrop-blur-sm border border-border-dim px-6 py-2 rounded-2xl shadow-xl">
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-text-dim uppercase tracking-widest">{mode === "time" ? "TIME" : "PROGRESS"}</span>
                                    <span className="text-xl font-bold text-white">{mode === "time" ? timeLeft : Math.floor((typedChars.length / (text.length || 1)) * 100)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Typing Area */}
                        <div
                            className="w-full font-mono text-2xl sm:text-[2rem] leading-[1.6] tracking-tight text-left bg-panel-bg/20 p-8 sm:p-12 rounded-4xl border border-white/5 shadow-2xl relative overflow-hidden"
                            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
                        >
                            {/* Using 4.8em for exactly 3 lines of visible text (3 * 1.6) with fade masks so cut-offs are unnoticeable */}
                            <div
                                className="h-[4.8em] overflow-hidden relative z-10 w-full rounded-lg"
                                style={{
                                    maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
                                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
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

                        <div className="w-full flex justify-center gap-4 mt-12 mb-8 items-center bg-transparent z-20">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={(e) => { e.stopPropagation(); restartText(); }}
                                className="group shadow-xl flex items-center gap-3 bg-panel-bg/50 border-border-dim hover:border-white/20 hover:bg-white/10"
                                aria-label="Restart Test (Esc)"
                                title="Restart identical test"
                            >
                                <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500 ease-in-out" />
                                <span className="font-semibold text-sm">Restart</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setText(getNewText());
                                    restartText();
                                }}
                                className="group shadow-xl flex items-center gap-3 bg-panel-bg/50 border-border-dim hover:border-white/20 hover:bg-white/10"
                                aria-label="Shuffle Words"
                                title="Generate new words"
                            >
                                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500 ease-in-out" />
                                <span className="font-semibold text-sm">Shuffle</span>
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="typing-finished"
                        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        className="w-full flex flex-col mt-8 py-12 px-10 bg-panel-bg/40 backdrop-blur-xl border border-border-dim rounded-[40px] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {/* Main Stat */}
                            <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                                <h1 className="text-[6rem] sm:text-[8rem] font-mono font-bold text-white leading-none tracking-tight drop-shadow-2xl">
                                    {wpm}
                                </h1>
                                <span className="text-xl font-mono text-accent uppercase tracking-[0.2em] ml-2 font-bold mt-2">Words Per Minute</span>
                            </div>

                            {/* Sub Stats */}
                            <div className="flex flex-col justify-center gap-6">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col">
                                    <span className="text-text-dim font-mono text-xs uppercase tracking-widest mb-1">Accuracy</span>
                                    <span className="text-4xl font-mono font-bold text-white">{accuracy}%</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                        <span className="text-text-dim font-mono text-[10px] uppercase tracking-widest mb-1">Time</span>
                                        <span className="text-2xl font-mono font-bold text-white">{mode === "time" ? limit - timeLeft : 0}s</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                                        <span className="text-text-dim font-mono text-[10px] uppercase tracking-widest mb-1">Chars</span>
                                        <span className="text-2xl font-mono font-bold text-white">{typedChars.length}/{text.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent my-10" />

                        <div className="flex flex-wrap gap-4 font-sans justify-between items-center relative z-20">
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    onClick={(e) => { e.stopPropagation(); restartText(); }}
                                    className="gap-2 px-8 py-6 rounded-2xl shadow-lg border-white/10 text-white font-bold"
                                >
                                    <RotateCcw size={18} /> Retry Test
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="gap-2 px-8 py-6 rounded-2xl font-bold"
                                >
                                    <Share2 size={18} /> Copy Results
                                </Button>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setText(getNewText());
                                    restartText();
                                }}
                                className="gap-3 px-10 py-6 rounded-2xl font-bold"
                            >
                                Next Test <ArrowRight size={18} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

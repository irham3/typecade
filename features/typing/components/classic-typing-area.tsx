import { useEffect, useState, useCallback, useRef } from "react";
import { useClassicTypingEngine } from "../hooks/use-classic-typing-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { generateQuote, generateWords } from "@/lib/words";
import { TypingResults } from "./typing-results";
import { getSupabaseClient } from "@/lib/supabase/client";
import { sanitizeTestResult } from "@/lib/utils/validation";
import { useAuth } from "@/lib/auth/auth-context";
import { playTypeSound, playComboSound } from "@/lib/utils/sound";
import { VirtualKeyboard } from "@/components/virtual-keyboard";

export function ClassicTypingView({ activeTab, subOption, customText, customShuffle }: { activeTab: string; subOption: string; customText?: string; customShuffle?: boolean }) {
    const { user, supabaseReady } = useAuth();
    const language = useStore(state => state.language);
    const usePunctuation = useStore(state => state.punctuation);
    const useNumbers = useStore(state => state.numbers);
    const sound = useStore(state => state.sound);

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
    const setIsTyping = useStore(state => state.setIsTyping);

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
        const safe = sanitizeTestResult(finalWpm, finalAcc, timeTaken);
        const { error } = await client.from("typing_tests").insert({
            user_id: user.id,
            mode,
            mode_value: modeValue,
            language,
            wpm: safe.wpm,
            accuracy: safe.accuracy,
            duration_seconds: safe.durationSeconds,
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

    const prevInputRef = useRef("");
    const prevWordIndexRef = useRef(0);
    const comboRef = useRef(0);

    useEffect(() => {
        setIsTyping(status === "playing");
        return () => setIsTyping(false);
    }, [status, setIsTyping]);

    useEffect(() => {
        if (status === "playing" && sound !== "off") {
            const hasNewChar = currentInput.length > prevInputRef.current.length;
            const hasNewWord = currentWordIndex > prevWordIndexRef.current;

            if (hasNewChar || hasNewWord) {
                const targetWord = words[currentWordIndex] || "";
                const targetChar = hasNewWord ? " " : targetWord[currentInput.length - 1];
                const isError = hasNewChar && currentInput[currentInput.length - 1] !== targetChar;

                playTypeSound(sound, isError);
                
                if (isError) {
                    comboRef.current = 0;
                } else {
                    comboRef.current += 1;
                    if (sound === "arcade" && comboRef.current > 0 && comboRef.current % 10 === 0) {
                        playComboSound(sound, Math.floor(comboRef.current / 10));
                    }
                }
            }
        } else if (status === "idle") {
            comboRef.current = 0;
        }
        prevInputRef.current = currentInput;
        prevWordIndexRef.current = currentWordIndex;
    }, [currentInput, currentWordIndex, status, sound, words]);

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

    // Trigger native input changes programmatically from the Virtual Keyboard
    const handleVirtualKeyPress = useCallback((char: string) => {
        if (!inputRef.current) return;
        
        const input = inputRef.current;
        let currentValue = input.value;
        
        if (char === "Backspace") {
            currentValue = currentValue.slice(0, -1);
        } else {
            currentValue += char;
        }

        // Trick React into firing its native synthetic onChange event by manually triggering the setter
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeSetter?.call(input, currentValue);
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
    }, [inputRef]);

    // Focus and blur are now handled directly on the <input> element's onFocus and onBlur props

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
        const handleShortcutKeyDown = (e: KeyboardEvent) => {
            // Tab for Restart
            if (e.key === "Tab" && !e.shiftKey) {
                if (status !== "finished") {
                    e.preventDefault();
                    restartText();
                }
            }
            // Shift + Enter for Shuffle
            if (e.shiftKey && e.key === "Enter") {
                e.preventDefault();
                setText(getNewText());
                restartText();
            }
        };

        window.addEventListener("keydown", handleShortcutKeyDown);
        return () => window.removeEventListener("keydown", handleShortcutKeyDown);
    }, [restartText, getNewText, status]);

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
        const newTranslate = lineIndex * lineHeight;
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
                    className += "bg-foreground/10 text-foreground ring-1 ring-foreground/20";
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
                                <div className="w-px h-3 sm:h-4 bg-foreground/10" />
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
                        <div className="w-full relative mt-4">

                            <div className={`w-full relative transition-all duration-700 glass border border-foreground/5 rounded-3xl p-4 sm:p-6 shadow-lg mb-6 ${status === "playing" ? "shadow-[0_0_40px_rgba(var(--accent-rgb),0.15)] border-accent/20 bg-background/30" : ""}`}>
                                <div
                                    className="w-full font-mono text-xl sm:text-2xl tracking-tight text-left relative select-none cursor-default"
                                    onContextMenu={(e) => e.preventDefault()}
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
                        </div>

                        {/* Classic Input Area */}
                        <div className="flex justify-center w-full mb-6 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="none"
                                className={`w-full bg-black/20 border-2 transition-colors rounded-xl font-mono text-2xl text-center py-4 px-6 outline-none shadow-inner ${currentInput && currentInput !== words[currentWordIndex]?.substring(0, currentInput.length)
                                    ? "border-error-text/50 text-error-text bg-error-bg/10"
                                    : "border-foreground/10 hover:border-foreground/20 focus:border-accent/50 text-foreground"
                                    } shadow-inner bg-panel-bg/30 tracking-widest outline-none`}
                                value={currentInput}
                                onChange={handleInput}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onPaste={(e) => e.preventDefault()}
                                onCopy={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                onKeyDown={(e) => {
                                    // Allow Ctrl/Cmd + R (Reload)
                                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') return;
                                    if (e.ctrlKey || e.metaKey) e.preventDefault();
                                }}
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
                                        className="absolute inset-0 z-10 hidden sm:flex items-center justify-center cursor-pointer backdrop-blur-md rounded-xl"
                                        onClick={focusInput}
                                    >
                                        <div className="bg-panel-bg/80 border border-foreground/10 px-6 py-3 rounded-full flex gap-3 items-center shadow-xl">
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
                            <div className="w-full h-0.5 bg-foreground/5 rounded-full mt-4 overflow-hidden max-w-2xl mx-auto">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, rgba(var(--accent-rgb), 0.8), rgba(var(--accent-secondary-rgb), 0.6))",
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

                        {/* Action Bar (Integrated Shortcuts & Buttons) */}
                        <div className="w-full flex justify-center gap-10 sm:gap-16 mt-4 sm:mt-12 text-[12px] sm:text-[13px] uppercase tracking-[0.25em] text-text-dim/60 font-mono select-none">
                            <button
                                onClick={(e) => { e.stopPropagation(); restartText(); }}
                                className="group flex items-center gap-2 sm:gap-4 transition-all hover:text-foreground hover:bg-foreground/5 p-2 sm:px-4 sm:py-2 rounded-xl"
                                title="Restart (Tab)"
                            >
                                <kbd className="hidden sm:inline-block bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">tab</kbd>
                                <span className="flex items-center gap-3">
                                    restart
                                </span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setText(getNewText());
                                    restartText();
                                }}
                                className="group flex items-center gap-2 sm:gap-4 transition-all hover:text-foreground hover:bg-foreground/5 p-2 sm:px-4 sm:py-2 rounded-xl"
                                title="Shuffle Text (Shift + Enter)"
                            >
                                <div className="hidden sm:flex items-center gap-1.5">
                                    <kbd className="bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">shift</kbd>
                                    <span className="text-xs opacity-40">+</span>
                                    <kbd className="bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">enter</kbd>
                                </div>
                                <span className="flex items-center gap-3">
                                    shuffle
                                </span>
                            </button>
                        </div>

                        {/* Interactive Virtual Keyboard For Mobile */}
                        <div className="mt-4 sm:mt-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                            <VirtualKeyboard onKeyPress={handleVirtualKeyPress} />
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

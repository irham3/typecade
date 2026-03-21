import { useEffect, useState, useCallback, useRef } from "react";
import { useTypingEngine } from "../hooks/use-typing-engine";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { Flame } from "lucide-react";
import { generateQuote, generateWords } from "@/lib/words";
import { TypingResults } from "./typing-results";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";

import { playTypeSound } from "@/lib/utils/sound";

interface KeystrokeParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; }

export function TypingView({ activeTab, subOption, customText, customShuffle }: { activeTab: string; subOption: string; customText?: string; customShuffle?: boolean }) {
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

    const activeCharRef = useRef<HTMLSpanElement>(null);
    const [translateY, setTranslateY] = useState(0);
    const pendingResultRef = useRef<{ wpm: number; acc: number; timeTaken: number } | null>(null);
    const [isFocused, setIsFocused] = useState(() =>
        typeof document !== "undefined" && document.activeElement === document.querySelector("input[autofocus]")
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const [resultKey, setResultKey] = useState(0);

    // Smooth caret refs (direct DOM manipulation to avoid setState-in-effect)
    const caretRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        streak,
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

    // --- Visual & Audio Feedback Logic ---
    const particlesCanvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<KeystrokeParticle[]>([]);

    useEffect(() => {
        const canvas = particlesCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let reqId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.life--;
                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // gravity 

                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.5 + alpha * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            reqId = requestAnimationFrame(render);
        };
        reqId = requestAnimationFrame(render);
        return () => cancelAnimationFrame(reqId);
    }, []);

    useEffect(() => {
        const resizeCanvas = () => {
            if (particlesCanvasRef.current && textContainerRef.current) {
                particlesCanvasRef.current.width = textContainerRef.current.offsetWidth;
                particlesCanvasRef.current.height = textContainerRef.current.offsetHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const prevTypedCharsLength = useRef(0);
    useEffect(() => {
        if (typedChars.length > prevTypedCharsLength.current && status === "playing") {
            const lastCharIndex = typedChars.length - 1;
            const isCorrect = typedChars[lastCharIndex] === text[lastCharIndex];

            if (sound !== "off") {
                playTypeSound(sound, !isCorrect);
            }

            if (isCorrect && caretRef.current && textContainerRef.current) {
                const caret = caretRef.current;
                const top = parseFloat(caret.style.top || "0");
                const left = parseFloat(caret.style.left || "0");
                const height = parseFloat(caret.style.height || "0");
                const x = left + 2;
                const y = top + height / 2;

                const count = streak > 50 ? 5 : 2;
                for (let i = 0; i < count; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 2 + 1;
                    let color = "rgba(var(--accent-rgb), 1)";
                    if (streak >= 50) color = "rgba(var(--gold-rgb, 245, 197, 66), 1)";

                    particlesRef.current.push({
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1,
                        life: 1,
                        maxLife: 15 + Math.random() * 15,
                        color
                    });
                }
            }
        }
        prevTypedCharsLength.current = typedChars.length;
    }, [typedChars, text, sound, streak, status]);

    const getWpmColor = (val: number) => {
        if (val < 40) return "text-emerald-400";
        if (val < 70) return "text-cyan-400";
        if (val < 100) return "text-indigo-400";
        return "text-amber-400";
    };
    // ------------------------------------

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

    // Smooth caret position tracking
    useEffect(() => {
        const caret = caretRef.current;
        if (!caret) return;

        if (status === "finished" || !activeCharRef.current) {
            caret.style.opacity = "0";
            return;
        }

        const char = activeCharRef.current;

        caret.style.opacity = isFocused ? "1" : "0";
        caret.style.height = `${char.offsetHeight * 0.8}px`;
        caret.style.top = `${char.offsetTop + char.offsetHeight * 0.1}px`;
        caret.style.left = `${char.offsetLeft - 1.5}px`;
    }, [typedChars, status, text, isFocused]);

    // Typing activity tracking — toggle blink class directly on DOM
    useEffect(() => {
        const caret = caretRef.current;
        if (!caret) return;

        if (status !== "playing") {
            caret.classList.add("animate-caret-blink");
            return;
        }

        // Actively typing — solid caret, no blink
        caret.classList.remove("animate-caret-blink");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Resume blink after 500ms of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            caretRef.current?.classList.add("animate-caret-blink");
        }, 500);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [typedChars, status]);

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
                    } else if (typedChar === " " && char !== " ") {
                        // "Skipped" indicator: Underline instead of red text
                        charStatusClass = "text-text-dim/40 border-b-2 border-error-text/80";
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
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    const showBlurOverlay = !isFocused && status !== "finished";

    return (
        <div className="w-full flex flex-col items-center relative" ref={containerRef} onClick={focusInput}>

            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute -top-2499.75"
                value={typedChars}
                onChange={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
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
                                ? "opacity-100 h-8 sm:h-10 mb-2 sm:mb-3"
                                : "opacity-0 h-0 mb-0"
                                }`}
                        >
                            <div className="flex items-center gap-3 sm:gap-5">
                                <div className="flex items-baseline gap-1 sm:gap-1.5">
                                    <span className={`text-lg sm:text-2xl font-bold tabular-nums drop-shadow-md transition-colors duration-300 ${getWpmColor(wpm)}`} style={{ textShadow: "0 0 15px currentColor" }}>{wpm}</span>
                                    <span className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-widest">wpm</span>
                                </div>
                                <div className="w-px h-3 sm:h-4 bg-foreground/10" />
                                <div className="flex items-baseline gap-1 sm:gap-1.5">
                                    <span className="text-lg sm:text-2xl font-bold text-foreground/80 tabular-nums">{accuracy}</span>
                                    <span className="text-[9px] sm:text-[10px] text-text-dim uppercase tracking-widest">%</span>
                                </div>
                                {streak > 4 && (
                                    <>
                                        <div className="w-px h-3 sm:h-4 bg-foreground/10" />
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <Flame size={14} className={streak >= 50 ? "text-amber-500 animate-pulse" : "text-amber-500/80"} />
                                            <span className={`text-lg sm:text-2xl font-bold tabular-nums ${streak >= 50 ? "text-amber-500" : "text-amber-500/80"}`} style={streak >= 50 ? { textShadow: "0 0 15px currentColor" } : {}}>{streak}</span>
                                        </div>
                                    </>
                                )}
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

                        {/* Typing Area */}
                        <div className="w-full relative">
                            <div
                                className="w-full font-mono text-xl sm:text-2xl leading-[1.8] tracking-tight text-left py-2 sm:py-4 relative cursor-text select-none text-text-dim/80"
                            >
                                <div
                                    ref={textContainerRef}
                                    className="h-[5.4em] overflow-hidden relative w-full"
                                    style={{
                                        maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                                    }}
                                >
                                    <div
                                        className="transition-transform duration-300 ease-out relative text-left w-full h-full"
                                        style={{ transform: `translateY(-${translateY}px)` }}
                                    >
                                        {/* Smooth animated caret — directly inside the moving container */}
                                        <div
                                            ref={caretRef}
                                            className="absolute z-10 pointer-events-none rounded-full bg-accent will-change-transform animate-caret-blink"
                                            style={{
                                                width: 3,
                                                opacity: 0,
                                                transition: "left 80ms ease-out, top 80ms ease-out",
                                                boxShadow: "0 0 8px 1px rgba(var(--accent-rgb), 0.4)",
                                            }}
                                        />

                                        {renderText()}
                                    </div>

                                    {/* Particle Overlay */}
                                    <canvas ref={particlesCanvasRef} className="absolute inset-0 pointer-events-none z-0" style={{ mixBlendMode: 'plus-lighter' }} />
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
                                        className="absolute -inset-4 z-10 flex items-center justify-center cursor-pointer backdrop-blur-[6px] rounded-lg"
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
                            <div className="w-full h-0.5 bg-foreground/5 rounded-full mt-2 overflow-hidden">
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
                        <div className="w-full flex justify-center gap-10 sm:gap-16 mt-12 text-[12px] sm:text-[13px] uppercase tracking-[0.25em] text-text-dim/60 font-mono select-none">
                            <button
                                onClick={(e) => { e.stopPropagation(); restartText(); }}
                                className="group flex items-center gap-4 transition-all hover:text-foreground hover:bg-foreground/5 px-4 py-2 rounded-xl"
                                title="Restart (Tab)"
                            >
                                <kbd className="bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">tab</kbd>
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
                                className="group flex items-center gap-4 transition-all hover:text-foreground hover:bg-foreground/5 px-4 py-2 rounded-xl"
                                title="Shuffle Text (Shift + Enter)"
                            >
                                <div className="flex items-center gap-1.5">
                                    <kbd className="bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">shift</kbd>
                                    <span className="text-xs opacity-40">+</span>
                                    <kbd className="bg-foreground/5 px-2 py-1 rounded-md border border-foreground/10 text-text-dim/90 text-[11px] normal-case tracking-normal transition-colors group-hover:bg-foreground/10 group-hover:border-foreground/20 group-hover:text-foreground shadow-sm">enter</kbd>
                                </div>
                                <span className="flex items-center gap-3">
                                    shuffle
                                </span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    /* ── Results Screen — redesigned with Confetti, PB, and Share Card ── */
                    <TypingResults
                        wpm={wpm}
                        accuracy={accuracy}
                        mode={mode}
                        limit={limit}
                        typedCharsLength={typedChars.length}
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

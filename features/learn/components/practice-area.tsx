import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypingEngine } from "@/features/typing/hooks/use-typing-engine";
import { Lesson, KEY_FINGER_MAP, Finger } from "../data/lessons";
import { HandVisualizer } from "./hand-visualizer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, CheckCircle, ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { playTypeSound } from "@/lib/utils/sound";

type PracticeProps = {
    lesson: Lesson;
    onBack: () => void;
    onComplete: (stats: { wpm: number; accuracy: number }) => void;
};

export function PracticeArea({ lesson, onBack, onComplete }: PracticeProps) {
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const caretRef = useRef<HTMLDivElement>(null);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [translateY, setTranslateY] = useState(0);
    const [isFocused, setIsFocused] = useState(true);
    const sound = useStore(state => state.sound);

    const {
        status,
        typedChars,
        wpm,
        accuracy,
        inputRef,
        handleInput,
        restartText,
    } = useTypingEngine({
        text: lesson.text,
        duration: 0, // No time limit for lessons, it's 'quote' mode essentially
        mode: "quote",
    });

    const focusInput = useCallback(() => {
        if (inputRef.current && status !== "finished") {
            inputRef.current.focus();
        }
    }, [inputRef, status]);

    useEffect(() => focusInput(), [focusInput]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onBack();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onBack]);

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

    // Smooth caret position tracking — direct DOM manipulation
    useEffect(() => {
        const caret = caretRef.current;
        if (!caret) return;

        if (status === "finished" || !activeCharRef.current || !textContainerRef.current) {
            caret.style.opacity = "0";
            return;
        }

        const char = activeCharRef.current;
        const container = textContainerRef.current;
        const containerRect = container.getBoundingClientRect();
        const charRect = char.getBoundingClientRect();

        caret.style.opacity = isFocused ? "1" : "0";
        caret.style.height = `${charRect.height * 0.8}px`;
        caret.style.top = `${charRect.top - containerRect.top + charRect.height * 0.1}px`;
        caret.style.left = `${charRect.left - containerRect.left - 1}px`;
    }, [typedChars, status, translateY, lesson.text, isFocused]);

    // Typing activity tracking — toggle blink class directly on DOM
    useEffect(() => {
        const caret = caretRef.current;
        if (!caret) return;

        if (status !== "playing") {
            caret.classList.add("animate-caret-blink");
            return;
        }

        caret.classList.remove("animate-caret-blink");

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            caretRef.current?.classList.add("animate-caret-blink");
        }, 500);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [typedChars, status]);

    const prevTypedCharsLength = useRef(0);
    useEffect(() => {
        if (typedChars.length > prevTypedCharsLength.current && status === "playing") {
            const lastCharIndex = typedChars.length - 1;
            const isCorrect = typedChars[lastCharIndex] === lesson.text[lastCharIndex];

            if (sound !== "off") {
                playTypeSound(sound, !isCorrect);
            }
        }
        prevTypedCharsLength.current = typedChars.length;
    }, [typedChars, lesson.text, sound, status]);

    const activeIndex = typedChars.length;
    const nextChar = status === "finished" ? null : lesson.text[activeIndex];
    const activeFingers: Finger[] = [];
    if (nextChar) {
        const baseKey = nextChar.toLowerCase();
        const mainFinger = KEY_FINGER_MAP[baseKey];
        if (mainFinger) activeFingers.push(mainFinger);

        if (/^[A-Z~!@#$%^&*()_+{}|:"<>?]$/.test(nextChar) && mainFinger) {
            const isLeftHandLetter = mainFinger.startsWith('L_');
            const isRightHandLetter = mainFinger.startsWith('R_');
            if (isLeftHandLetter) activeFingers.push('R_PINKY'); // Left hand types => Right Shift
            else if (isRightHandLetter) activeFingers.push('L_PINKY'); // Right hand types => Left Shift
            else { activeFingers.push('L_PINKY'); activeFingers.push('R_PINKY'); }
        }
    }

    const renderText = () => {
        const words = lesson.text.split(" ");
        let globalIndex = 0;

        return words.map((word: string, wIdx: number) => {
            const wordLen = word.length;
            const wordChars = word.split("");
            const isLastWord = wIdx === words.length - 1;

            const wordNodes = wordChars.map((char: string, cIdx: number) => {
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

                const isCurrent = index === activeIndex;

                return (
                    <span
                        key={cIdx}
                        ref={isCurrent ? activeCharRef : null}
                        className={`relative transition-colors duration-100 ${charStatusClass}`}
                    >
                        {char}
                    </span>
                );
            });

            const spaceIndex = globalIndex + wordLen;
            const spaceTyped = typedChars[spaceIndex];
            const isSpaceCurrent = spaceIndex === activeIndex;

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
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
            {/* Top bar — minimal */}
            <div className="w-full flex items-center justify-between mb-6">
                <Button variant="ghost" className="text-text-dim hover:text-white gap-2 px-3" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
                </Button>
                <span className="text-xs font-mono text-text-dim/50 tracking-widest uppercase">
                    LESSON {lesson.id}
                </span>
            </div>

            {/* Main card */}
            <div className="w-full glass rounded-[20px] sm:rounded-3xl border border-white/5 p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-100 h-37.5 bg-accent/8 blur-[100px] rounded-full pointer-events-none" />

                {/* Lesson Header — compact */}
                <div className="relative z-10 mb-4 sm:mb-6 text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-medium text-white mb-1.5 sm:mb-2">{lesson.title}</h2>
                    <p className="text-text-dim text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">{lesson.instruction}</p>
                </div>

                <AnimatePresence mode="wait">
                    {status === "finished" ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative z-10 flex flex-col items-center py-10"
                        >
                            <div className="w-16 h-16 bg-accent/15 border border-accent/20 rounded-full flex items-center justify-center mb-5 text-accent">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-display font-medium mb-8 text-white">Lesson Completed</h3>

                            <div className="flex gap-6 sm:gap-12 mb-8 sm:mb-10 flex-wrap justify-center">
                                <div className="text-center">
                                    <span className="block text-text-dim text-[10px] sm:text-[11px] uppercase tracking-[0.2em] mb-1.5 sm:mb-2 font-mono">Speed</span>
                                    <span className="text-3xl sm:text-4xl font-mono text-accent font-bold">{wpm}</span>
                                    <span className="text-xs sm:text-sm text-text-dim/50 ml-1">wpm</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-text-dim text-[10px] sm:text-[11px] uppercase tracking-[0.2em] mb-1.5 sm:mb-2 font-mono">Accuracy</span>
                                    <span className="text-3xl sm:text-4xl font-mono text-white font-bold">{accuracy}</span>
                                    <span className="text-xs sm:text-sm text-text-dim/50 ml-1">%</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" className="gap-2 px-5" onClick={restartText}>
                                    <RotateCcw size={15} /> Retry
                                </Button>
                                <Button variant="primary" className="gap-2 px-6" onClick={() => onComplete({ wpm, accuracy })}>
                                    Continue <ArrowRight size={15} />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="practice"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex flex-col"
                        >
                            {/* Hidden Input field for capture */}
                            {/* We no longer overlay it to prevent selection, just render logic below */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={typedChars}
                                onChange={handleInput}
                                onPaste={(e) => e.preventDefault()}
                                onCopy={(e) => e.preventDefault()}
                                onCut={(e) => e.preventDefault()}
                                onKeyDown={(e) => {
                                    // Allow Ctrl/Cmd + R (Reload)
                                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') return;
                                    if (e.ctrlKey || e.metaKey) e.preventDefault();
                                }}
                                className="absolute opacity-0 -top-25"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                autoComplete="off"
                            />

                            {/* Text Area */}
                            <div 
                                className="bg-[#0A0A0A] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 md:p-8 mb-4 sm:mb-6 font-mono text-lg sm:text-2xl md:text-3xl leading-relaxed tracking-tight relative cursor-text group"
                                onClick={focusInput}
                            >
                                <div
                                    ref={textContainerRef}
                                    className="h-[4.5em] overflow-hidden relative w-full"
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
                                    
                                    {/* Smooth animated caret — positioned via ref */}
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
                                </div>
                            </div>

                            {/* Keyboard Visualizer & Fingers merged overlay — hidden on mobile */}
                            <div className="relative w-full max-w-2xl mx-auto hidden sm:flex flex-col items-center select-none pointer-events-none mt-2">
                                <KeyboardVisualizer targetKeys={lesson.targetKeys} nextKey={nextChar} />
                                <div className="absolute inset-x-0 -bottom-10 pointer-events-none transform translate-y-16">
                                    <HandVisualizer activeFingers={activeFingers} activeKey={nextChar} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom shortcut hint */}
            <p className="text-text-dim/30 text-[11px] font-mono mt-6 flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30">Esc</kbd>
                <span>to go back</span>
            </p>
        </div>
    );
}

// Simple Keyboard Visualizer
function KeyboardVisualizer({ targetKeys, nextKey }: { targetKeys: string[], nextKey: string | null }) {
    const KEYBOARD_ROWS = [
        [
            { id: '`', label: '`', w: 'w-7 sm:w-10' }, { id: '1', label: '1', w: 'w-7 sm:w-10' }, { id: '2', label: '2', w: 'w-7 sm:w-10' }, { id: '3', label: '3', w: 'w-7 sm:w-10' }, { id: '4', label: '4', w: 'w-7 sm:w-10' }, { id: '5', label: '5', w: 'w-7 sm:w-10' }, { id: '6', label: '6', w: 'w-7 sm:w-10' }, { id: '7', label: '7', w: 'w-7 sm:w-10' }, { id: '8', label: '8', w: 'w-7 sm:w-10' }, { id: '9', label: '9', w: 'w-7 sm:w-10' }, { id: '0', label: '0', w: 'w-7 sm:w-10' }, { id: '-', label: '-', w: 'w-7 sm:w-10' }, { id: '=', label: '=', w: 'w-7 sm:w-10' }, { id: 'Backspace', label: '←', w: 'w-[60px] sm:w-[84px] lg:w-[88px]' }
        ],
        [
            { id: 'Tab', label: 'Tab', w: 'w-[44px] sm:w-[62px] lg:w-[64px]' }, { id: 'q', label: 'Q', w: 'w-7 sm:w-10' }, { id: 'w', label: 'W', w: 'w-7 sm:w-10' }, { id: 'e', label: 'E', w: 'w-7 sm:w-10' }, { id: 'r', label: 'R', w: 'w-7 sm:w-10' }, { id: 't', label: 'T', w: 'w-7 sm:w-10' }, { id: 'y', label: 'Y', w: 'w-7 sm:w-10' }, { id: 'u', label: 'U', w: 'w-7 sm:w-10' }, { id: 'i', label: 'I', w: 'w-7 sm:w-10' }, { id: 'o', label: 'O', w: 'w-7 sm:w-10' }, { id: 'p', label: 'P', w: 'w-7 sm:w-10' }, { id: '[', label: '[', w: 'w-7 sm:w-10' }, { id: ']', label: ']', w: 'w-7 sm:w-10' }, { id: '\\', label: '\\', w: 'w-[44px] sm:w-[62px] lg:w-[64px]' }
        ],
        [
            { id: 'Caps', label: 'Caps', w: 'w-[52px] sm:w-[73px] lg:w-[76px]' }, { id: 'a', label: 'A', w: 'w-7 sm:w-10' }, { id: 's', label: 'S', w: 'w-7 sm:w-10' }, { id: 'd', label: 'D', w: 'w-7 sm:w-10' }, { id: 'f', label: 'F', w: 'w-7 sm:w-10' }, { id: 'g', label: 'G', w: 'w-7 sm:w-10' }, { id: 'h', label: 'H', w: 'w-7 sm:w-10' }, { id: 'j', label: 'J', w: 'w-7 sm:w-10' }, { id: 'k', label: 'K', w: 'w-7 sm:w-10' }, { id: 'l', label: 'L', w: 'w-7 sm:w-10' }, { id: ';', label: ';', w: 'w-7 sm:w-10' }, { id: '\'', label: '\'', w: 'w-7 sm:w-10' }, { id: 'Enter', label: 'Enter', w: 'w-[68px] sm:w-[95px] lg:w-[100px]' }
        ],
        [
            { id: 'Shift', label: 'Shift', w: 'w-[68px] sm:w-[95px] lg:w-[100px]' }, { id: 'z', label: 'Z', w: 'w-7 sm:w-10' }, { id: 'x', label: 'X', w: 'w-7 sm:w-10' }, { id: 'c', label: 'C', w: 'w-7 sm:w-10' }, { id: 'v', label: 'V', w: 'w-7 sm:w-10' }, { id: 'b', label: 'B', w: 'w-7 sm:w-10' }, { id: 'n', label: 'N', w: 'w-7 sm:w-10' }, { id: 'm', label: 'M', w: 'w-7 sm:w-10' }, { id: ',', label: ',', w: 'w-7 sm:w-10' }, { id: '.', label: '.', w: 'w-7 sm:w-10' }, { id: '/', label: '/', w: 'w-7 sm:w-10' }, { id: 'Shift', label: 'Shift', w: 'w-[84px] sm:w-[117px] lg:w-[124px]' }
        ]
    ];

    const SHIFT_MAP: Record<string, string> = {
        '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=',
        '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
    };

    const isMatch = (key: string, target: string) => {
        const unshiftedTarget = SHIFT_MAP[target] || target.toLowerCase();
        return key.toLowerCase() === unshiftedTarget;
    };

    const requiresShift = (char: string) => {
        return /^[A-Z~!@#$%^&*()_+{}|:"<>?]$/.test(char);
    };

    return (
        <div className="w-full flex flex-col gap-1.5 sm:gap-2 items-center bg-[#0F0F0F] rounded-t-3xl rounded-b-xl p-4 sm:p-8 pb-16 border-t border-x border-white/5 relative z-0 overflow-hidden">
            {KEYBOARD_ROWS.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1 lg:gap-2 w-full justify-center">
                    {row.map((k, i) => {
                        const isTarget = targetKeys.some(tk => isMatch(k.id, tk));
                        const isNext = nextKey && isMatch(k.id, nextKey);
                        let isNextShift = false;
                        if (nextKey && requiresShift(nextKey) && k.id === 'Shift') {
                            const finger = KEY_FINGER_MAP[nextKey.toLowerCase()];
                            const isLeftHandLetter = finger?.startsWith('L_');
                            const isRightHandLetter = finger?.startsWith('R_');

                            // Left Shift is index 0 in its row (rIdx === 3)
                            // Right Shift is index 11 in its row (rIdx === 3)
                            const isLeftShiftKey = i === 0;
                            const isRightShiftKey = i === 11;

                            if (isLeftHandLetter && isRightShiftKey) isNextShift = true;
                            else if (isRightHandLetter && isLeftShiftKey) isNextShift = true;
                            else if (!isLeftHandLetter && !isRightHandLetter) isNextShift = true; // both if unknown
                        }

                        let bg = "bg-white/5 border-white/10 text-white/30";
                        if (isNext || isNextShift) bg = "bg-accent border-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] z-10 scale-110";
                        else if (isTarget) bg = "bg-white/20 border-white/30 text-white";

                        return (
                            <div key={i} className={`${k.w} h-10 sm:h-12 rounded-md sm:rounded-lg border-b-4 border-x border-t flex items-center justify-center text-[9px] sm:text-[11px] lg:text-xs font-mono font-bold transition-all ${bg}`}>
                                {k.label}
                            </div>
                        );
                    })}
                </div>
            ))}

            <div className={`w-[60%] max-w-87.5 h-10 sm:h-12 rounded-lg border-b-4 border-x border-t mt-2 transition-all ${nextKey === " " ? "bg-accent border-accent shadow-[0_0_15px_rgba(99,102,241,0.6)]" : "bg-white/5 border-white/10"}`} />
        </div>
    );
}

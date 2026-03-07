import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypingEngine } from "@/features/typing/hooks/use-typing-engine";
import { Lesson, KEY_FINGER_MAP, Finger } from "../data/lessons";
import { HandVisualizer } from "./hand-visualizer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, CheckCircle, ArrowRight } from "lucide-react";

type PracticeProps = {
    lesson: Lesson;
    onBack: () => void;
    onComplete: (stats: { wpm: number; accuracy: number }) => void;
};

export function PracticeArea({ lesson, onBack, onComplete }: PracticeProps) {
    const activeCharRef = useRef<HTMLSpanElement>(null);
    const [translateY, setTranslateY] = useState(0);

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

    // Handle smooth scrolling like the main typing area
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
                        {isCurrent && status !== "finished" && (
                            <span className="absolute -left-px top-[10%] w-[3px] h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                        )}
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
                            {isSpaceCurrent && status !== "finished" && (
                                <span className="absolute -left-px top-[10%] w-[3px] h-[80%] bg-accent rounded-full animate-caret-blink z-10" />
                            )}
                            {"\u00A0"}
                        </span>
                    )}
                </span>
            );
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col pt-4">
            <Button variant="ghost" className="w-fit mb-6 text-text-dim hover:text-white" onClick={onBack}>
                <ArrowLeft size={16} className="mr-2" /> Back to Lessons
            </Button>

            <div className="bg-[#1A1A1A] rounded-[24px] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
                {/* Lesson Header */}
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-display font-medium text-foreground mb-3">{lesson.title}</h2>
                    <p className="text-text-dim max-w-2xl mx-auto">{lesson.instruction}</p>
                </div>

                <AnimatePresence mode="wait">
                    {status === "finished" ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center py-12"
                        >
                            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-6 text-accent">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold mb-6">Lesson Completed!</h3>

                            <div className="flex gap-8 mb-10">
                                <div className="text-center">
                                    <span className="block text-text-dim text-sm uppercase tracking-widest mb-1">Speed</span>
                                    <span className="text-4xl font-mono text-accent font-bold">{wpm}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-text-dim text-sm uppercase tracking-widest mb-1">Accuracy</span>
                                    <span className="text-4xl font-mono text-white font-bold">{accuracy}%</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="secondary" onClick={restartText}>
                                    <RotateCcw size={16} className="mr-2" /> Retry
                                </Button>
                                <Button variant="primary" onClick={() => onComplete({ wpm, accuracy })}>
                                    Continue <ArrowRight size={16} className="ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="practice"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col"
                        >
                            {/* Hidden Input field for mobile/system capture */}
                            {/* Need full coverage like typing-area */}
                            <div
                                className="absolute inset-0 z-50 cursor-text"
                                onClick={focusInput}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={typedChars}
                                    onChange={handleInput}
                                    className="absolute opacity-0 -top-[100px]"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Text Area */}
                            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 sm:p-10 mb-8 font-mono text-2xl sm:text-3xl leading-relaxed tracking-tight relative">
                                <div
                                    className="h-[4.8em] overflow-hidden"
                                    style={{
                                        maskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
                                        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
                                    }}
                                >
                                    <div
                                        className="transition-transform duration-300 ease-out"
                                        style={{ transform: `translateY(-${translateY}px)` }}
                                    >
                                        {renderText()}
                                    </div>
                                </div>
                            </div>

                            {/* Keyboard Visualizer & Fingers merged overlay */}
                            <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center select-none pointer-events-none mt-4">
                                <KeyboardVisualizer targetKeys={lesson.targetKeys} nextKey={nextChar} />
                                <div className="absolute inset-x-0 -bottom-10 pointer-events-none transform translate-y-16">
                                    <HandVisualizer activeFingers={activeFingers} activeKey={nextChar} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
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

            <div className={`w-[60%] max-w-[350px] h-10 sm:h-12 rounded-lg border-b-4 border-x border-t mt-2 transition-all ${nextKey === " " ? "bg-accent border-accent shadow-[0_0_15px_rgba(99,102,241,0.6)]" : "bg-white/5 border-white/10"}`} />
        </div>
    );
}

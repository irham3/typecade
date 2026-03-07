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
    const activeFinger: Finger | null = nextChar ? (KEY_FINGER_MAP[nextChar.toLowerCase()] || null) : null;

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
                                    <HandVisualizer activeFinger={activeFinger} activeKey={nextChar} />
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
    const rows = [
        "1234567890".split(""),
        "QWERTYUIOP".split(""),
        "ASDFGHJKL;".split(""),
        "ZXCVBNM,.".split("")
    ];

    const isMatch = (key: string, target: string) => key.toLowerCase() === target.toLowerCase();

    return (
        <div className="w-full flex flex-col gap-2 items-center bg-[#0F0F0F] rounded-t-3xl rounded-b-xl p-8 pb-16 border-t border-x border-white/5 relative z-0">
            {rows.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1.5 sm:gap-2" style={{ marginLeft: `${rIdx * 1.5}rem` }}>
                    {row.map(key => {
                        const isTarget = targetKeys.some(tk => isMatch(key, tk));
                        const isNext = nextKey && isMatch(key, nextKey);
                        let bg = "bg-white/5 border-white/10 text-white/30";
                        if (isNext) bg = "bg-accent border-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] z-10 scale-110";
                        else if (isTarget) bg = "bg-white/20 border-white/30 text-white";

                        return (
                            <div key={key} className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-b-4 border-x border-t flex items-center justify-center text-xs sm:text-sm font-mono font-bold transition-all ${bg}`}>
                                {key}
                            </div>
                        );
                    })}
                </div>
            ))}

            <div className={`w-[60%] max-w-[350px] h-10 sm:h-12 rounded-lg border-b-4 border-x border-t mt-2 transition-all ${nextKey === " " ? "bg-accent border-accent shadow-[0_0_15px_rgba(99,102,241,0.6)]" : "bg-white/5 border-white/10"}`} />
        </div>
    );
}

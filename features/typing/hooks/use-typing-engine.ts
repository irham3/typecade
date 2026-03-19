import { useState, useEffect, useRef, useCallback } from 'react';

export type GameStatus = "idle" | "playing" | "finished";

interface UseTypingEngineProps {
    text: string;
    duration?: number;
    wordCount?: number;
    mode: "time" | "words" | "quote" | "custom";
    isFocused?: boolean;
    onFinish?: (wpm: number, acc: number, time: number) => void;
}

export function useTypingEngine({ text, duration = 60, mode, isFocused = true, onFinish }: UseTypingEngineProps) {
    const [status, setStatus] = useState<GameStatus>("idle");
    const [timeLeft, setTimeLeft] = useState(duration);
    const [typedChars, setTypedChars] = useState("");
    const [errors, setErrors] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [streak, setStreak] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [accumulatedPause, setAccumulatedPause] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const pauseStartRef = useRef<number | null>(null);
    const lastLockedIndexRef = useRef<number>(-1);

    // Refs for stable callbacks
    const typedCharsRef = useRef(typedChars);
    const textRef = useRef(text);
    const startTimeRef = useRef(startTime);
    const accumulatedPauseRef = useRef(accumulatedPause);

    useEffect(() => { typedCharsRef.current = typedChars; }, [typedChars]);
    useEffect(() => { textRef.current = text; }, [text]);
    useEffect(() => { startTimeRef.current = startTime; }, [startTime]);
    useEffect(() => { accumulatedPauseRef.current = accumulatedPause; }, [accumulatedPause]);

    useEffect(() => {
        if (status !== "playing") return;
        if (!isFocused && pauseStartRef.current === null) {
            pauseStartRef.current = Date.now();
        } else if (isFocused && pauseStartRef.current !== null) {
            const pauseTime = Date.now() - pauseStartRef.current;
            setAccumulatedPause(prev => prev + pauseTime);
            pauseStartRef.current = null;
        }
    }, [isFocused, status]);

    const calculateStats = useCallback(() => {
        const _startTime = startTimeRef.current;
        const _typedChars = typedCharsRef.current;
        const _text = textRef.current;

        if (!_startTime) return { wpm: 0, accuracy: 100 };
        let totalPause = accumulatedPauseRef.current;
        if (pauseStartRef.current !== null) {
            totalPause += Date.now() - pauseStartRef.current;
        }
        const timeElapsed = (Date.now() - _startTime - totalPause) / 1000 / 60; // in minutes
        if (timeElapsed <= 0) return { wpm: 0, accuracy: 100 };

        const correctChars = _typedChars.split("").filter((char, i) => char === _text[i]).length;
        const currentWpm = Math.max(0, Math.floor((correctChars / 5) / timeElapsed));
        const currentAcc = Math.max(0, Math.floor((correctChars / Math.max(1, _typedChars.length)) * 100));

        return { wpm: currentWpm, accuracy: currentAcc };
    }, []);

    const completeTest = useCallback(() => {
        setStatus("finished");
        const stats = calculateStats();
        setWpm(stats.wpm);
        setAccuracy(stats.accuracy);
        let totalPause = accumulatedPauseRef.current;
        if (pauseStartRef.current !== null) {
            totalPause += Date.now() - pauseStartRef.current;
        }
        const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current - totalPause) / 1000) : 0;
        if (onFinish) onFinish(stats.wpm, stats.accuracy, timeTaken);
    }, [calculateStats, onFinish]);

    // Handle typing input
    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (status === "finished") return;

        // Handle "per kata" lock & jumping behavior:
        if (value.length > typedChars.length) {
            const lastChar = value[value.length - 1];
            if (lastChar === " ") {
                // "Anggap ganti kata": Jump to the next word boundary immediately (Classic behavior)
                const nextSpaceInText = text.indexOf(" ", typedChars.length);
                if (nextSpaceInText !== -1) {
                    // If we pressed space early, fill the gap with spaces so they count as errors
                    if (nextSpaceInText > value.length - 1) {
                        const missedCount = nextSpaceInText - (value.length - 1);
                        value = value.substring(0, value.length - 1) + " ".repeat(missedCount) + " ";
                    }
                } else {
                    // Last word: Jump to the end of the text
                    if (text.length > value.length - 1) {
                        const missedCount = text.length - (value.length - 1);
                        value = value.substring(0, value.length - 1) + " ".repeat(missedCount);
                    }
                }

                // Lock logic: Only advance the lock if the word completed was 100% correct
                const currentWordStart = lastLockedIndexRef.current + 1;
                const currentWordEnd = value.length - 1;
                const typedWordPart = value.substring(currentWordStart, currentWordEnd);
                const targetWordPart = text.substring(currentWordStart, currentWordEnd);

                if (typedWordPart === targetWordPart && (currentWordEnd >= text.length || text[currentWordEnd] === " ")) {
                    lastLockedIndexRef.current = currentWordEnd;
                }
            }
        } else if (value.length < typedChars.length) {
            if (value.length <= lastLockedIndexRef.current) {
                return;
            }
        }

        if (status === "idle" && value.length === 1) {
            setStatus("playing");
            setStartTime(Date.now());
        }

        setTypedChars(value);

        // Calculate errors and streak on the fly
        let errCount = 0;
        let currentStreak = 0;
        for (let i = 0; i < value.length; i++) {
            if (value[i] !== text[i]) {
                errCount++;
                currentStreak = 0;
            } else {
                currentStreak++;
            }
        }
        setErrors(errCount);
        setStreak(currentStreak);

        // Update stats aggressively during typing for instant feedback
        const _startTime = startTime || Date.now();
        let totalPause = accumulatedPauseRef.current;
        if (pauseStartRef.current !== null) {
            totalPause += Date.now() - pauseStartRef.current;
        }
        const timeElapsed = Math.max(0.001, (Date.now() - _startTime - totalPause) / 1000 / 60);
        const correctChars = value.split("").filter((char, i) => char === text[i]).length;
        setWpm(Math.max(0, Math.floor((correctChars / 5) / timeElapsed)));
        setAccuracy(Math.max(0, Math.floor((correctChars / Math.max(1, value.length)) * 100)));

        // Check completion condition
        if (mode === "words" || mode === "quote") {
            if (value.length >= text.length) {
                completeTest();
            }
        }
    }, [status, text, mode, completeTest, startTime, typedChars]);

    // Timer logic for Time mode
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "playing" && mode === "time" && isFocused) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        return 0; // Triggers effect below
                    }
                    return prev - 1;
                });

                const stats = calculateStats();
                setWpm(stats.wpm);
                setAccuracy(stats.accuracy);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, mode, isFocused, calculateStats]);

    // Trigger test completion when timer hits 0
    useEffect(() => {
        if (mode === "time" && timeLeft === 0 && status === "playing") {
            const timer = setTimeout(() => completeTest(), 0);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, mode, status, completeTest]);

    const restartText = useCallback(() => {
        setStatus("idle");
        setTypedChars("");
        setErrors(0);
        setTimeLeft(duration);
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
        setStreak(0);
        setAccumulatedPause(0);
        pauseStartRef.current = null;
        lastLockedIndexRef.current = -1;
        if (inputRef.current) inputRef.current.focus();
    }, [duration]);

    // Global keybindings
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                restartText();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [restartText]);

    return {
        status,
        timeLeft,
        typedChars,
        errors,
        wpm,
        accuracy,
        streak,
        inputRef,
        handleInput,
        restartText,
    };
}

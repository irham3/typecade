import { useState, useEffect, useRef, useCallback } from 'react';
import { TypingEngine } from '@/lib/engine/core';

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
    const engineRef = useRef<TypingEngine>(new TypingEngine(text));
    const engine = engineRef.current;

    const [status, setStatus] = useState<GameStatus>("idle");
    const [timeLeft, setTimeLeft] = useState(duration);
    
    const [typedChars, setTypedCharsState] = useState("");
    const [errors, setErrors] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [streak, setStreak] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        engine.text = text;
    }, [text, engine]);

    useEffect(() => {
        if (status !== "playing") return;
        if (!isFocused) {
            engine.pause();
        } else {
            engine.resume();
        }
    }, [isFocused, status, engine]);

    const completeTest = useCallback(() => {
        setStatus("finished");
        engine.tick();
        const stats = engine.getStats();
        setWpm(stats.wpm);
        setAccuracy(stats.accuracy);
        
        const timeTaken = Math.floor(stats.elapsedMs / 1000);
        if (onFinish) onFinish(stats.wpm, stats.accuracy, timeTaken);
    }, [engine, onFinish]);

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (status === "finished") return;
        
        const value = e.target.value;
        
        if (status === "idle" && value.length === 1) {
            setStatus("playing");
            // engine.start() is handled inside handleInput
        }

        engine.handleInput(value);

        setTypedCharsState(engine.typedChars);
        setErrors(engine.errors);
        setWpm(engine.wpm);
        setAccuracy(engine.accuracy);
        setStreak(engine.streak);

        if (mode === "words" || mode === "quote") {
            if (engine.typedChars.length >= text.length) {
                completeTest();
            }
        }
    }, [status, engine, mode, text, completeTest]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "playing" && mode === "time" && isFocused) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
                engine.tick();
                setWpm(engine.wpm);
                setAccuracy(engine.accuracy);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status, mode, isFocused, engine]);

    useEffect(() => {
        if (mode === "time" && timeLeft === 0 && status === "playing") {
            const timer = setTimeout(() => completeTest(), 0);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, mode, status, completeTest]);

    const textRef = useRef(text);
    useEffect(() => { textRef.current = text; }, [text]);

    const restartText = useCallback(() => {
        setStatus("idle");
        engine.reset(textRef.current);
        
        setTypedCharsState("");
        setErrors(0);
        setTimeLeft(duration);
        setWpm(0);
        setAccuracy(100);
        setStreak(0);
        
        if (inputRef.current) inputRef.current.focus();
    }, [duration, engine]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                restartText();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [restartText]);

    const setTypedChars = useCallback((value: React.SetStateAction<string>) => {
        setTypedCharsState(prev => {
            const nextValue = typeof value === 'function' ? value(prev) : value;
            engine.typedChars = nextValue;
            return nextValue;
        });
    }, [engine]);

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
        setTypedChars,
    };
}

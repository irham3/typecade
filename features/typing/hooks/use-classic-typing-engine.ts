import { useState, useEffect, useRef, useCallback } from 'react';

export type GameStatus = "idle" | "playing" | "finished";

interface WordResult {
    word: string;
    typed: string;
    isCorrect: boolean;
}

interface UseClassicTypingEngineProps {
    text: string;
    duration?: number;
    mode: "time" | "words" | "quote" | "custom";
    isFocused?: boolean;
    onFinish?: (wpm: number, acc: number, time: number) => void;
}

export function useClassicTypingEngine({ text, duration = 60, mode, isFocused = true, onFinish }: UseClassicTypingEngineProps) {
    const [status, setStatus] = useState<GameStatus>("idle");
    const [timeLeft, setTimeLeft] = useState(duration);

    const [words, setWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const [wordHistory, setWordHistory] = useState<WordResult[]>([]);

    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [accumulatedPause, setAccumulatedPause] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const pauseStartRef = useRef<number | null>(null);

    // Refs for stable callbacks
    const wordsRef = useRef(words);
    const currentWordIndexRef = useRef(currentWordIndex);
    const currentInputRef = useRef(currentInput);
    const wordHistoryRef = useRef(wordHistory);
    const startTimeRef = useRef(startTime);
    const accumulatedPauseRef = useRef(accumulatedPause);

    useEffect(() => {
        setWords(text.split(/\s+/).filter(Boolean));
    }, [text]);

    useEffect(() => { wordsRef.current = words; }, [words]);
    useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);
    useEffect(() => { currentInputRef.current = currentInput; }, [currentInput]);
    useEffect(() => { wordHistoryRef.current = wordHistory; }, [wordHistory]);
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
        const _wordHistory = wordHistoryRef.current;
        const _currentInput = currentInputRef.current;
        const _words = wordsRef.current;
        const _currentWordIndex = currentWordIndexRef.current;

        if (!_startTime) return { wpm: 0, accuracy: 100 };

        let totalPause = accumulatedPauseRef.current;
        if (pauseStartRef.current !== null) {
            totalPause += Date.now() - pauseStartRef.current;
        }
        const timeElapsed = (Date.now() - _startTime - totalPause) / 1000 / 60; // in minutes

        if (timeElapsed <= 0) return { wpm: 0, accuracy: 100 };

        let correctChars = 0;
        let totalCharsTyped = 0;

        // Count locked in words
        _wordHistory.forEach(result => {
            totalCharsTyped += result.typed.length + 1; // +1 for the space
            if (result.isCorrect) {
                correctChars += result.word.length + 1;
            }
        });

        // Count current word being typed
        const targetWord = _words[_currentWordIndex] || "";
        totalCharsTyped += _currentInput.length;
        for (let i = 0; i < _currentInput.length; i++) {
            if (_currentInput[i] === targetWord[i]) correctChars++;
        }

        const currentWpm = Math.max(0, Math.floor((correctChars / 5) / timeElapsed));
        const currentAcc = Math.max(0, Math.floor((correctChars / Math.max(1, totalCharsTyped)) * 100));

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

    const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (status === "finished") return;

        const value = e.target.value;

        if (status === "idle" && value.length > 0) {
            setStatus("playing");
            setStartTime(Date.now());
        }

        // If user typed a space, lock in the word
        if (value.endsWith(' ')) {
            const typedWord = value.trim();
            const targetWord = words[currentWordIndex];

            // Only advance if there's actually a word or if they just hit space on empty
            if (typedWord.length > 0 || currentInput.length > 0) {
                const isCorrect = typedWord === targetWord;

                setWordHistory(prev => [...prev, {
                    word: targetWord,
                    typed: typedWord,
                    isCorrect
                }]);

                setCurrentInput("");
                setCurrentWordIndex(prev => prev + 1);

                // Check completion for words/quote modes
                if ((mode === "words" || mode === "quote") && currentWordIndex + 1 >= words.length) {
                    completeTest();
                }
            }
        } else {
            // Normal typing (no space)
            setCurrentInput(value);
        }

        // Update stats eagerly
        requestAnimationFrame(() => {
            const stats = calculateStats();
            setWpm(stats.wpm);
            setAccuracy(stats.accuracy);
        });

    }, [status, words, currentWordIndex, mode, completeTest, currentInput, calculateStats]);

    // Timer logic for Time mode
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (status === "playing" && mode === "time" && isFocused) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) return 0;
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
        setTimeLeft(duration);
        setStartTime(null);
        setWpm(0);
        setAccuracy(100);
        setAccumulatedPause(0);
        pauseStartRef.current = null;

        setCurrentWordIndex(0);
        setCurrentInput("");
        setWordHistory([]);

        if (inputRef.current) inputRef.current.focus();
    }, [duration]);

    // Global Escape binding
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
        words,
        currentWordIndex,
        currentInput,
        wordHistory,
        wpm,
        accuracy,
        inputRef,
        handleInput,
        restartText,
    };
}

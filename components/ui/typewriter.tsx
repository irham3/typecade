"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface TypewriterProps {
    words: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
    className?: string;
    cursorClassName?: string;
}

export function Typewriter({
    words,
    typingSpeed = 80,
    deletingSpeed = 50,
    pauseDuration = 2000,
    className = "",
    cursorClassName = "",
}: TypewriterProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const animate = useCallback(() => {
        const currentWord = words[currentWordIndex];

        if (!isDeleting) {
            if (currentText.length < currentWord.length) {
                return setTimeout(() => {
                    setCurrentText(currentWord.slice(0, currentText.length + 1));
                }, typingSpeed + Math.random() * 40);
            } else {
                return setTimeout(() => {
                    setIsDeleting(true);
                }, pauseDuration);
            }
        } else {
            if (currentText.length > 0) {
                return setTimeout(() => {
                    setCurrentText(currentWord.slice(0, currentText.length - 1));
                }, deletingSpeed);
            } else {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % words.length);
                return undefined;
            }
        }
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration]);

    useEffect(() => {
        const timeout = animate();
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [animate]);

    return (
        <span className={cn("inline-flex items-baseline", className)}>
            <span>{currentText}</span>
            <span
                className={cn(
                    "inline-block w-[3px] h-[1em] ml-0.5 bg-accent rounded-full animate-caret-blink",
                    cursorClassName
                )}
            />
        </span>
    );
}

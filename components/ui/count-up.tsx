"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
    end: number;
    start?: number;
    duration?: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    delay?: number;
    onComplete?: () => void;
}

function easeOutExpo(t: number): number {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function CountUp({
    end,
    start = 0,
    duration = 2000,
    decimals = 0,
    suffix = "",
    prefix = "",
    className = "",
    delay = 0,
    onComplete,
}: CountUpProps) {
    const [count, setCount] = useState(start);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const frameRef = useRef<number>(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        const timeout = setTimeout(() => {
            const startTime = performance.now();

            const animate = (now: number) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutExpo(progress);
                const currentValue = start + (end - start) * easedProgress;

                setCount(currentValue);

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(end);
                    onComplete?.();
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(timeout);
            cancelAnimationFrame(frameRef.current);
        };
    }, [hasStarted, end, start, duration, delay, onComplete]);

    const displayValue = decimals > 0
        ? count.toFixed(decimals)
        : Math.round(count).toString();

    return (
        <span ref={ref} className={className}>
            {prefix}{displayValue}{suffix}
        </span>
    );
}

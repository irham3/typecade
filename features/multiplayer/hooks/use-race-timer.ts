import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { RaceConfig } from "./use-room-data";

type RaceState = "waiting" | "countdown" | "racing" | "finished";

/**
 * Manages countdown and race timer. Returns `timeLeft`, `countdown`, and `startRef`.
 * Calls `onTimeUp` when the timer runs out.
 */
export function useRaceTimer({
    raceState,
    raceConfig,
    raceStartedAt,
    onTimeUp,
}: {
    raceState: RaceState;
    raceConfig: RaceConfig;
    raceStartedAt: number | null;
    onTimeUp: () => void;
}) {
    const duration = raceConfig.mode === "time" ? raceConfig.value : 300;
    const [countdown, setCountdown] = useState<number | null>(3);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [prevRaceState, setPrevRaceState] = useState(raceState);
    const [prevDuration, setPrevDuration] = useState(duration);

    // Keep onTimeUp stable inside intervals without triggering re-subscription
    const onTimeUpRef = useRef(onTimeUp);
    useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

    // Declare startRef BEFORE any useEffect that references it
    const startRef = useRef<number | null>(null);

    // Set the start time when the race begins
    useEffect(() => {
        if (raceState === "racing") {
            startRef.current = raceStartedAt ? raceStartedAt + 3000 : Date.now();
        }
    }, [raceState, raceStartedAt]);

    // Countdown tick: 3 → 2 → 1 → 0, then parent transitions to "racing"
    useEffect(() => {
        if (raceState !== "countdown" || countdown === null || countdown <= 0) return;
        const timer = setTimeout(() => {
            setCountdown(c => (c !== null && c > 0 ? c - 1 : c));
        }, 1000);
        return () => clearTimeout(timer);
    }, [raceState, countdown]);

    // Race timer: counts down while racing, calls onTimeUp when done
    useEffect(() => {
        if (raceState !== "racing") return;
        const timer = setInterval(() => {
            if (!startRef.current) return;
            const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);
            if (remaining <= 0) {
                onTimeUpRef.current();
            }
        }, 500);
        return () => clearInterval(timer);
    }, [raceState, duration]);

    // Sync state with props during render
    if (raceState !== prevRaceState || duration !== prevDuration) {
        setPrevRaceState(raceState);
        setPrevDuration(duration);
        if (raceState === "waiting") {
            setCountdown(3);
            setTimeLeft(duration);
        } else if (raceState === "countdown") {
            setTimeLeft(duration);
        }
    }

    // Reset ref when going back to waiting
    useEffect(() => {
        if (raceState === "waiting") {
            startRef.current = null;
        }
    }, [raceState]);

    return { countdown, setCountdown, timeLeft, startRef: startRef as MutableRefObject<number | null> };
}

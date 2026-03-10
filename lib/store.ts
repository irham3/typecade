import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStats {
    wpm: number;
    accuracy: number;
    tests: number;
    timeTyped: number;
    avgWpm: number;
    avgAccuracy: number;
    history: Array<{
        date: string;
        mode: string;
        wpm: number;
        accuracy: number;
        duration: number;
    }>;
    streak: number;
    lastActiveDate: string | null;
}

interface TypecadeState {
    typingStyle: "modern" | "classic";
    theme: "dark" | "light" | "forest" | "sunset" | "retro";
    sound: "off" | "soft" | "mechanical";
    caretStyle: "line" | "block" | "underscore";
    fontSize: "small" | "medium" | "large";
    language: "EN" | "ID";
    punctuation: boolean;
    numbers: boolean;
    stats: UserStats;
    setTypingStyle: (style: "modern" | "classic") => void;
    setTheme: (theme: "dark" | "light" | "forest" | "sunset" | "retro") => void;
    setSound: (sound: "off" | "soft" | "mechanical") => void;
    setCaretStyle: (style: "line" | "block" | "underscore") => void;
    setFontSize: (size: "small" | "medium" | "large") => void;
    setLanguage: (lang: "EN" | "ID") => void;
    setPunctuation: (val: boolean) => void;
    setNumbers: (val: boolean) => void;
    addTestResult: (result: { wpm: number; accuracy: number; duration: number; mode: string }) => void;
}

// Generate some dummy history
const dummyHistory = Array.from({ length: 15 }).map(() => ({
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    mode: Math.random() > 0.5 ? "Time 60s" : "Words 50",
    wpm: Math.floor(Math.random() * 40) + 60,
    accuracy: Math.floor(Math.random() * 10) + 90,
    duration: 60,
}));

export const useStore = create<TypecadeState>()(
    persist(
        (set) => ({
            typingStyle: "modern",
            theme: "dark",
            sound: "off",
            caretStyle: "line",
            fontSize: "medium",
            language: "EN",
            punctuation: false,
            numbers: false,
            stats: {
                wpm: 94,
                accuracy: 98.2,
                tests: 847,
                timeTyped: 14 * 60 + 23,
                avgWpm: 72,
                avgAccuracy: 96.4,
                history: dummyHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                streak: 1,
                lastActiveDate: "2024-03-09", // fallback placeholder 
            },
            setTypingStyle: (typingStyle) => set({ typingStyle }),
            setTheme: (theme) => set({ theme }),
            setSound: (sound) => set({ sound }),
            setCaretStyle: (caretStyle) => set({ caretStyle }),
            setFontSize: (fontSize) => set({ fontSize }),
            setLanguage: (language) => set({ language }),
            setPunctuation: (punctuation) => set({ punctuation }),
            setNumbers: (numbers) => set({ numbers }),
            addTestResult: (result) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
                const lastActive = state.stats.lastActiveDate;

                let newStreak = state.stats.streak;
                if (lastActive) {
                    const lastDate = new Date(lastActive);
                    const currentDate = new Date(today);
                    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        newStreak++; // consecutive day
                    } else if (diffDays > 1) {
                        newStreak = 1; // broken streak
                    }
                    // if diffDays === 0, keep same streak
                } else {
                    newStreak = 1;
                }

                const newHistory = [
                    {
                        date: today,
                        mode: result.mode,
                        wpm: result.wpm,
                        accuracy: result.accuracy,
                        duration: result.duration,
                    },
                    ...state.stats.history,
                ];
                return {
                    stats: {
                        ...state.stats,
                        tests: state.stats.tests + 1,
                        timeTyped: state.stats.timeTyped + (result.duration / 60),
                        history: newHistory,
                        streak: newStreak,
                        lastActiveDate: today,
                    }
                };
            }),
        }),
        {
            name: 'typecade-storage',
            partialize: (state) => ({
                typingStyle: state.typingStyle,
                theme: state.theme,
                sound: state.sound,
                caretStyle: state.caretStyle,
                fontSize: state.fontSize,
                language: state.language,
                punctuation: state.punctuation,
                numbers: state.numbers,
                stats: {
                    ...state.stats,
                    history: [] // Don't persist full history, but persist streak/lastActive
                }
            }),
        }
    )
);

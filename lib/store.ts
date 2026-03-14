import { create } from 'zustand';

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
}

interface TypecadeState {
    theme: "dark" | "light";
    sound: "off" | "soft" | "mechanical";
    caretStyle: "line" | "block" | "underscore";
    fontSize: "small" | "medium" | "large";
    language: "EN" | "ID";
    punctuation: boolean;
    numbers: boolean;
    stats: UserStats;
    setTheme: (theme: "dark" | "light") => void;
    setSound: (sound: "off" | "soft" | "mechanical") => void;
    setCaretStyle: (style: "line" | "block" | "underscore") => void;
    setFontSize: (size: "small" | "medium" | "large") => void;
    setLanguage: (lang: "EN" | "ID") => void;
    setPunctuation: (val: boolean) => void;
    setNumbers: (val: boolean) => void;
    addTestResult: (result: { wpm: number; accuracy: number; duration: number; mode: string }) => void;
}

export const useStore = create<TypecadeState>((set) => ({
    theme: "dark",
    sound: "off",
    caretStyle: "line",
    fontSize: "medium",
    language: "EN",
    punctuation: false,
    numbers: false,
    stats: {
        wpm: 0,
        accuracy: 0,
        tests: 0,
        timeTyped: 0,
        avgWpm: 0,
        avgAccuracy: 0,
        history: [],
    },
    setTheme: (theme) => set({ theme }),
    setSound: (sound) => set({ sound }),
    setCaretStyle: (caretStyle) => set({ caretStyle }),
    setFontSize: (fontSize) => set({ fontSize }),
    setLanguage: (language) => set({ language }),
    setPunctuation: (punctuation) => set({ punctuation }),
    setNumbers: (numbers) => set({ numbers }),
    addTestResult: (result) => set((state) => {
        const newHistory = [
            {
                date: new Date().toISOString().split('T')[0],
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
            }
        };
    }),
}));

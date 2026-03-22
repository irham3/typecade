import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModeOption = "Quote" | "Words" | "Time" | "Custom";

export interface UserStats {
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
    // Typing Settings
    activeTab: ModeOption;
    subOption: string;
    customWordLimit: string;
    customTimeLimit: string;
    customText: string;
    customShuffle: boolean;
    
    // Appearance & Sound
    typingStyle: "modern" | "classic";
    theme: "dark" | "light" | "forest" | "sunset" | "retro" | "nord" | "serika" | "dracula";
    sound: "off" | "soft" | "mechanical" | "arcade";
    bgm: "off" | "arcade" | "lofi" | "synthwave" | "ambient";
    caretStyle: "line" | "block" | "underscore";
    fontSize: "small" | "medium" | "large";
    language: "EN" | "ID";
    punctuation: boolean;
    numbers: boolean;
    
    // Statistics
    stats: UserStats;
    
    // UI State
    isSettingsOpen: boolean;
    isGlobalSettingsOpen: boolean;
    isThemeModalOpen: boolean;
    showAnimations: boolean;
    isTyping: boolean;
    
    // Actions
    setActiveTab: (tab: ModeOption) => void;
    setSubOption: (option: string) => void;
    setCustomWordLimit: (limit: string) => void;
    setCustomTimeLimit: (limit: string) => void;
    setCustomText: (text: string) => void;
    setCustomShuffle: (val: boolean) => void;
    setTypingStyle: (style: "modern" | "classic") => void;
    setTheme: (theme: "dark" | "light" | "forest" | "sunset" | "retro" | "nord" | "serika" | "dracula") => void;
    setSound: (sound: "off" | "soft" | "mechanical" | "arcade") => void;
    setBgm: (bgm: "off" | "arcade" | "lofi" | "synthwave" | "ambient") => void;
    setCaretStyle: (style: "line" | "block" | "underscore") => void;
    setFontSize: (size: "small" | "medium" | "large") => void;
    setLanguage: (lang: "EN" | "ID") => void;
    setPunctuation: (val: boolean) => void;
    setNumbers: (val: boolean) => void;
    setSettingsOpen: (val: boolean) => void;
    setGlobalSettingsOpen: (val: boolean) => void;
    setThemeModalOpen: (val: boolean) => void;
    setShowAnimations: (val: boolean) => void;
    setIsTyping: (val: boolean) => void;
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
            activeTab: "Time",
            subOption: "60s",
            customWordLimit: "30",
            customTimeLimit: "45",
            customText: "Typecade gives you the freedom to type anything you want. Simply edit this text and start practicing!",
            customShuffle: false,
            
            typingStyle: "modern",
            theme: "dark",
            sound: "off",
            bgm: "off",
            caretStyle: "line",
            fontSize: "medium",
            language: "EN",
            punctuation: false,
            numbers: false,
            isSettingsOpen: false,
            isGlobalSettingsOpen: false,
            isThemeModalOpen: false,
            showAnimations: true,
            isTyping: false,
            stats: {
                wpm: 94,
                accuracy: 98.2,
                tests: 847,
                timeTyped: 14 * 60 + 23,
                avgWpm: 72,
                avgAccuracy: 96.4,
                history: dummyHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            },
            
            setActiveTab: (activeTab) => set({ activeTab }),
            setSubOption: (subOption) => set({ subOption }),
            setCustomWordLimit: (customWordLimit) => set({ customWordLimit }),
            setCustomTimeLimit: (customTimeLimit) => set({ customTimeLimit }),
            setCustomText: (customText) => set({ customText }),
            setCustomShuffle: (customShuffle) => set({ customShuffle }),
            setTypingStyle: (typingStyle) => set({ typingStyle }),
            setTheme: (theme) => set({ theme }),
            setSound: (sound) => set({ sound }),
            setBgm: (bgm) => set({ bgm }),
            setCaretStyle: (caretStyle) => set({ caretStyle }),
            setFontSize: (fontSize) => set({ fontSize }),
            setLanguage: (language) => set({ language }),
            setPunctuation: (punctuation) => set({ punctuation }),
            setNumbers: (numbers) => set({ numbers }),
            setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
            setGlobalSettingsOpen: (isGlobalSettingsOpen) => set({ isGlobalSettingsOpen }),
            setThemeModalOpen: (isThemeModalOpen) => set({ isThemeModalOpen }),
            setShowAnimations: (showAnimations) => set({ showAnimations }),
            setIsTyping: (isTyping) => set({ isTyping }),
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
        }),
        {
            name: 'typecade-settings',
            // Only persist settings, not stats (optional, but usually better to separate)
            // For now let's persist everything since stats are also local
        }
    )
);


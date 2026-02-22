import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LEARN_MODULES } from '../data/lessons';

export interface LessonStat {
    lessonId: string;
    completed: boolean;
    stars: number;
    bestWpm: number;
    bestAccuracy: number;
    attempts: number;
}

interface LearnStore {
    progress: Record<string, LessonStat>;
    updateProgress: (lessonId: string, stats: { wpm: number, accuracy: number }) => void;
    getLessonStat: (lessonId: string) => LessonStat;
    isLessonLocked: (lessonId: string) => boolean;
}

const calculateStars = (wpm: number, accuracy: number) => {
    if (wpm >= 50 && accuracy >= 98) return 3;
    if (wpm >= 30 && accuracy >= 95) return 2;
    if (wpm >= 15 && accuracy >= 90) return 1;
    return 0;
};

export const useLearnStore = create<LearnStore>()(
    persist(
        (set, get) => ({
            progress: {},

            updateProgress: (lessonId, stats) => {
                const current = get().progress[lessonId] || {
                    lessonId,
                    completed: false,
                    stars: 0,
                    bestWpm: 0,
                    bestAccuracy: 0,
                    attempts: 0
                };

                const newStars = calculateStars(stats.wpm, stats.accuracy);

                set((state) => ({
                    progress: {
                        ...state.progress,
                        [lessonId]: {
                            lessonId,
                            completed: true,
                            stars: Math.max(current.stars, newStars),
                            bestWpm: Math.max(current.bestWpm, stats.wpm),
                            bestAccuracy: Math.max(current.bestAccuracy, stats.accuracy),
                            attempts: current.attempts + 1
                        }
                    }
                }));
            },

            getLessonStat: (lessonId) => {
                return get().progress[lessonId] || {
                    lessonId,
                    completed: false,
                    stars: 0,
                    bestWpm: 0,
                    bestAccuracy: 0,
                    attempts: 0
                };
            },

            isLessonLocked: (lessonId) => {
                // Flatten all lessons across all modules
                const allLessons = LEARN_MODULES.flatMap(m => m.lessons);
                const lessonIndex = allLessons.findIndex(l => l.id === lessonId);

                // First lesson is always unlocked
                if (lessonIndex <= 0) return false;

                // Check if previous lesson is completed
                const prevLesson = allLessons[lessonIndex - 1];
                const prevStat = get().progress[prevLesson.id];

                return !(prevStat && prevStat.completed);
            }
        }),
        {
            name: 'typecade-learn-progress',
        }
    )
);

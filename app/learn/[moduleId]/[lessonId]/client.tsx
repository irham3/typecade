"use client";

import { Lesson } from "@/features/learn/data/lessons";
import { PracticeArea } from "@/features/learn/components/practice-area";
import { useRouter } from "next/navigation";
import { useLearnStore } from "@/features/learn/store/learn-store";

export function PracticeClient({ lesson, nextLessonId }: { lesson: Lesson, nextLessonId?: string }) {
    const router = useRouter();
    const updateProgress = useLearnStore(state => state.updateProgress);

    return (
        <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-start pb-20 relative pt-8">
            <PracticeArea
                lesson={lesson}
                onBack={() => router.push("/learn")}
                onComplete={(stats) => {
                    updateProgress(lesson.id, stats);

                    if (nextLessonId) {
                        const path = window.location.pathname;
                        // Assuming URL is /learn/[moduleId]/[lessonId]
                        const parts = path.split('/');
                        parts.pop(); // remove current lessonId
                        parts.push(nextLessonId); // add target lessonId
                        router.push(parts.join('/'));
                    } else {
                        router.push("/learn");
                    }
                }}
            />
        </main>
    );
}

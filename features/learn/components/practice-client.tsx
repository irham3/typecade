"use client";

import { Lesson } from "@/features/learn/data/lessons";
import { PracticeArea } from "@/features/learn/components/practice-area";
import { useRouter } from "next/navigation";
import { useLearnStore } from "@/features/learn/store/learn-store";

export function PracticeClient({ lesson, moduleSlug, nextLessonSlug }: { lesson: Lesson, moduleSlug: string, nextLessonSlug?: string }) {
    const router = useRouter();
    const updateProgress = useLearnStore(state => state.updateProgress);

    return (
        <div className="w-full max-w-5xl px-6 flex flex-col items-center justify-center flex-1">
            <PracticeArea
                lesson={lesson}
                onBack={() => router.push("/learn")}
                onComplete={(stats) => {
                    updateProgress(lesson.id, stats);

                    if (nextLessonSlug) {
                        router.push(`/learn/${moduleSlug}/${nextLessonSlug}`);
                    } else {
                        router.push("/learn");
                    }
                }}
            />
        </div>
    );
}

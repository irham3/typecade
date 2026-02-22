import { Metadata } from "next";
import { LEARN_MODULES } from "@/features/learn/data/lessons";
import { notFound } from "next/navigation";
import { PracticeClient } from "./client";

export async function generateStaticParams() {
    const params: { moduleId: string, lessonId: string }[] = [];

    LEARN_MODULES.forEach(module => {
        module.lessons.forEach(lesson => {
            params.push({
                moduleId: module.id,
                lessonId: lesson.id
            });
        });
    });

    return params;
}

export async function generateMetadata({ params }: { params: Promise<{ moduleId: string, lessonId: string }> }): Promise<Metadata> {
    const { moduleId, lessonId } = await params;
    const foundModule = LEARN_MODULES.find(m => m.id === moduleId);
    const lesson = foundModule?.lessons.find(l => l.id === lessonId);

    if (!foundModule || !lesson) {
        return {
            title: "Lesson Not Found | Typecade"
        };
    }

    return {
        title: `${lesson.title} - ${foundModule.title} | Typecade Academy`,
        description: lesson.instruction,
        openGraph: {
            title: `${lesson.title} | Typecade Academy`,
            description: lesson.instruction,
            type: "website",
        }
    };
}

export default async function LessonPage({ params }: { params: Promise<{ moduleId: string, lessonId: string }> }) {
    const { moduleId, lessonId } = await params;

    // Case-insensitive finding
    const foundModule = LEARN_MODULES.find(m => m.id.toLowerCase() === moduleId.toLowerCase());
    const lesson = foundModule?.lessons.find(l => l.id.toLowerCase() === lessonId.toLowerCase());

    if (!foundModule || !lesson) {
        notFound();
    }

    const nextIdx = foundModule.lessons.findIndex(l => l.id === lesson.id) + 1;
    const nextLesson = nextIdx < foundModule.lessons.length ? foundModule.lessons[nextIdx] : null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: lesson.title,
        description: lesson.instruction,
        provider: {
            '@type': 'Organization',
            name: 'Typecade'
        }
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PracticeClient lesson={lesson} nextLessonId={nextLesson?.id} />
        </>
    );
}

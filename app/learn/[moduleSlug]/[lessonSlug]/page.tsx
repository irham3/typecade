import { Metadata } from "next";
import { LEARN_MODULES, findBySlug } from "@/features/learn/data/lessons";
import { notFound } from "next/navigation";
import { PracticeClient } from "./client";

export async function generateStaticParams() {
    const params: { moduleSlug: string, lessonSlug: string }[] = [];

    LEARN_MODULES.forEach(module => {
        module.lessons.forEach(lesson => {
            params.push({
                moduleSlug: module.slug,
                lessonSlug: lesson.slug
            });
        });
    });

    return params;
}

export async function generateMetadata({ params }: { params: Promise<{ moduleSlug: string, lessonSlug: string }> }): Promise<Metadata> {
    const { moduleSlug, lessonSlug } = await params;
    const result = findBySlug(moduleSlug, lessonSlug);

    if (!result) {
        return {
            title: "Lesson Not Found | Typecade"
        };
    }

    return {
        title: `${result.lesson.title} - ${result.module.title} | Typecade Learn`,
        description: result.lesson.instruction,
        openGraph: {
            title: `${result.lesson.title} | Typecade Learn`,
            description: result.lesson.instruction,
            type: "website",
        }
    };
}

export default async function LessonPage({ params }: { params: Promise<{ moduleSlug: string, lessonSlug: string }> }) {
    const { moduleSlug, lessonSlug } = await params;

    const result = findBySlug(moduleSlug, lessonSlug);

    if (!result) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: result.lesson.title,
        description: result.lesson.instruction,
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
            <PracticeClient
                lesson={result.lesson}
                moduleSlug={moduleSlug}
                nextLessonSlug={result.nextLesson?.slug}
            />
        </>
    );
}

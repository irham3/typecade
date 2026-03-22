import { Metadata } from "next";
import { LEARN_MODULES, findBySlug } from "@/features/learn/data/lessons";
import { notFound } from "next/navigation";
import { PracticeClient } from "@/features/learn/components/practice-client";

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
            images: [
                {
                    url: "/opengraph-image.png",
                    width: 1200,
                    height: 630,
                    alt: `${result.lesson.title} | Typecade Learn`,
                    type: "image/png",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${result.lesson.title} | Typecade Learn`,
            description: result.lesson.instruction,
            images: ["/opengraph-image.png"],
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
            
            {/* Pure Server-Side Rendered SEO Block for Cloudflare Pages Statically Exported HTML */}
            <div className="sr-only">
                <h1>{result.lesson.title} - {result.module.title} | Touch Typing Practice</h1>
                <h2>Typing Lesson Instructions:</h2>
                <p>{result.lesson.instruction}</p>
                <h3>Practice Text Sample:</h3>
                <p>{result.lesson.text}</p>
            </div>

            <PracticeClient
                lesson={result.lesson}
                moduleSlug={moduleSlug}
                nextLessonSlug={result.nextLesson?.slug}
            />
        </>
    );
}
